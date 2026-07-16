import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyText, type MemoField } from "@/lib/memo-fields";

interface MemoFieldCopyListProps {
  fields: MemoField[];
}

export function MemoFieldCopyList({ fields }: MemoFieldCopyListProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (fields.length === 0) return null;

  async function handleCopy(key: string, value: string, label: string) {
    try {
      await copyText(value);
      setCopiedKey(key);
      toast.success(`已复制${label}`);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 1500);
    } catch {
      toast.error("复制失败");
    }
  }

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">快速复制</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() =>
            void handleCopy(
              "all",
              fields.map((f) => f.value).join("\n"),
              "全部内容",
            )
          }
        >
          {copiedKey === "all" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          复制全部值
        </Button>
      </div>
      <ul className="space-y-1.5">
        {fields.map((field, index) => {
          const key = `${index}-${field.label}`;
          const done = copiedKey === key;
          return (
            <li
              key={key}
              className="flex items-center gap-2 rounded-md border bg-background px-2.5 py-1.5"
            >
              <span className="w-16 shrink-0 truncate text-xs text-muted-foreground">
                {field.label}
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-sm" title={field.value}>
                {field.value}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 shrink-0 px-2"
                onClick={() => void handleCopy(key, field.value, field.label)}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                复制
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
