import { normalizeSubUrl } from "./genSubUrl";
import { formatProbeResult, probeConfigUrl, type ConfigProbeResult } from "./probeConfig";
import type { SubscriptionItem } from "./subscriptionUrls";

export type SubProbeResult = ConfigProbeResult & { ok: boolean };

/** 从当前浏览器直连访问机场订阅链接（不经 Clash、不经转换 API） */
export async function probeSubscriptionUrl(rawUrl: string): Promise<SubProbeResult> {
  const sub = normalizeSubUrl(rawUrl);
  if (!sub) {
    return { ok: false, status: "fail", error: "请填写机场订阅链接" };
  }
  if (!/^https?:\/\//i.test(sub)) {
    return {
      ok: false,
      status: "fail",
      error: "订阅链接应以 http:// 或 https:// 开头",
    };
  }

  const result = await probeConfigUrl(sub);
  return {
    ok: result.ok,
    status: result.status,
    ms: result.ms,
    error: result.error,
  };
}

export async function probeAllSubscriptions(
  items: SubscriptionItem[],
): Promise<Record<string, ConfigProbeResult>> {
  const entries = await Promise.all(
    items.map(async (item) => {
      const result = await probeSubscriptionUrl(item.url);
      return [
        item.id,
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

export function formatSubProbeResult(result: SubProbeResult | undefined): string {
  return formatProbeResult(result);
}
