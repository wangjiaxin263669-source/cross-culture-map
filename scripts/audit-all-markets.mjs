#!/usr/bin/env node
/**
 * 全量审计 7 国 + 47 地区：链接可打开 + 标题与页面一致 + 跨文化主题合理
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const { countriesData: rawCountries } = await import(
  pathToFileURL(join(root, 'src', 'data', 'countries.js')).href
);
const { chinaProvinces } = await import(
  pathToFileURL(join(root, 'src', 'data', 'regions', 'china-provinces.js')).href
);
const { usaStates } = await import(
  pathToFileURL(join(root, 'src', 'data', 'regions', 'usa-states.js')).href
);
const { japanPrefectures } = await import(
  pathToFileURL(join(root, 'src', 'data', 'regions', 'japan-prefectures.js')).href
);
const { brazilStates } = await import(
  pathToFileURL(join(root, 'src', 'data', 'regions', 'brazil-states.js')).href
);
const { germanyStates } = await import(
  pathToFileURL(join(root, 'src', 'data', 'regions', 'germany-states.js')).href
);
const { indiaStates } = await import(
  pathToFileURL(join(root, 'src', 'data', 'regions', 'india-states.js')).href
);

const countriesData = rawCountries.map((c) => ({ ...c, marketType: 'country' }));
const allRegions = [
  ...chinaProvinces,
  ...usaStates,
  ...japanPrefectures,
  ...brazilStates,
  ...germanyStates,
  ...indiaStates,
];

const REGION_WORDS =
  /东京|大阪|京都|北海道|冲绳|爱知|福冈|横滨|广东|北京|上海|四川|浙江|陕西|云南|新疆|西藏|东北|福建|湖北|加州|纽约|德州|佛罗里达|巴伐利亚|柏林|圣保罗|里约|孟买|德里|班加罗尔/;

const cache = new Map();

function norm(s) {
  return String(s)
    .toLowerCase()
    .replace(/[_\s\-|·，。！？、：；《》【】（）\[\]()]/g, '')
    .replace(/哔哩哔哩|bilibili|高清|纪录片|1080p|hd/g, '');
}

function titleOverlap(a, b) {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return 0;
  if (na.includes(nb.slice(0, 8)) || nb.includes(na.slice(0, 8))) return 1;
  const chunks = na.match(/[\u4e00-\u9fa5]{2,}/g) || [];
  let hit = 0;
  for (const c of chunks) {
    if (c.length >= 2 && nb.includes(c)) hit++;
  }
  return chunks.length ? hit / Math.max(chunks.length, 1) : 0;
}

function marketLabel(m) {
  if (m.marketType === 'region') return `${m.parentTitle} · ${m.title} (${m.id})`;
  return `${m.title} (${m.id})`;
}

function collectLinks(market) {
  const theme = [
    market.tagline,
    market.culturalStory?.title,
    market.culturalStory?.designLink,
  ]
    .filter(Boolean)
    .join(' ');

  const items = [];
  for (const ref of market.references || []) {
    items.push({ type: '文献', title: ref.title, url: ref.url, meta: ref.note, theme });
  }
  for (const v of market.videos || []) {
    items.push({ type: '视频', title: v.title, url: v.url, meta: v.tag, theme });
  }
  for (const tip of market.designInsights || []) {
    if (tip.caseLink) {
      items.push({
        type: '案例',
        title: tip.title || '案例',
        url: tip.caseLink,
        meta: tip.content,
        theme,
      });
    }
  }
  return items;
}

async function fetchCheck(url) {
  if (cache.has(url)) return cache.get(url);
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9',
  };
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(22000),
      headers,
    });
    const html = await res.text();
    const pageTitle = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1]?.trim() || '';
    const soft404 =
      res.status === 404 ||
      /页面不存在|视频不存在|视频去哪|内容不存在|已失效|已删除|下架|404 Not Found/i.test(
        pageTitle + html.slice(0, 15000),
      );
    const result = {
      ok: res.status >= 200 && res.status < 400 && !soft404,
      status: res.status,
      pageTitle,
      soft404,
    };
    cache.set(url, result);
    return result;
  } catch (e) {
    const result = { ok: false, error: e.message };
    cache.set(url, result);
    return result;
  }
}

function themeOk(type, theme, title, pageTitle) {
  const blob = `${theme} ${title} ${pageTitle}`.toLowerCase();
  if (
    /跨文化|霍夫斯泰德|文化|设计|ux|本地化|海报|电商|隐私|rtl|集体|个人|信任|星巴克|苹果|ccp|合规|创新|荆楚|楚国|蜀道|粤|藏|疆|闽南|傣|鄂伦春|故宫|海派|长安|大雁塔|行疆|西藏|伯明翰|威廉斯|海外产品|多语言/.test(
      blob,
    )
  ) {
    return true;
  }
  return type === '视频' && /文化|设计|纪录片|跨文化|产品|研究/.test(title);
}

const markets = [...countriesData, ...allRegions];
let failAccess = 0;
let titleMismatch = 0;
let themeWeak = 0;
const issues = [];

console.log(`审计 ${markets.length} 个市场，逐链接 GET 校验…\n`);

for (const market of markets) {
  for (const item of collectLinks(market)) {
    const check = await fetchCheck(item.url);
    const overlap = titleOverlap(item.title, check.pageTitle || '');
    const regionClaim = REGION_WORDS.test(item.title) && !REGION_WORDS.test(check.pageTitle || '');
    const crossCultureGeneric =
      /文化的定义|文化的四种含义|海外产品|设计行业未来/.test(item.title) ||
      /文化的定义|文化的四种含义|海外产品|设计行业/.test(check.pageTitle || '');

    if (!check.ok) {
      failAccess++;
      issues.push({ market: marketLabel(market), ...item, issue: '不可访问', check });
      console.log(`❌ 失效 [${marketLabel(market)}] ${item.type} ${item.title}`);
      console.log(`   ${item.url}`);
    }

    const aligned =
      overlap >= 0.1 ||
      crossCultureGeneric ||
      item.type === '案例' ||
      /hofstede|霍夫斯泰德|跨文化|海报|海報|starbucks|星巴克|apple|粤韵|百年守护|此刻中国|蜀道|楚国|楚國|番客|紧那罗|行疆|西藏时光|最后的山神|大雁塔|roomie/i.test(
        `${item.title} ${check.pageTitle}`,
      );

    if (check.ok && !aligned) {
      titleMismatch++;
      issues.push({ market: marketLabel(market), ...item, issue: '标题与页面不符', overlap, pageTitle: check.pageTitle });
      console.log(`⚠️ 标题 [${marketLabel(market)}] ${item.type}`);
      console.log(`   展示: ${item.title}`);
      console.log(`   页面: ${check.pageTitle}`);
    }

    if (check.ok && regionClaim && crossCultureGeneric) {
      titleMismatch++;
      issues.push({ market: marketLabel(market), ...item, issue: '地区名与通用视频不符' });
      console.log(`⚠️ 地区错位 [${marketLabel(market)}] ${item.title}`);
    }

    if (check.ok && !themeOk(item.type, item.theme, item.title, check.pageTitle)) {
      themeWeak++;
      issues.push({ market: marketLabel(market), ...item, issue: '与本地文化故事关联弱' });
    }
  }
}

const outPath = join(root, 'scripts', 'audit-report.json');
writeFileSync(outPath, JSON.stringify({ issues, stats: { markets: markets.length, failAccess, titleMismatch, themeWeak } }, null, 2));

console.log('\n--- 汇总 ---');
console.log(`链接总数（含重复 URL）: ${cache.size} 个唯一 URL`);
console.log(`不可访问: ${failAccess}`);
console.log(`标题/地区疑似问题: ${titleMismatch}`);
console.log(`主题关联偏弱（提示）: ${themeWeak}`);
console.log(`报告: ${outPath}`);

process.exit(failAccess > 0 || titleMismatch > 0 ? 1 : 0);
