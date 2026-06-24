import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { rulesRouter } from "./routes/rules.js";
import { bookmarksRouter } from "./routes/bookmarks.js";

const app: Express = express();

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Admin-Password"],
  }),
);
app.use(express.json({ limit: "1mb" }));

app.use("/api", healthRouter);
app.use("/api", rulesRouter);
app.use("/api", bookmarksRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: unknown, _req: Request, res: Response, next: () => void) => {
  if (res.headersSent) {
    next();
    return;
  }
  console.error(err);
  res.status(500).json({ error: err instanceof Error ? err.message : "Internal Server Error" });
});

app.listen(env.port, "127.0.0.1", () => {
  console.log(`rules-api listening on http://127.0.0.1:${env.port}`);
});
