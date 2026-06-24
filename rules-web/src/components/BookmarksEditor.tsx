import { useCallback, useEffect, useState } from "react";
import { Bookmark, ExternalLink, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmButton } from "@/components/DeleteConfirmButton";
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
import {
  createBookmark,
  deleteBookmark,
  fetchBookmarks,
  type Bookmark as BookmarkItem,
} from "@/lib/api";

interface BookmarksEditorProps {
  password: string;
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

export function BookmarksEditor({ password }: BookmarksEditorProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBookmarks(password);
      setBookmarks(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAdd() {
    if (!title.trim() || !url.trim()) {
      toast.error("请填写标题和 URL");
      return;
    }

    setSaving(true);
    try {
      await createBookmark(password, {
        title: title.trim(),
        url: url.trim(),
        category: category.trim(),
        sortOrder: bookmarks.length,
        icon: "",
      });
      setTitle("");
      setUrl("");
      toast.success("已添加");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "添加失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteBookmark(password, id);
      toast.success("已删除");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    }
  }

  const grouped = bookmarks.reduce<Record<string, BookmarkItem[]>>((acc, item) => {
    const key = item.category || "未分类";
    acc[key] ??= [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-12">
      <div className="flex flex-wrap items-start justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">常用网址</h1>
          <p className="mt-1 text-sm text-muted-foreground">保存在本地 SQLite，可随时增删</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? <Spinner /> : <RefreshCw />}
            刷新
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>添加书签</CardTitle>
          <CardDescription>分类留空则归入「未分类」</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bookmark-title">标题</Label>
              <Input
                id="bookmark-title"
                placeholder="GitHub"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bookmark-category">分类</Label>
              <Input
                id="bookmark-category"
                placeholder="开发 / 娱乐"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bookmark-url">URL</Label>
              <Input
                id="bookmark-url"
                placeholder="https://github.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleAdd()}
              />
            </div>
          </div>
          <Button type="button" onClick={() => void handleAdd()} disabled={saving}>
            {saving ? <Spinner /> : <Plus />}
            添加
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <ListSkeleton />
      ) : bookmarks.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Bookmark />
            </EmptyMedia>
            <EmptyTitle>暂无书签</EmptyTitle>
            <EmptyDescription>在上方表单添加常用网址</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        Object.entries(grouped).map(([group, items]) => (
          <Card key={group}>
            <CardHeader>
              <CardTitle className="text-base">{group}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>标题</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead className="w-[52px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <Button variant="link" asChild className="h-auto p-0">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1"
                          >
                            {item.title}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {item.url}
                      </TableCell>
                      <TableCell>
                        <DeleteConfirmButton
                          title="删除书签"
                          description={`确定删除「${item.title}」吗？`}
                          onConfirm={() => void handleDelete(item.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
