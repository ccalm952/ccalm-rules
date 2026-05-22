/**
 * Sub-Store 节点重命名 + 区域过滤
 * 脚本操作：@rename.js
 */

// 可改配置
const CONFIG = {
  prefix: "yep", // 机场前缀，重命名后：yep 🇭🇰 香港 01
  filter: true, // 开启后仅保留白名单里的节点
  flag: true, // true：yep 🇭🇰 香港 01；false：yep 香港 01
  regions: ["香港", "台湾", "日本", "韩国", "新加坡", "美国"], // 白名单
  flags: {
    香港: "🇭🇰",
    台湾: "🇹🇼",
    日本: "🇯🇵",
    韩国: "🇰🇷",
    新加坡: "🇸🇬",
    美国: "🇺🇸",
  },
};

// 命名与过滤
function regionOf(name) {
  return CONFIG.regions.find((r) => name.includes(r)) || null;
}

function buildName(region, index) {
  const no = String(index).padStart(2, "0");
  const parts = [CONFIG.prefix, CONFIG.flag ? CONFIG.flags[region] : "", region].filter(Boolean);
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
