import type { ConfigSourceItem } from "./configSources";

export type ConfigProbeStatus = "idle" | "loading" | "ok" | "fail";

export type ConfigProbeResult = {
  status: ConfigProbeStatus;
  ms?: number;
  error?: string;
};

const DEFAULT_TIMEOUT_MS = 15_000;

/** 从当前浏览器直连拉取 rules.ini，测可用性与耗时（不经 Clash 代理） */
export async function probeConfigUrl(
  url: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<ConfigProbeResult & { ok: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) {
      return {
        ok: false,
        status: "fail",
        ms: Math.round(performance.now() - start),
        error: `HTTP ${res.status}`,
      };
    }
    await res.text();
    return {
      ok: true,
      status: "ok",
      ms: Math.round(performance.now() - start),
    };
  } catch (err) {
    const message =
      err instanceof DOMException && err.name === "AbortError"
        ? "超时"
        : err instanceof TypeError
          ? "网络错误或 CORS 被拦截"
          : err instanceof Error
            ? err.message
            : "请求失败";
    return {
      ok: false,
      status: "fail",
      ms: Math.round(performance.now() - start),
      error: message,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function probeAllConfigSources(
  sources: ConfigSourceItem[],
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Record<string, ConfigProbeResult>> {
  const entries = await Promise.all(
    sources.map(async (source) => {
      const result = await probeConfigUrl(source.url, timeoutMs);
      return [
        source.id,
        {
          status: result.status,
          ms: result.ms,
          error: result.error,
        } satisfies ConfigProbeResult,
      ] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export function formatProbeResult(result: ConfigProbeResult | undefined): string {
  if (!result || result.status === "idle") return "";
  if (result.status === "loading") return "检测中…";
  if (result.status === "ok" && result.ms != null) return `${result.ms} ms`;
  return result.error ?? "不可用";
}
