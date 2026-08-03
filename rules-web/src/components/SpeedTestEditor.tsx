import { useState } from "react";
import { Gauge, Play } from "lucide-react";
import { toast } from "sonner";
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

const PRESETS = [
  { label: "百度", url: "https://www.baidu.com" },
  { label: "谷歌", url: "https://www.google.com" },
  { label: "GitHub", url: "https://github.com" },
  { label: "YouTube", url: "https://www.youtube.com" },
  { label: "Cloudflare", url: "https://www.cloudflare.com" },
];

interface SpeedTestEditorProps {
  password: string;
}

export function SpeedTestEditor(_props: SpeedTestEditorProps) {
  const [url, setUrl] = useState("https://www.google.com");
  const [rounds, setRounds] = useState(3);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<LatencyResult | null>(null);

  async function runTest(target = url) {
    if (!target.trim()) {
      toast.error("请输入网址");
      return;
    }

    setRunning(true);
    setResult(null);
    try {
      const data = await measureLatency(target, Math.min(Math.max(rounds, 1), 10));
      setResult(data);
      if (data.avg == null) {
        toast.error("全部失败，请检查网址或网络");
      } else {
        toast.success(`平均 ${data.avg} ms`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "测速失败");
    } finally {
      setRunning(false);
    }
  }

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
                className="w-24"
                value={rounds}
                disabled={running}
                onChange={(e) => setRounds(Number(e.target.value) || 1)}
              />
            </div>
            <Button type="button" disabled={running} onClick={() => void runTest()}>
              {running ? <Spinner /> : <Play />}
              {running ? "测速中…" : "开始测速"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">结果</CardTitle>
            <CardDescription className="break-all">{result.url}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">最小</div>
                <div className="mt-1 text-xl font-semibold">
                  {result.min == null ? "—" : `${result.min} ms`}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">平均</div>
                <div className="mt-1 text-xl font-semibold">
                  {result.avg == null ? "—" : `${result.avg} ms`}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">最大</div>
                <div className="mt-1 text-xl font-semibold">
                  {result.max == null ? "—" : `${result.max} ms`}
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>第几次</TableHead>
                  <TableHead>耗时</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.samples.map((s, i) => (
                  <TableRow key={`${i}-${s.ms}`}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{s.ms} ms</TableCell>
                    <TableCell>{s.ok ? "成功" : s.error || "失败"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
