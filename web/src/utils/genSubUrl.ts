import { getConfigSourceById } from "./configSources";

export function normalizeSubUrl(raw: string) {
  if (!raw) return "";
  let s = raw.trim().replace(/^\uFEFF/, "");
  s = s.replace(/^[\s?？]+/, "");
  for (const [a, b] of [
    ['"', '"'],
    ["'", "'"],
  ] as const) {
    if (s.length >= 2 && s.startsWith(a) && s.endsWith(b)) {
      s = s.slice(1, -1).trim();
      break;
    }
  }
  if (!/^https?:\/\//i.test(s)) {
    const m = s.match(/(https?:\/\/\S+)/i);
    if (m) s = m[1].replace(/["')\]}]+$/, "");
  }
  return s.trim();
}

export function buildSubConverterUrl({
  subUrl,
  configSourceId,
  include,
  noInclude,
  apiBaseUrl,
}: {
  subUrl: string;
  configSourceId: string;
  include: string;
  noInclude: boolean;
  apiBaseUrl: string;
}) {
  const sub = normalizeSubUrl(subUrl);
  if (!sub) {
    return { error: "请填写机场订阅链接" } as const;
  }
  if (!/^https?:\/\//i.test(sub)) {
    return {
      error: `订阅链接应以 http:// 或 https:// 开头\n\n当前解析为：${sub}`,
    } as const;
  }

  const configSource = getConfigSourceById(configSourceId);
  if (!configSource) {
    return { error: "请选择 rules.ini 来源" } as const;
  }

  const params = new URLSearchParams();
  params.set("target", "clash");
  params.set("url", sub);
  params.set("config", configSource.url);
  if (!noInclude) {
    const inc = include.trim();
    if (inc) params.set("include", inc);
  }

  const base = apiBaseUrl.trim().replace(/\/+$/, "");
  if (!base) {
    return { error: "请选择或添加转换后端" } as const;
  }

  return { url: `${base}?${params.toString()}` } as const;
}
