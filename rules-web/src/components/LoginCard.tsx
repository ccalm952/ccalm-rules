import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { verifyPassword } from "@/lib/api";

const STORAGE_KEY = "rules-web-password";

export function getStoredPassword(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function storePassword(password: string) {
  sessionStorage.setItem(STORAGE_KEY, password);
}

export function clearPassword() {
  sessionStorage.removeItem(STORAGE_KEY);
}

interface LoginCardProps {
  onSuccess: (password: string) => void;
}

export function LoginCard({ onSuccess }: LoginCardProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(password)) {
      toast.error("请输入 4 位数字密码");
      return;
    }
    setLoading(true);
    try {
      const ok = await verifyPassword(password);
      if (!ok) {
        toast.error("密码错误或 API 不可用");
        setPassword("");
        inputRef.current?.focus();
        return;
      }
      storePassword(password);
      onSuccess(password);
      toast.success("已登录");
    } catch {
      toast.error("无法连接 API，请确认 rules-api 已启动");
      setPassword("");
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Clash 规则管理
          </CardTitle>
          <CardDescription>输入 4 位管理密码</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              ref={inputRef}
              id="password"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              placeholder="••••"
              value={password}
              disabled={loading}
              className="text-center text-lg tracking-[0.4em]"
              onChange={(e) => {
                setPassword(e.target.value.replace(/\D/g, "").slice(0, 4));
              }}
            />
            <Button type="submit" className="w-full" disabled={loading || password.length !== 4}>
              {loading ? (
                <>
                  <Spinner />
                  验证中…
                </>
              ) : (
                "确认"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
