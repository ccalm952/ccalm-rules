# ccalm-rules

Mihomo / Clash 分流：[ccalm-rules.yaml](./ccalm-rules.yaml)
节点重命名：[rename.js](./rename.js)

## 远程引用

```text
https://raw.githubusercontent.com/ccalm952/ccalm-rules/main/ccalm-rules.yaml
```

Clash Party：设置 → 覆写 → YAML，粘贴全文或填上址。见 [覆写文档](https://clashparty.org/docs/guide/override/yaml)。

## Sub-Store

文档：[xream/sub-store](https://hub.docker.com/r/xream/sub-store)

**host + 合并端口**（本机 `3000` 占用时用 `3001`；面板端口看 `SUB_STORE_BACKEND_API_PORT`，`PORT=9876` 是 HTTP-META）：

```bash
docker run -it -d --restart=always --network host \
  -e "SUB_STORE_BACKEND_SYNC_CRON=55 23 * * *" \
  -e HOST=127.0.0.1 -e PORT=9876 \
  -e SUB_STORE_BACKEND_API_PORT=3001 \
  -e SUB_STORE_BACKEND_API_HOST=127.0.0.1 \
  -e SUB_STORE_BACKEND_MERGE=true \
  -e SUB_STORE_FRONTEND_BACKEND_PATH=/ccalm \
  -v /root/sub-store-data:/opt/app/data \
  --name sub-store xream/sub-store
```

本机：`http://127.0.0.1:3001/ccalm` · 公网：Nginx 443 反代到该地址 · 数据：`/root/sub-store-data`

bridge 部署见官方示例，路径改为 `/ccalm`，`-p 127.0.0.1:3001:3001`。

### 流程

1. 文件管理上传 [rename.js](./rename.js)
2. 单条订阅脚本操作：`@rename.js#name=yep`（前缀由 `name=` 指定，每条订阅各写各的）
3. 组合订阅加入该单条
4. Mihomo 配置粘贴 `ccalm-rules.yaml` 或上方 raw 链接，组合订阅关联此配置

### rename.js（改 `CONFIG`）

| 项 | 说明 |
|----|------|
| `name=` | 必填前缀，如 `#name=yep`、`#name=dog`（文件内无默认） |
| `regions` | 保留地区白名单 |
| `filter` | `true` 丢弃白名单外节点 |
| `flag` | 默认 `true` 加国旗 |

`ccalm-rules.yaml` 地区组 `filter: '香港'` 等与节点名关键字对应。

## 自定义规则

自定义直连 / 代理规则写在 `ccalm-rules.yaml` 顶部，由 [rules-web/](./rules-web/) + [rules-api/](./rules-api/) 管理（详见各目录 README）。

| 项 | 路径 / 说明 |
|----|-------------|
| 仓库 | `/opt/ccalm-rules` |
| 站点（前端静态） | `/opt/1panel/www/sites/rules.ccalm.xyz/index` |
| 域名 | `https://rules.ccalm.xyz` |
| API | `/opt/ccalm-rules/rules-api`（PM2：`rules-api`，端口 `3002`） |

> **端口说明**：Sub-Store 占 `3001`；本机 `rules-api` 固定 `PORT=3002`，Nginx `/api` 反代到该端口。

### 自动部署

与 [ccalm-system](https://github.com/ccalm952/ccalm-system) 同一台服务器；生产发布由 GitHub Actions 工作流 `Deploy` 负责（脚本在 `.github/scripts/`）。

合并到 `main` 后会自动 SSH 部署；也可在 Actions 里手动 `workflow_dispatch`，并选择 `auto` / `web` / `api` / `all`。

需在本仓库 Secrets 配置（可与 ccalm-system 使用同一把部署密钥）：

- `DEPLOY_SSH_KEY`（必填）：部署用私钥
- `DEPLOY_SSH_HOST`（可选，默认 `106.53.206.11`）
- `DEPLOY_SSH_USER`（可选，默认 `root`）

只改 `rules-web` 会部署前端；改 `rules-api` 会跑 `prisma migrate deploy`、构建并 `pm2 restart rules-api`；仅改 yaml / 文档则跳过构建（OpenClash 走 GitHub raw）。部署成功后站点根目录会写入 `deploy-version.json`；API 会请求 `http://127.0.0.1:3002/api/health`（期望 `401`/`200`）。

### 服务器手动更新

```bash
# 1. 拉代码
cd /opt/ccalm-rules
git pull origin main

# 2. 更新 API（含 Prisma 迁移，备忘录等新表必须跑）
cd /opt/ccalm-rules/rules-api
npm install
npx prisma migrate deploy
npm run build
pm2 restart rules-api

# 3. 更新前端并发布到 1Panel 站点目录
cd /opt/ccalm-rules/rules-web
# .env.production 可选；默认 VITE_API_BASE=/api（同域反代）
npm install
npm run build
rsync -a --delete dist/ /opt/1panel/www/sites/rules.ccalm.xyz/index/
```

## 规则库

[meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat)（`geosite.dat`、`geoip.dat`）
