/**
 * Sub-Store 节点重命名 + 区域过滤
 * 脚本操作：@rename.js#name=yep（前缀由 name= 指定，每条订阅各写各的）
 */

// 可改配置
const CONFIG = {
  filter: true, // 开启后仅保留白名单里的节点
  flag: false, // true：带国旗；false：仅 前缀 香港 01
  regions: ["香港", "台湾", "日本", "美国"], // 白名单
  flags: {
    香港: "🇭🇰",
    台湾: "🇹🇼",
    日本: "🇯🇵",
    美国: "🇺🇸",
  },
};

const args = $arguments || {};
const prefix = args.name != null ? decodeURI(args.name) : ""; // 前缀只来自 #name=，未写则为空

// 命名与过滤
function regionOf(name) {
  return CONFIG.regions.find((r) => name.includes(r)) || null;
}

function buildName(region, index) {
  const no = String(index).padStart(2, "0");
  const parts = [prefix, CONFIG.flag ? CONFIG.flags[region] : "", region].filter(Boolean);
  return parts.join(" ") + " " + no;
}

// Sub-Store
function operator(proxies = []) {
  const count = {};
  const out = [];

  for (const p of proxies) {
    const raw = p.name;
    const region = regionOf(raw);

    if (!region) {
      if (CONFIG.filter) continue;
      out.push(p);
      continue;
    }

    count[region] = (count[region] || 0) + 1;
    p.name = buildName(region, count[region]);
    out.push(p);
  }

  return out;
}
