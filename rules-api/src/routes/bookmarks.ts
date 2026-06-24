import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const bookmarksRouter = Router();

bookmarksRouter.use(requireAuth);

bookmarksRouter.get("/bookmarks", async (_req, res) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
    });
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "读取书签失败" });
  }
});

bookmarksRouter.post("/bookmarks", async (req, res) => {
  const { title, url, category, sortOrder, icon } = req.body as {
    title?: string;
    url?: string;
    category?: string;
    sortOrder?: number;
    icon?: string;
  };

  if (!title?.trim() || !url?.trim()) {
    res.status(400).json({ error: "标题和 URL 不能为空" });
    return;
  }

  try {
    new URL(url.trim());
  } catch {
    res.status(400).json({ error: "URL 格式无效" });
    return;
  }

  try {
    const bookmark = await prisma.bookmark.create({
      data: {
        title: title.trim(),
        url: url.trim(),
        category: category?.trim() ?? "",
        sortOrder: sortOrder ?? 0,
        icon: icon?.trim() ?? "",
      },
    });
    res.status(201).json(bookmark);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "创建书签失败" });
  }
});

bookmarksRouter.put("/bookmarks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "无效 ID" });
    return;
  }

  const { title, url, category, sortOrder, icon } = req.body as {
    title?: string;
    url?: string;
    category?: string;
    sortOrder?: number;
    icon?: string;
  };

  try {
    const existing = await prisma.bookmark.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "书签不存在" });
      return;
    }

    if (url !== undefined) {
      try {
        new URL(url.trim());
      } catch {
        res.status(400).json({ error: "URL 格式无效" });
        return;
      }
    }

    const bookmark = await prisma.bookmark.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(url !== undefined && { url: url.trim() }),
        ...(category !== undefined && { category: category.trim() }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(icon !== undefined && { icon: icon.trim() }),
      },
    });

    res.json(bookmark);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "更新书签失败" });
  }
});

bookmarksRouter.delete("/bookmarks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "无效 ID" });
    return;
  }

  try {
    await prisma.bookmark.delete({ where: { id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "书签不存在" });
  }
});
