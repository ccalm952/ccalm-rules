# rules-api

Express 5 + Prisma 7 + SQLite 后端，供 `rules-web/` 管理页调用。

## 功能

| 接口 | 说明 |
|------|------|
| `GET /api/health` | 校验管理密码 |
| `GET /api/rules` | 从 GitHub 读取 `ccalm-rules.yaml` 自定义段 |
| `PUT /api/rules` | 写回 GitHub |
| `GET/POST/PUT/DELETE /api/bookmarks` | 常用网址（SQLite） |
| `GET/POST/PUT/DELETE /api/memos` | 备忘录（SQLite：标题/正文/分类/置顶） |

所有接口需在请求头携带 `X-Admin-Password`。

## 本地开发

```bash
cd rules-api
cp .env.example .env
# 编辑 .env，填入 GITHUB_TOKEN、ADMIN_PASSWORD

npm install
npm run dev            # 自动 migrate deploy + 启动，http://127.0.0.1:3001
```

`npm run dev` 会先执行 `prisma migrate deploy` 确保 SQLite 表结构就绪。

前端 `rules-web/` 的 Vite 会把 `/api` 代理到该端口。

## 环境变量

| 变量 | 说明 |
|------|------|
| `PORT` | 端口，默认 `3001` |
| `ADMIN_PASSWORD` | 管理页登录密码 |
| `DATABASE_URL` | SQLite，如 `file:./dev.db` |
| `GITHUB_TOKEN` | 有 repo 写权限的 PAT |
| `GITHUB_OWNER` | 默认 `ccalm952` |
| `GITHUB_REPO` | 默认 `ccalm-rules` |
| `GITHUB_BRANCH` | 默认 `main` |

## 技术栈

- **Express 5** + **Prisma 7**（`prisma.config.ts` + `@prisma/adapter-better-sqlite3`）
- Client 生成到 `src/generated/prisma/`（已在 `.gitignore`，`postinstall` 自动生成）

## 生产部署

本机约定：仓库 `/opt/ccalm-rules`，前端站点 `/opt/1panel/www/sites/rules.ccalm.xyz/index`，进程名 `rules-api`（PM2），端口 `3002`。

完整更新指令见仓库根 [README.md](../README.md#服务器更新)。摘要：

1. `cd /opt/ccalm-rules && git pull origin main`
2. `cd rules-api && npm install && npx prisma migrate deploy && npm run build && pm2 restart rules-api`
3. `cd ../rules-web && npm install && npm run build && rsync -a --delete dist/ /opt/1panel/www/sites/rules.ccalm.xyz/index/`
4. Nginx 反代 `/api` 到 `127.0.0.1:3002`
5. 定期备份 SQLite 文件（`DATABASE_URL` 指向的路径）

`.env` 中 `PORT=3002`（Sub-Store 占用 `3001`）。

## 数据库

```bash
npx prisma studio
npx prisma migrate dev --name <描述>   # 改 schema 后迁移
```
