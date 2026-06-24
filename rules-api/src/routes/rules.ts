import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRules, saveRules, type CustomRule } from "../lib/github-rules.js";

export const rulesRouter = Router();

rulesRouter.get("/rules", requireAuth, async (_req, res) => {
  try {
    const data = await loadRules();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Load failed" });
  }
});

rulesRouter.put("/rules", requireAuth, async (req, res) => {
  try {
    const body = req.body as {
      direct: CustomRule[];
      proxy: CustomRule[];
      message?: string;
    };

    const result = await saveRules(body.direct ?? [], body.proxy ?? [], body.message);
    res.json({ ok: true, commitUrl: result.commitUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    const status = message.startsWith("非法") || message.startsWith("未知") || message.startsWith("请使用") ? 400 : 500;
    res.status(status).json({ error: message });
  }
});
