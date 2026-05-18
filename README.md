# clash_rules

OpenClash / Clash 订阅转换用 **自定义配置**（`rules.ini`），配合 [SubConverter-Extended](https://github.com/Aethersailor/SubConverter-Extended) 将机场订阅转为带分流策略的 Clash 配置。

## 功能概览

- 精简分流：AI、Steam、谷歌服务等独立策略组
- 地区节点：香港、美国（`url-test` 自动测速）
- 直连优化：Steam CDN、国内游戏、谷歌 CN 等
- 面板简洁：`select` 组仅显示策略组，不展开全部节点

配置文件：[rules.ini](./rules.ini)

## 转换服务

本仓库推荐的在线转换接口（基于 SubConverter-Extended 部署）：


| 说明     | 地址                                                                                          |
| ------ | ------------------------------------------------------------------------------------------- |
| 转换 API | `https://api.asailor.org/sub`                                                               |
| 上游项目   | [Aethersailor/SubConverter-Extended](https://github.com/Aethersailor/SubConverter-Extended) |


## 订阅转换链接怎么拼

最终链接由 **API 地址 + 查询参数** 组成，形如：

```text
https://api.asailor.org/sub?target=clash&url={订阅地址}&config={rules.ini 地址}&include={节点筛选}
```

### 参数说明


| 参数        | 必填  | 说明                            |
| --------- | --- | ----------------------------- |
| `target`  | 是   | 输出格式，Clash 填 `clash`          |
| `url`     | 是   | **你的机场订阅链接**（需 URL 编码）        |
| `config`  | 是   | 本仓库 `rules.ini` 的直链（需 URL 编码） |
| `include` | 否   | 只保留名称匹配的节点，多个关键词用 `           |


### `config` 可选地址


| 类型                   | `config` 直链                                                                        | 适用场景               |
| -------------------- | ---------------------------------------------------------------------------------- | ------------------ |
| testingcf 加速（**推荐**） | `https://testingcf.jsdelivr.net/gh/ccalm952/clash_rules@main/rules.ini`            | 国内访问 GitHub 较慢或失败时 |
| Fastly 代理            | `https://fastly.jsdelivr.net/gh/ccalm952/clash_rules@main/rules.ini`               | 备用 jsDelivr 节点     |
| jsDelivr CDN         | `https://cdn.jsdelivr.net/gh/ccalm952/clash_rules@main/rules.ini`                  | 官方 CDN 域名          |
| GitHub 源站            | `https://raw.githubusercontent.com/ccalm952/clash_rules/refs/heads/main/rules.ini` | 海外或能稳定访问 GitHub 时  |


以上链接内容一致，仅下载 `rules.ini` 的 CDN 不同。

### `include` 示例

只导入名称里包含「美国」或「香港」的节点（与 `rules.ini` 里地区分组关键字对应）：

```text
include=美国|香港
```

URL 编码后为：`include=%E7%BE%8E%E5%9B%BD%7C%E9%A6%99%E6%B8%AF`

可按机场节点命名自行修改，例如：`include=HK|US`、`include=香港|美国`。

---

## 完整示例

将下面示例中的 **订阅链接** 换成你自己的机场订阅地址。

### 1. GitHub 源站 `config`（raw）

```text
https://api.asailor.org/sub?target=clash&url=https%3A%2F%2Fe0ayok5yaa.qinyues4.cc%2Fc323befc8dd0af630d37e1224f85e858&config=https%3A%2F%2Fraw.githubusercontent.com%2Fccalm952%2Fclash_rules%2Frefs%2Fheads%2Fmain%2Frules.ini&include=%E7%BE%8E%E5%9B%BD%7C%E9%A6%99%E6%B8%AF
```

解码后的主要参数：


| 参数        | 值                                                                                  |
| --------- | ---------------------------------------------------------------------------------- |
| `url`     | `https://e0ayok5yaa.qinyues4.cc/c323befc8dd0af630d37e1224f85e858`                  |
| `config`  | `https://raw.githubusercontent.com/ccalm952/clash_rules/refs/heads/main/rules.ini` |
| `include` | `美国                                                                                |


### 2. 代理加速 `config`（testingcf，国内推荐）

```text
https://api.asailor.org/sub?target=clash&url=https%3A%2F%2Fe0ayok5yaa.qinyues4.cc%2Fc323befc8dd0af630d37e1224f85e858&config=https%3A%2F%2Ftestingcf.jsdelivr.net%2Fgh%2Fccalm952%2Fclash_rules%40main%2Frules.ini&include=%E7%BE%8E%E5%9B%BD%7C%E9%A6%99%E6%B8%AF
```

与上一段仅 `config` 不同：


| 参数       | 值                                                                       |
| -------- | ----------------------------------------------------------------------- |
| `config` | `https://testingcf.jsdelivr.net/gh/ccalm952/clash_rules@main/rules.ini` |


> 在浏览器或 OpenClash 里应使用 **整段编码后的 URL**（一条长链接），不要手动拆开中文参数。

---

## 自己生成链接（步骤）

1. 准备机场 **订阅 URL**（例如 `https://example.com/sub/xxxx`）。
2. 选定 **config**（任选其一）：
  - testingcf：`https://testingcf.jsdelivr.net/gh/ccalm952/clash_rules@main/rules.ini`
  - Fastly：`https://fastly.jsdelivr.net/gh/ccalm952/clash_rules@main/rules.ini`
  - CDN：`https://cdn.jsdelivr.net/gh/ccalm952/clash_rules@main/rules.ini`
  - 源站：`https://raw.githubusercontent.com/ccalm952/clash_rules/refs/heads/main/rules.ini`
3. 设置 **include**（可选），如：`美国|香港`。
4. 用 [URL 编码工具](https://www.urlencoder.org/) 分别编码 `url`、`config`、`include`，或对整个查询串编码。
5. 拼接：

```text
https://api.asailor.org/sub?target=clash&url={编码后的订阅}&config={编码后的 config}&include={编码后的 include}
```

### 一键生成（Web 应用 · Vite + React）

```bash
pnpm install
pnpm dev
```

代码检查（在仓库根目录执行）：

```bash
pnpm check          # 格式检查 + oxlint + eslint
pnpm fmt            # oxfmt 格式化 web/
pnpm lint           # oxlint + eslint
pnpm lint:ox:fix    # oxlint 自动修复
```

浏览器打开 [http://localhost:5173](http://localhost:5173) ，粘贴订阅 → **直连测试** 检测机场订阅是否可访问 → 可选 **直连测速** 检测各 `config` CDN → 生成 → 复制，填入 OpenClash。

详见 [web/README.md](./web/README.md)。

## 1Panel 部署（与 [ccalm-system](https://github.com/ccalm952/ccalm-system) 相同方式）

纯静态站点：构建 `web/dist` → 复制到 1Panel 网站目录 → OpenResty 配置 SPA 回退。

```text
clash_rules/
  web/          # Vite + React 前端
  rules.ini     # OpenClash 订阅转换配置
```

```bash
cd /opt/clash_rules
git clone https://github.com/ccalm952/clash_rules.git .
pnpm install
pnpm build
cp -r web/dist/* /opt/1panel/www/sites/<你的域名>/index/
```

OpenResty 增加：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 在 OpenClash 中使用

1. **订阅管理** → 添加订阅。
2. **订阅地址** 填入上一节生成的 **完整转换链接**（建议用 jsDelivr 版 `config`）。
3. 客户端类型选择 **Clash**。
4. **订阅转换** 可关闭（转换已在链接里完成）；若仍开启，注意不要与远程 `config` 冲突。
5. 更新订阅后，在策略组中检查：`AI`、`Steam`、`谷歌服务`、`手动选择`、`香港节点`、`美国节点` 等。

## 策略组说明（简要）


| 策略组         | 用途                     |
| ----------- | ---------------------- |
| 手动选择        | GFW / 自定义代理规则；可选香港、美国  |
| AI          | OpenAI 及海外 AI 服务       |
| Steam       | Steam 商店与社区（默认直连，可改代理） |
| 谷歌服务        | Google 相关（域名 + IP 补充）  |
| 漏网之鱼        | 未命中规则的兜底               |
| 香港节点 / 美国节点 | 按节点名筛选并测速              |


## 自定义

- 修改分流：编辑 [rules.ini](./rules.ini) 后推送到 `main`，转换链接中的 `config` 会自动指向最新版（jsDelivr 可能有数分钟缓存）。
- 修改节点范围：调整 URL 中的 `include`，或编辑 `rules.ini` 里 `香港节点` / `美国节点` 的 `filter` 正则。

## 相关链接

- 本仓库配置：[rules.ini](./rules.ini)
- 规则与 OpenClash 方案：[Custom_OpenClash_Rules](https://github.com/Aethersailor/Custom_OpenClash_Rules)
- 转换核心：[SubConverter-Extended](https://github.com/Aethersailor/SubConverter-Extended)

## 免责声明

示例中的订阅地址仅作格式演示，请勿泄露个人订阅链接。使用转换服务与代理请遵守当地法律法规及服务商条款。