import { LogOut } from "lucide-react";
import { BookmarksEditor } from "@/components/BookmarksEditor";
import { clearPassword } from "@/components/LoginCard";
import { MemosEditor } from "@/components/MemosEditor";
import { RulesEditor } from "@/components/RulesEditor";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminShellProps {
  password: string;
  onLogout: () => void;
}

export function AdminShell({ password, onLogout }: AdminShellProps) {
  function handleLogout() {
    clearPassword();
    onLogout();
  }

  return (
    <Tabs defaultValue="rules" className="min-h-svh">
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
        <RulesEditor password={password} />
      </TabsContent>
      <TabsContent value="bookmarks" className="mt-0 focus-visible:outline-none">
        <BookmarksEditor password={password} />
      </TabsContent>
      <TabsContent value="memos" className="mt-0 focus-visible:outline-none">
        <MemosEditor password={password} />
      </TabsContent>
    </Tabs>
  );
}
