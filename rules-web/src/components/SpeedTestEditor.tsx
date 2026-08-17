import { useCallback, useRef, useState } from "react";
import { Gauge, History, Play, Square } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { measureLatency, type LatencyResult } from "@/lib/latency-test";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "百度", url: "https://www.baidu.com" },
  { label: "谷歌", url: "https://www.google.com" },
  { label: "GitHub", url: "https://github.com" },
  { label: "YouTube", url: "https://www.youtube.com" },
  { label: "Cloudflare", url: "https://www.cloudflare.com" },
];

const HISTORY_KEY = "speedtest-history";
const HISTORY_MAX = 8;

interface HistoryEntry {
  url: string;
  avg: number | null;
  ok: number;
  total: number;
  ts: number;
}

interface SpeedTestEditorProps {
  password: string;
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function latencyColor(ms: number | null) {
  if (ms == null) return "text-muted-foreground";
  if (ms < 150) return "text-emerald-600";
  if (ms < 400) return "text-amber-600";
  return "text-red-600";
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function SpeedTestEditor(_props: SpeedTestEditorProps) {
  const [url, setUrl] = useState("https://www.google.com");
  const [rounds, setRounds] = useState(3);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 3 });
  const [result, setResult] = useState<LatencyResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const abortRef = useRef<AbortController | null>(null);

  const runTest = useCallback(
    async (target = url) => {
      if (!target.trim()) {
        toast.error("请输入网址");
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setRunning(true);
      setResult(null);
      setProgress({ done: 0, total: rounds });

      try {
        const data = await measureLatency(
          target,
          rounds,
          12000,
          ({ done, total }) => setProgress({ done, total }),
          controller.signal,
        );
        setResult(data);

        const cancelled = data.samples.length < rounds;
        const okCount = data.samples.filter((s) => s.ok).length;
        setHistory((prev) => {
          const next = [
            { url: data.url, avg: data.avg, ok: okCount, total: data.samples.length, ts: Date.now() },
            ...prev.filter((h) => h.url !== data.url),
          ].slice(0, HISTORY_MAX);
          try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
          } catch {
            /* ignore */
          }
          return next;
        });

        if (data.avg == null) {
          toast.error("全部失败，请检查网址或网络");
        } else if (cancelled) {
          toast.info(`已取消，平均 ${data.avg} ms（完成 ${data.samples.length}/${rounds} 次）`);
        } else {
          toast.success(`平均 ${data.avg} ms`);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "测速失败");
      } finally {
        setRunning(false);
        abortRef.current = null;
      }
    },
    [url, rounds],
  );

  function handleCancel() {
    abortRef.current?.abort();
  }

  function handleRounds(value: string) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      setRounds(1);
      return;
    }
    setRounds(Math.min(10, Math.max(1, Math.round(n))));
  }

  function handleClearHistory() {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
  }

  const okCount = result ? result.samples.filter((s) => s.ok).length : 0;
  const cancelled = result != null && result.samples.length < progress.total;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-12">
      <div className="pt-2">
        <h1 className="text-2xl font-semibold tracking-tight">网页测速</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          在你的浏览器本机发起请求，测本地网络（含软路由/代理）到目标站的延迟，不是服务器去 ping
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="size-4" />
            测试目标
          </CardTitle>
          <CardDescription>支持填写域名或完整 URL；默认测 3 次取平均</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="speed-url">网址</Label>
            <Input
              id="speed-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.google.com"
              disabled={running}
              onKeyDown={(e) => {
                if (e.key === "Enter") void runTest();
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.url}
                type="button"
                variant="outline"
                size="sm"
                disabled={running}
                onClick={() => {
                  setUrl(p.url);
                  void runTest(p.url);
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="speed-rounds">次数</Label>
              <Input
                id="speed-rounds"
                type="number"
                min={1}
                max={10}
                step={1}
                className="w-24"
                value={rounds}
                disabled={running}
                onChange={(e) => handleRounds(e.target.value)}
              />
            </div>
            <Button type="button" disabled={running} onClick={() => void runTest()}>
              {running ? <Spinner /> : <Play />}
              {running ? "测速中…" : "开始测速"}
            </Button>
            {running ? (
              <Button type="button" variant="outline" onClick={handleCancel}>
                <Square className="size-4" />
                取消
              </Button>
            ) : null}
          </div>

          {running ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>正在测速…</span>
                <span>
                  第 {progress.done}/{progress.total} 次
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${(progress.done / progress.total) * 100}%` }}
                />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div className="min-w-0">
              <CardTitle className="text-base">结果</CardTitle>
              <CardDescription className="break-all">{result.url}</CardDescription>
            </div>
            <Badge
              variant={
                okCount === result.samples.length && result.samples.length > 0
                  ? "default"
                  : okCount > 0
                    ? "secondary"
                    : "outline"
              }
              className={cn("shrink-0", okCount === 0 && "text-destructive")}
            >
              成功 {okCount}/{result.samples.length}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">最小</div>
                <div className={cn("mt-1 text-xl font-semibold", latencyColor(result.min))}>
                  {result.min == null ? "—" : `${result.min} ms`}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">平均</div>
                <div className={cn("mt-1 text-xl font-semibold", latencyColor(result.avg))}>
                  {result.avg == null ? "—" : `${result.avg} ms`}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">最大</div>
                <div className={cn("mt-1 text-xl font-semibold", latencyColor(result.max))}>
                  {result.max == null ? "—" : `${result.max} ms`}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">抖动</div>
                <div className="mt-1 text-xl font-semibold">
                  {result.min != null && result.max != null ? `${result.max - result.min} ms` : "—"}
                </div>
              </div>
            </div>

            {cancelled ? (
              <p className="text-xs text-muted-foreground">
                已取消，仅完成前 {result.samples.length} 次
              </p>
            ) : null}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">第几次</TableHead>
                  <TableHead>耗时</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.samples.map((s, i) => (
                  <TableRow key={`${i}-${s.ok}-${s.ms}`}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className={cn(s.ok && "font-medium", !s.ok && "text-muted-foreground")}>
                      {s.ms} ms
                    </TableCell>
                    <TableCell>
                      {s.ok ? (
                        <Badge variant="secondary">成功</Badge>
                      ) : (
                        <span
                          className="inline-flex max-w-[240px] items-center gap-1.5 truncate text-sm text-destructive"
                          title={s.error}
                        >
                          <span className="shrink-0">失败</span>
                          {s.error ? (
                            <span className="truncate text-muted-foreground">{s.error}</span>
                          ) : null}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {history.length > 0 ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="size-4" />
              最近测试
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClearHistory}>
              清空
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {history.map((h) => (
                <Button
                  key={h.url}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={running}
                  onClick={() => {
                    setUrl(h.url);
                    void runTest(h.url);
                  }}
                >
                  <span className="max-w-[160px] truncate">{hostOf(h.url)}</span>
                  <Badge
                    variant={h.ok === h.total ? "secondary" : "outline"}
                    className={cn(
                      "ml-1 font-normal",
                      h.avg != null && h.ok === h.total && latencyColor(h.avg),
                      h.avg == null && "text-destructive",
                    )}
                  >
                    {h.avg != null ? `${h.avg}ms` : "失败"}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
