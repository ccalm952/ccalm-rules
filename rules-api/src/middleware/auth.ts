import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const password = req.header("X-Admin-Password");
  if (!password || password !== env.adminPassword) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
