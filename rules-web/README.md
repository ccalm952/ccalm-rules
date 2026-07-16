# Clash 规则管理页（rules-web）

Vite + React + Tailwind + shadcn/ui 前端，配合 [rules-api/](../rules-api/)（Express + Prisma + SQLite）管理 Clash 规则、常用网址与备忘录。

## 架构

```
rules-web/（本目录）  →  前端网页
rules-api/            →  Express API + SQLite
ccalm-rules.yaml      →  自定义规则写在 rules: 段顶部（经 GitHub API 读写）
```

## 本地开发

```bash
# 终端 1：API
cd rules-api
npm install
cp .env.example .env   # 填入 GITHUB_TOKEN、ADMIN_PASSWORD
npx prisma migrate dev
npm run dev            # http://127.0.0.1:3001

# 终端 2：前端
cd rules-web
npm install
npm run dev            # http://127.0.0.1:5174
```

Vite 会把 `/api` 代理到 `127.0.0.1:3001`，一般无需配置 `VITE_API_BASE`。

## 部署

生产路径：

| 项 | 路径 |
|----|------|
| 仓库 | `/opt/ccalm-rules` |
| 站点目录 | `/opt/1panel/www/sites/rules.ccalm.xyz/index` |

```bash
cd /opt/ccalm-rules/rules-web
# .env.production: VITE_API_BASE=https://rules.ccalm.xyz/api
npm install
npm run build
rsync -a --delete dist/ /opt/1panel/www/sites/rules.ccalm.xyz/index/
```

完整「拉代码 → API 迁移/重启 → 前端发布」见仓库根 [README.md](../README.md#服务器更新)。API 细节见 [rules-api/README.md](../rules-api/README.md)。

## shadcn 组件

项目使用 **Tailwind CSS v4**（`@tailwindcss/vite` 插件，配置在 `src/index.css`）。

新增组件：

```bash
npx shadcn@latest add <组件名>
```

`components.json` 里路径写 `src/components`（物理路径），不要写 `@/components`。`@/` 只是 TypeScript/Vite 别名，shadcn CLI 在 Windows 上会把它当成字面文件夹名误建 `@/` 目录。源码里 import 仍用 `@/components/ui/...` 即可。
