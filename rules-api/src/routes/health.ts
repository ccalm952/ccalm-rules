import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

export const healthRouter = Router();

healthRouter.get("/health", requireAuth, (_req, res) => {
  res.json({ ok: true });
});
