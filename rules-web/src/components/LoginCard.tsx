import { useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) {
      toast.error("请输入管理密码");
      return;
    }
    setLoading(true);
    try {
      const ok = await verifyPassword(password.trim());
      if (!ok) {
        toast.error("密码错误或 API 不可用");
        return;
      }
      storePassword(password.trim());
      onSuccess(password.trim());
      toast.success("已登录");
    } catch {
      toast.error("无法连接 API，请确认 rules-api 已启动");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Clash 规则管理
          </CardTitle>
          <CardDescription>输入管理密码以编辑并推送到 GitHub</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password">管理密码</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="与 rules-api .env 中 ADMIN_PASSWORD 一致"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Spinner />
                  验证中…
                </>
              ) : (
                "进入"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
