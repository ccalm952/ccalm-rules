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

1. `npm install`（自动 `prisma generate`）
2. `npx prisma migrate deploy`
3. `npm run build && npm start`
4. 用 PM2 / systemd 守护进程
5. Nginx 反代 `/api` 到本服务
6. 定期备份 SQLite 文件（`DATABASE_URL` 指向的路径）

若与 Sub-Store（`3001`）同机部署，请在 `.env` 设置 `PORT=3002` 等其它端口。

## 数据库

```bash
npx prisma studio
npx prisma migrate dev --name <描述>   # 改 schema 后迁移
```
