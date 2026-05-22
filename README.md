# ccalm-rules

Mihomo / Clash 分流：[ccalm-rules.yaml](./ccalm-rules.yaml) · 节点重命名：[rename.js](./rename.js)

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
2. 单条订阅脚本操作：`@rename.js`
3. 组合订阅加入该单条
4. Mihomo 配置粘贴 `ccalm-rules.yaml` 或上方 raw 链接，组合订阅关联此配置

### rename.js（改 `CONFIG`）

| 项 | 说明 |
|----|------|
| `prefix` | 机场前缀，如 `yep 🇭🇰 香港 01` |
| `regions` | 保留地区白名单 |
| `filter` | `true` 丢弃白名单外节点 |
| `flag` | 默认 `true` 加国旗 |

`ccalm-rules.yaml` 地区组 `filter: '香港'` 等与节点名关键字对应。

## 规则库

[meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat)（`geosite.dat`、`geoip.dat`）
