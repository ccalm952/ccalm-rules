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

export const RULE_KINDS: RuleKind[] = ["DOMAIN-SUFFIX", "DOMAIN", "DOMAIN-KEYWORD"];

export function normalizeDomain(raw: string): string {
  let value = raw.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, "");
  value = value.split("/")[0] ?? "";
  value = value.split(":")[0] ?? "";
  value = value.replace(/^\*\./, "");
  return value;
}

export function ruleToLine(rule: CustomRule): string {
  return `${rule.kind},${rule.domain},${rule.policy}`;
}

/** 代理可选策略（不含 DIRECT，直连单独管理） */
export function proxyPolicyOptions(policies: string[]): string[] {
  return policies.filter((name) => name !== "DIRECT");
}
