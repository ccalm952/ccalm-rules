import { useState } from "react";
import { Check, Copy, KeyRound, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copyText } from "@/lib/memo-fields";
import {
  DEFAULT_PASSWORD_OPTIONS,
  generatePassword,
  type PasswordOptions,
} from "@/lib/password";
import { cn } from "@/lib/utils";

interface MemoPasswordGeneratorProps {
  onInsert: (password: string) => void;
}

export function MemoPasswordGenerator({ onInsert }: MemoPasswordGeneratorProps) {
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_PASSWORD_OPTIONS);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  function handleGenerate() {
    try {
      const next = generatePassword(options);
      setPassword(next);
      setCopied(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "生成失败");
    }
  }

  async function handleCopy() {
    if (!password) {
      toast.error("请先生成密码");
      return;
    }
    try {
      await copyText(password);
      setCopied(true);
      toast.success("已复制密码");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("复制失败");
    }
  }

  function handleInsert() {
    if (!password) {
      toast.error("请先生成密码");
      return;
    }
    onInsert(password);
    toast.success("已插入正文");
  }

  function toggle(key: keyof Omit<PasswordOptions, "length">) {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <KeyRound className="h-4 w-4" />
        随机密码
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-24 space-y-1.5">
          <Label htmlFor="password-length" className="text-xs">
            长度
          </Label>
          <Input
            id="password-length"
            type="number"
            min={4}
            max={128}
            value={options.length}
            onChange={(e) =>
              setOptions((prev) => ({
                ...prev,
                length: Number(e.target.value) || prev.length,
              }))
            }
          />
        </div>
        <div className="flex flex-wrap gap-3 pb-2 text-xs">
          {(
            [
              ["lower", "小写"],
              ["upper", "大写"],
              ["digits", "数字"],
              ["symbols", "符号"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={options[key]}
                onChange={() => toggle(key)}
                className="size-3.5 rounded border"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "flex min-h-9 items-center rounded-md border bg-background px-2.5 font-mono text-sm",
          !password && "text-muted-foreground",
        )}
      >
        <span className="min-w-0 flex-1 truncate">{password || "点击生成"}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={handleGenerate}>
          <RefreshCw />
          生成
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => void handleCopy()}>
          {copied ? <Check /> : <Copy />}
          复制
        </Button>
        <Button type="button" size="sm" onClick={handleInsert}>
          插入正文
        </Button>
      </div>
    </div>
  );
}
