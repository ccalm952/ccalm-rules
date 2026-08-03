export interface LatencySample {
  ms: number;
  ok: boolean;
  error?: string;
}

export interface LatencyResult {
  url: string;
  samples: LatencySample[];
  min: number | null;
  avg: number | null;
  max: number | null;
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("请输入网址");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** 在浏览器本机发起请求，测本地网络到目标站的耗时（经软路由/代理路径）。 */
export async function measureOnce(rawUrl: string, timeoutMs = 12000): Promise<LatencySample> {
  const url = new URL(normalizeUrl(rawUrl));
  url.searchParams.set("_t", String(Date.now()));

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();

  try {
    // no-cors：多数站点可测通；耗时含建连与收到响应，反映本机到站点路径
    await fetch(url.toString(), {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    });
    return { ms: Math.round(performance.now() - start), ok: true };
  } catch (err) {
    const ms = Math.round(performance.now() - start);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ms, ok: false, error: "超时" };
    }
    return {
      ms,
      ok: false,
      error: err instanceof Error ? err.message : "请求失败",
    };
  } finally {
    window.clearTimeout(timer);
  }
}

export async function measureLatency(
  rawUrl: string,
  rounds = 3,
  timeoutMs = 12000,
): Promise<LatencyResult> {
  const url = normalizeUrl(rawUrl);
  const samples: LatencySample[] = [];

  for (let i = 0; i < rounds; i++) {
    samples.push(await measureOnce(url, timeoutMs));
  }

  const okSamples = samples.filter((s) => s.ok).map((s) => s.ms);
  const min = okSamples.length ? Math.min(...okSamples) : null;
  const max = okSamples.length ? Math.max(...okSamples) : null;
  const avg = okSamples.length
    ? Math.round(okSamples.reduce((a, b) => a + b, 0) / okSamples.length)
    : null;

  return { url, samples, min, avg, max };
}
