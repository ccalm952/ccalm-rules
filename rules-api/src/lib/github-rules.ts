import { env } from "../config/env.js";

export type RuleKind = "DOMAIN" | "DOMAIN-SUFFIX" | "DOMAIN-KEYWORD";

export interface CustomRule {
  kind: RuleKind;
  domain: string;
  policy: string;
}

export interface RulesPayload {
  direct: CustomRule[];
  proxy: CustomRule[];
  policies: string[];
  sha: string | null;
}

const CONFIG_FILE = "ccalm-rules.yaml";
const RULE_LINE = /^\s*-\s*(DOMAIN(?:-SUFFIX|-KEYWORD)?),([^,]+),(.+)\s*$/;
const DIRECT_MARKER = "# 自定义直连";
const PROXY_MARKER = "# 自定义代理";
const ACL4SSR_MARKER = "# ACL4SSR";

function parseRuleLine(line: string): CustomRule | null {
  const match = line.match(RULE_LINE);
  if (!match) return null;
  return {
    kind: match[1] as RuleKind,
    domain: match[2].trim(),
    policy: match[3].trim(),
  };
}

function parsePolicies(content: string): string[] {
  const idx = content.indexOf("proxy-groups:");
  if (idx === -1) return ["DIRECT"];

  const section = content.slice(idx);
  const names: string[] = [];
  for (const line of section.split("\n")) {
    const match = line.match(/^\s*-\s*name:\s*(.+)\s*$/);
    if (match) names.push(match[1].trim());
  }

  return ["DIRECT", ...names];
}

function parseCustomRules(content: string): { direct: CustomRule[]; proxy: CustomRule[] } {
  const rulesIdx = content.indexOf("rules:");
  if (rulesIdx === -1) return { direct: [], proxy: [] };

  const aclIdx = content.indexOf(ACL4SSR_MARKER, rulesIdx);
  if (aclIdx === -1) return { direct: [], proxy: [] };

  const customBlock = content.slice(rulesIdx, aclIdx);
  const directIdx = customBlock.indexOf(DIRECT_MARKER);
  const proxyIdx = customBlock.indexOf(PROXY_MARKER);

  const directBlock =
    directIdx === -1 ? "" : customBlock.slice(directIdx, proxyIdx === -1 ? customBlock.length : proxyIdx);
  const proxyBlock = proxyIdx === -1 ? "" : customBlock.slice(proxyIdx);

  const direct: CustomRule[] = [];
  const proxy: CustomRule[] = [];

  for (const line of directBlock.split("\n")) {
    const rule = parseRuleLine(line);
    if (rule) direct.push({ ...rule, policy: "DIRECT" });
  }

  for (const line of proxyBlock.split("\n")) {
    const rule = parseRuleLine(line);
    if (rule) proxy.push(rule);
  }

  return { direct, proxy };
}

function buildCustomBlock(direct: CustomRule[], proxy: CustomRule[]): string {
  const directLines = direct.map((rule) => `  - ${rule.kind},${rule.domain},DIRECT`);
  const proxyLines = proxy.map((rule) => `  - ${rule.kind},${rule.domain},${rule.policy}`);

  return [
    "  # 自定义（由 rules-web/ 管理页维护）",
    "  # 自定义直连",
    ...directLines,
    "",
    "  # 自定义代理",
    ...proxyLines,
    "",
  ].join("\n");
}

function mergeCustomRules(content: string, direct: CustomRule[], proxy: CustomRule[]): string {
  const rulesIdx = content.indexOf("rules:");
  if (rulesIdx === -1) throw new Error("ccalm-rules.yaml 缺少 rules: 段");

  const aclIdx = content.indexOf(ACL4SSR_MARKER, rulesIdx);
  if (aclIdx === -1) throw new Error("ccalm-rules.yaml 缺少 # ACL4SSR 标记");

  const before = content.slice(0, rulesIdx + "rules:\n".length);
  let after = content.slice(aclIdx);
  if (!after.startsWith("  # ACL4SSR")) {
    after = after.replace(/^\s*# ACL4SSR/, "  # ACL4SSR");
  }
  return `${before}${buildCustomBlock(direct, proxy)}${after}`;
}

function validateRules(rules: CustomRule[], allowedPolicies: Set<string>, requireDirect: boolean): string | null {
  for (const rule of rules) {
    if (!/^[a-z0-9.-]+$/.test(rule.domain)) {
      return `非法域名: ${rule.domain}`;
    }
    if (requireDirect && rule.policy !== "DIRECT") {
      return `直连规则必须为 DIRECT: ${rule.domain}`;
    }
    if (!requireDirect && !allowedPolicies.has(rule.policy)) {
      return `未知策略组: ${rule.policy}`;
    }
    if (!requireDirect && rule.policy === "DIRECT") {
      return `请使用「自定义直连」添加 DIRECT 规则: ${rule.domain}`;
    }
  }
  return null;
}

async function githubGetFile(path: string): Promise<{ content: string; sha: string | null }> {
  const url = `https://api.github.com/repos/${env.githubOwner}/${env.githubRepo}/contents/${path}?ref=${env.githubBranch}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.githubToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "rules-api",
    },
  });

  if (res.status === 404) {
    throw new Error(`${path} 不存在`);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub GET failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { content: string; sha: string };
  const decoded = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
  return { content: decoded, sha: data.sha };
}

async function githubPutFile(
  path: string,
  content: string,
  sha: string | null,
  message: string,
): Promise<{ commitUrl: string }> {
  const url = `https://api.github.com/repos/${env.githubOwner}/${env.githubRepo}/contents/${path}`;
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
    branch: env.githubBranch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${env.githubToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "rules-api",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub PUT failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { commit: { html_url: string } };
  return { commitUrl: data.commit.html_url };
}

export async function loadRules(): Promise<RulesPayload> {
  const file = await githubGetFile(CONFIG_FILE);
  const { direct, proxy } = parseCustomRules(file.content);
  const policies = parsePolicies(file.content);

  return {
    direct,
    proxy,
    policies,
    sha: file.sha,
  };
}

export async function saveRules(
  direct: CustomRule[],
  proxy: CustomRule[],
  message?: string,
): Promise<{ commitUrl: string }> {
  const current = await loadRules();
  const allowed = new Set(current.policies);

  const directErr = validateRules(direct, allowed, true);
  if (directErr) throw new Error(directErr);

  const proxyErr = validateRules(proxy, allowed, false);
  if (proxyErr) throw new Error(proxyErr);

  const file = await githubGetFile(CONFIG_FILE);
  const nextContent = mergeCustomRules(file.content, direct, proxy);
  const commitMessage = message?.trim() || "Update custom rules in ccalm-rules.yaml via rules-web";

  return githubPutFile(CONFIG_FILE, nextContent, file.sha, commitMessage);
}
