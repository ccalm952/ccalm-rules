import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const memosRouter = Router();

memosRouter.use(requireAuth);

memosRouter.get("/memos", async (_req, res) => {
  try {
    const memos = await prisma.memo.findMany({
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
    });
    res.json(memos);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "读取备忘录失败" });
  }
});

memosRouter.post("/memos", async (req, res) => {
  const { title, content, category, pinned } = req.body as {
    title?: string;
    content?: string;
    category?: string;
    pinned?: boolean;
  };

  if (!title?.trim()) {
    res.status(400).json({ error: "标题不能为空" });
    return;
  }

  try {
    const memo = await prisma.memo.create({
      data: {
        title: title.trim(),
        content: content?.trim() ?? "",
        category: category?.trim() ?? "",
        pinned: pinned ?? false,
      },
    });
    res.status(201).json(memo);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "创建备忘录失败" });
  }
});

memosRouter.put("/memos/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "无效 ID" });
    return;
  }

  const { title, content, category, pinned } = req.body as {
    title?: string;
    content?: string;
    category?: string;
    pinned?: boolean;
  };

  if (title !== undefined && !title.trim()) {
    res.status(400).json({ error: "标题不能为空" });
    return;
  }

  try {
    const existing = await prisma.memo.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "备忘录不存在" });
      return;
    }

    const memo = await prisma.memo.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content: content.trim() }),
        ...(category !== undefined && { category: category.trim() }),
        ...(pinned !== undefined && { pinned }),
      },
    });

    res.json(memo);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "更新备忘录失败" });
  }
});

memosRouter.delete("/memos/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "无效 ID" });
    return;
  }

  try {
    await prisma.memo.delete({ where: { id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "备忘录不存在" });
  }
});
