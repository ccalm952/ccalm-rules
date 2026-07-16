import { lazy, Suspense, useState } from "react";
import { LogOut } from "lucide-react";
import { clearPassword } from "@/components/LoginCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RulesEditor = lazy(() =>
  import("@/components/RulesEditor").then((m) => ({ default: m.RulesEditor })),
);
const BookmarksEditor = lazy(() =>
  import("@/components/BookmarksEditor").then((m) => ({ default: m.BookmarksEditor })),
);
const MemosEditor = lazy(() =>
  import("@/components/MemosEditor").then((m) => ({ default: m.MemosEditor })),
);

interface AdminShellProps {
  password: string;
  onLogout: () => void;
}

function TabFallback() {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
      <Spinner />
      加载中…
    </div>
  );
}

export function AdminShell({ password, onLogout }: AdminShellProps) {
  const [tab, setTab] = useState("rules");

  function handleLogout() {
    clearPassword();
    onLogout();
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="min-h-svh">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <TabsList>
            <TabsTrigger value="rules">Clash 规则</TabsTrigger>
            <TabsTrigger value="bookmarks">常用网址</TabsTrigger>
            <TabsTrigger value="memos">备忘录</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut />
            退出
          </Button>
        </div>
        <Separator />
      </header>

      <TabsContent value="rules" className="mt-0 focus-visible:outline-none">
        {tab === "rules" ? (
          <Suspense fallback={<TabFallback />}>
            <RulesEditor password={password} />
          </Suspense>
        ) : null}
      </TabsContent>
      <TabsContent value="bookmarks" className="mt-0 focus-visible:outline-none">
        {tab === "bookmarks" ? (
          <Suspense fallback={<TabFallback />}>
            <BookmarksEditor password={password} />
          </Suspense>
        ) : null}
      </TabsContent>
      <TabsContent value="memos" className="mt-0 focus-visible:outline-none">
        {tab === "memos" ? (
          <Suspense fallback={<TabFallback />}>
            <MemosEditor password={password} />
          </Suspense>
        ) : null}
      </TabsContent>
    </Tabs>
  );
}
