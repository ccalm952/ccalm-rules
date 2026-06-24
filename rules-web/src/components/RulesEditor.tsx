import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, ListX, Plus, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmButton } from "@/components/DeleteConfirmButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchRules, saveRules } from "@/lib/api";
import {
  normalizeDomain,
  proxyPolicyOptions,
  RULE_KINDS,
  ruleToLine,
  type CustomRule,
  type RuleKind,
} from "@/lib/rules";

interface RulesEditorProps {
  password: string;
}

type ModeOption = { label: string; value: "direct" | "proxy" };

const MODE_OPTIONS: ModeOption[] = [
  { label: "直连 DIRECT", value: "direct" },
  { label: "代理", value: "proxy" },
];

function ruleKey(rule: CustomRule) {
  return `${rule.kind}:${rule.domain}:${rule.policy}`;
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function RulesEditor({ password }: RulesEditorProps) {
  const [direct, setDirect] = useState<CustomRule[]>([]);
  const [proxy, setProxy] = useState<CustomRule[]>([]);
  const [policies, setPolicies] = useState<string[]>(["DIRECT"]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commitUrl, setCommitUrl] = useState<string | null>(null);

  const [domain, setDomain] = useState("");
  const [kind, setKind] = useState<RuleKind>("DOMAIN-SUFFIX");
  const [mode, setMode] = useState<"direct" | "proxy">("direct");
  const [policy, setPolicy] = useState("手动选择");

  const proxyOptions = useMemo(() => proxyPolicyOptions(policies), [policies]);
  const selectedMode = useMemo(
    () => MODE_OPTIONS.find((option) => option.value === mode) ?? MODE_OPTIONS[0],
    [mode],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRules(password);
      setDirect(data.direct);
      setProxy(data.proxy);
      setPolicies(data.policies);
      const options = proxyPolicyOptions(data.policies);
      setPolicy((current) => (options.includes(current) ? current : options[0] ?? "手动选择"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleAdd() {
    const normalized = normalizeDomain(domain);
    if (!normalized || !/^[a-z0-9.-]+$/.test(normalized)) {
      toast.error("请输入合法域名，如 example.com");
      return;
    }

    const rule: CustomRule = {
      kind,
      domain: normalized,
      policy: mode === "direct" ? "DIRECT" : policy,
    };

    const list = mode === "direct" ? direct : proxy;
    if (list.some((item) => item.domain === normalized && item.kind === kind)) {
      toast.error("该域名规则已存在");
      return;
    }

    if (mode === "direct") {
      setDirect([...direct, rule]);
    } else {
      setProxy([...proxy, rule]);
    }
    setDomain("");
    toast.success("已添加到列表（尚未推送）");
  }

  function removeRule(target: CustomRule, list: "direct" | "proxy") {
    const filter = (items: CustomRule[]) => items.filter((item) => ruleKey(item) !== ruleKey(target));
    if (list === "direct") setDirect(filter(direct));
    else setProxy(filter(proxy));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await saveRules(password, {
        direct,
        proxy,
        message: "Update custom rules in ccalm-rules.yaml via rules-web",
      });
      setCommitUrl(result.commitUrl ?? null);
      toast.success("已推送到 GitHub");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  const preview = useMemo(() => {
    const lines = [
      "rules:",
      "  # 自定义（由 rules-web/ 管理页维护）",
      "  # 自定义直连",
      ...direct.map((r) => `  - ${ruleToLine(r)}`),
      "",
      "  # 自定义代理",
      ...proxy.map((r) => `  - ${ruleToLine(r)}`),
      "",
      "  # ACL4SSR",
      "  ...",
    ];
    return lines.join("\n");
  }, [direct, proxy]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-12">
      <div className="flex flex-wrap items-start justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clash 自定义规则</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            直接写入 <code className="rounded bg-muted px-1">ccalm-rules.yaml</code>，策略组从配置文件自动读取
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? <Spinner /> : <RefreshCw />}
            刷新
          </Button>
          <Button size="sm" onClick={() => void handleSave()} disabled={saving || loading}>
            {saving ? <Spinner /> : <Save />}
            推送到 GitHub
          </Button>
        </div>
      </div>

      {commitUrl ? (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>推送成功</AlertTitle>
          <AlertDescription>
            <Button variant="link" asChild className="h-auto p-0">
              <a href={commitUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
                查看 commit
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>添加规则</CardTitle>
          <CardDescription>
            代理规则可选全部策略组：{proxyOptions.join("、") || "加载中…"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="domain">域名</Label>
              <Input
                id="domain"
                placeholder="example.com 或 https://www.example.com/path"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div className="space-y-2">
              <Label>匹配方式</Label>
              <Combobox
                items={[...RULE_KINDS]}
                value={kind}
                onValueChange={(value) => value && setKind(value as RuleKind)}
              >
                <ComboboxInput placeholder="选择匹配方式" showClear={false} className="w-full" />
                <ComboboxContent>
                  <ComboboxEmpty>无匹配项</ComboboxEmpty>
                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem key={item} value={item}>
                        {item}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            <div className="space-y-2">
              <Label>类型</Label>
              <Combobox
                items={MODE_OPTIONS}
                value={selectedMode}
                onValueChange={(option) => option && setMode(option.value)}
                itemToStringValue={(option) => option.label}
                isItemEqualToValue={(a, b) => a.value === b.value}
              >
                <ComboboxInput placeholder="选择类型" showClear={false} className="w-full" />
                <ComboboxContent>
                  <ComboboxEmpty>无匹配项</ComboboxEmpty>
                  <ComboboxList>
                    {(option) => (
                      <ComboboxItem key={option.value} value={option}>
                        {option.label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            {mode === "proxy" ? (
              <div className="space-y-2 sm:col-span-2">
                <Label>策略组 / 节点</Label>
                <Select value={policy} onValueChange={setPolicy}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择策略组" />
                  </SelectTrigger>
                  <SelectContent>
                    {proxyOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
          <Button type="button" variant="secondary" onClick={handleAdd}>
            <Plus />
            添加到列表
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <RuleList
          title="自定义直连"
          badge="DIRECT"
          rules={direct}
          loading={loading}
          onRemove={(r) => removeRule(r, "direct")}
        />
        <RuleList
          title="自定义代理"
          badge="PROXY"
          rules={proxy}
          loading={loading}
          onRemove={(r) => removeRule(r, "proxy")}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ccalm-rules.yaml 预览（自定义段）</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48 rounded-md border">
            <pre className="bg-muted p-3 text-xs leading-relaxed">{preview}</pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function RuleList({
  title,
  badge,
  rules,
  loading,
  onRemove,
}: {
  title: string;
  badge: string;
  rules: CustomRule[];
  loading: boolean;
  onRemove: (rule: CustomRule) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <Badge variant="secondary">{badge}</Badge>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ListSkeleton />
        ) : rules.length === 0 ? (
          <Empty className="border-0 p-4 md:p-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ListX />
              </EmptyMedia>
              <EmptyTitle>暂无规则</EmptyTitle>
              <EmptyDescription>在上方表单添加后，点击「推送到 GitHub」生效</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>域名</TableHead>
                <TableHead>匹配</TableHead>
                <TableHead>策略</TableHead>
                <TableHead className="w-[52px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={ruleKey(rule)}>
                  <TableCell className="max-w-[120px] truncate font-medium">{rule.domain}</TableCell>
                  <TableCell className="text-muted-foreground">{rule.kind}</TableCell>
                  <TableCell>{rule.policy}</TableCell>
                  <TableCell>
                    <DeleteConfirmButton
                      title="删除规则"
                      description={`确定从列表中移除 ${rule.domain} 吗？需推送后才会从 GitHub 删除。`}
                      onConfirm={() => onRemove(rule)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
