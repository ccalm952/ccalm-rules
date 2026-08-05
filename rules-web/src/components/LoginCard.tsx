import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
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
  const unlockingRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function tryUnlock(pin: string) {
    if (unlockingRef.current || !/^\d{4}$/.test(pin)) return;
    unlockingRef.current = true;
    setLoading(true);
    try {
      const ok = await verifyPassword(pin);
      if (!ok) {
        toast.error("密码错误");
        setPassword("");
        inputRef.current?.focus();
        return;
      }
      storePassword(pin);
      onSuccess(pin);
    } catch {
      toast.error("无法连接 API，请确认 rules-api 已启动");
      setPassword("");
      inputRef.current?.focus();
    } finally {
      unlockingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Ccalm
          </CardTitle>
          <CardDescription>输入 4 位管理密码</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
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
                const next = e.target.value.replace(/\D/g, "").slice(0, 4);
                setPassword(next);
                if (next.length === 4) void tryUnlock(next);
              }}
            />
            {loading ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <Spinner />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
