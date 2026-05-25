/**
 * 跨文化链接审计核心库 — 供 guardian / audit-all-markets 共用
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const projectRoot = join(__dirname, '..', '..');

const VIDEO_RE = /bilibili\.com\/video\/(BV[\w]+)/i;

/** 低价值 / 禁止出现在「视频讲解」区的模式（厂商广告、职业科普等） */
export const BANNED_VIDEO_PATTERNS = [
  /墨刀|modao/i,
  /设计行业未来何去何从/i,
  /海外产品如何提升原型设计效率/i,
  /never gonna give you up/i,
];

/** 文献应含设计师必读标注（案例与部分地区合规文献除外） */
export function referenceHasDesignerValue(ref) {
  const note = ref.note || '';
  if (/【设计师必读】/.test(note)) return { ok: true };
  if (/案例|合规|产业/.test(ref.tag || '') && note.length > 10) return { ok: true };
  return {
    ok: false,
    reason: '文献缺少【设计师必读】标注，无法保证对跨文化 UX 有明确指导价值',
  };
}

export function videoIsAcceptable(video) {
  const url = video.url || '';
  if (!VIDEO_RE.test(url)) {
    return { ok: false, reason: '视频区仅允许 B 站 BV 链接' };
  }
  const title = video.title || '';
  for (const pat of BANNED_VIDEO_PATTERNS) {
    if (pat.test(title)) {
      return { ok: false, reason: '视频标题命中低价值/广告黑名单' };
    }
  }
  return { ok: true };
}

export async function loadAllMarkets() {
  const { countriesData: rawCountries } = await import(
    pathToFileURL(join(projectRoot, 'src', 'data', 'countries.js')).href
  );
  const { chinaProvinces } = await import(
    pathToFileURL(join(projectRoot, 'src', 'data', 'regions', 'china-provinces.js')).href
  );
  const { usaStates } = await import(
    pathToFileURL(join(projectRoot, 'src', 'data', 'regions', 'usa-states.js')).href
  );
  const { japanPrefectures } = await import(
    pathToFileURL(join(projectRoot, 'src', 'data', 'regions', 'japan-prefectures.js')).href
  );
  const { brazilStates } = await import(
    pathToFileURL(join(projectRoot, 'src', 'data', 'regions', 'brazil-states.js')).href
  );
  const { germanyStates } = await import(
    pathToFileURL(join(projectRoot, 'src', 'data', 'regions', 'germany-states.js')).href
  );
  const { indiaStates } = await import(
    pathToFileURL(join(projectRoot, 'src', 'data', 'regions', 'india-states.js')).href
  );

  const countries = rawCountries.map((c) => ({ ...c, marketType: 'country' }));
  const regions = [
    ...chinaProvinces,
    ...usaStates,
    ...japanPrefectures,
    ...brazilStates,
    ...germanyStates,
    ...indiaStates,
  ];
  return { countries, regions, markets: [...countries, ...regions] };
}

export function marketLabel(m) {
  if (m.marketType === 'region') return `${m.parentTitle} · ${m.title} (${m.id})`;
  return `${m.title} (${m.id})`;
}

function norm(s) {
  return String(s)
    .toLowerCase()
    .replace(/[_\s\-|·，。！？、：；《》【】（）\[\]()]/g, '')
    .replace(/哔哩哔哩|bilibili|高清|纪录片|1080p|hd/g, '');
}

export function titleOverlap(a, b) {
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

export function collectLinks(market) {
  const theme = [
    market.tagline,
    market.culturalStory?.title,
    market.culturalStory?.designLink,
  ]
    .filter(Boolean)
    .join(' ');

  const items = [];
  for (const ref of market.references || []) {
    items.push({ type: '文献', title: ref.title, url: ref.url, meta: ref.note, theme, raw: ref });
  }
  for (const v of market.videos || []) {
    items.push({ type: '视频', title: v.title, url: v.url, meta: v.tag, theme, raw: v });
  }
  for (const tip of market.designInsights || []) {
    if (tip.caseLink) {
      items.push({
        type: '案例',
        title: tip.title || '案例',
        url: tip.caseLink,
        meta: tip.content,
        theme,
        raw: tip,
      });
    }
  }
  return items;
}

const TRUSTED_HOSTS =
  /design\.google|woshipm|zcool|bilibili|starbucks|gdpr|roomie|smokeybear|oag\.ca|apple\.com|geert-hofstede\.com/i;

/** 境外经典源在部分网络下 fetch 会失败，不应与「确认下架」同等对待 */
const NETWORK_FLAKY_HOSTS =
  /design\.google|geert-hofstede\.com|gdpr\.eu|starbucks\.com|apple\.com|roomie\.tw|smokeybear\.com|oag\.ca\.gov|bilibili\.com/i;

export async function fetchCheck(url, cache = new Map()) {
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
      (/页面不存在|视频不存在|视频去哪|内容不存在|已失效|已删除|下架|404 Not Found/i.test(
        pageTitle + html.slice(0, 15000),
      ) &&
        !TRUSTED_HOSTS.test(url));
    const result = {
      ok: res.status >= 200 && res.status < 400 && !soft404,
      status: res.status,
      pageTitle,
      soft404,
      error: null,
    };
    cache.set(url, result);
    return result;
  } catch (e) {
    const result = { ok: false, status: null, pageTitle: '', soft404: false, error: e.message };
    cache.set(url, result);
    return result;
  }
}

function themeOk(type, theme, title, pageTitle) {
  const blob = `${theme} ${title} ${pageTitle}`.toLowerCase();
  if (
    /跨文化|霍夫斯泰德|文化|设计|ux|本地化|海报|电商|隐私|rtl|集体|个人|信任|星巴克|苹果|ccp|合规|创新|荆楚|楚国|蜀道|粤|藏|疆|闽南|傣|鄂伦春|故宫|海派|长安|大雁塔|行疆|西藏|gdpr|cookie|inclusive|红点|微信|dan|grover|smokey|全球化ui|hofstede|inclusive products|building for/i.test(
      blob,
    )
  ) {
    return true;
  }
  return type === '视频' && /文化|设计|纪录片|跨文化|产品|研究|西藏|楚国|粤|蜀道/i.test(title);
}

const REGION_WORDS =
  /东京|大阪|京都|北海道|冲绳|广东|北京|上海|四川|浙江|陕西|云南|新疆|西藏|东北|福建|湖北|加州|纽约|德州|佛罗里达|巴伐利亚|柏林|圣保罗|里约|孟买|德里/;

/**
 * @param {{ checkDesignerValue?: boolean }} options
 */
export async function runCultureLinkAudit(options = {}) {
  const { checkDesignerValue = true } = options;
  const { markets } = await loadAllMarkets();
  const cache = new Map();
  const issues = [];

  let failAccess = 0;
  let titleMismatch = 0;
  let themeWeak = 0;
  let designerValueFail = 0;

  for (const market of markets) {
    const links = collectLinks(market);
    const label = marketLabel(market);

    if (checkDesignerValue) {
      for (const ref of market.references || []) {
        const dv = referenceHasDesignerValue(ref);
        if (!dv.ok) {
          designerValueFail++;
          issues.push({
            severity: 'high',
            market: label,
            marketId: market.id,
            type: '文献',
            title: ref.title,
            url: ref.url,
            issue: '设计师价值不足',
            detail: dv.reason,
          });
        }
      }
      for (const v of market.videos || []) {
        const vv = videoIsAcceptable(v);
        if (!vv.ok) {
          designerValueFail++;
          issues.push({
            severity: 'high',
            market: label,
            marketId: market.id,
            type: '视频',
            title: v.title,
            url: v.url,
            issue: '设计师价值不足',
            detail: vv.reason,
          });
        }
      }
    }

    for (const item of links) {
      const check = await fetchCheck(item.url, cache);
      const overlap = titleOverlap(item.title, check.pageTitle || '');
      const regionClaim =
        REGION_WORDS.test(item.title) && !REGION_WORDS.test(check.pageTitle || '');
      const crossCultureGeneric = /文化的定义|什么是文化/.test(
        `${item.title} ${check.pageTitle}`,
      );

      if (!check.ok) {
        const flakyNetwork =
          check.error && NETWORK_FLAKY_HOSTS.test(item.url) && check.status == null;
        if (flakyNetwork) {
          issues.push({
            severity: 'low',
            market: label,
            marketId: market.id,
            type: item.type,
            title: item.title,
            url: item.url,
            issue: '网络未验证（经典源）',
            detail:
              '本地/防火墙可能无法访问；GitHub Actions 会再验。若为确认 404 请人工更换。',
          });
        } else {
          failAccess++;
          issues.push({
            severity: 'critical',
            market: label,
            marketId: market.id,
            type: item.type,
            title: item.title,
            url: item.url,
            issue: '链接不可访问',
            detail: check.error || `HTTP ${check.status}`,
            pageTitle: check.pageTitle,
          });
        }
      }

      const aligned =
        overlap >= 0.1 ||
        crossCultureGeneric ||
        item.type === '案例' ||
        /hofstede|霍夫斯泰德|跨文化|海报|海報|starbucks|星巴克|apple|粤韵|百年守护|此刻中国|蜀道|楚国|楚國|番客|紧那罗|行疆|西藏时光|最后的山神|大雁塔|roomie|gdpr|cookie|inclusive|红点|微信|dan|grover|smokey|全球化ui/i.test(
          `${item.title} ${check.pageTitle}`,
        );

      const bilibiliOk =
        item.type === '视频' && /bilibili\.com/i.test(item.url) && check.ok;

      if (check.ok && !aligned && !bilibiliOk) {
        titleMismatch++;
        issues.push({
          severity: 'medium',
          market: label,
          marketId: market.id,
          type: item.type,
          title: item.title,
          url: item.url,
          issue: '标题与页面内容不一致',
          detail: `页面标题: ${check.pageTitle}`,
        });
      }

      if (check.ok && regionClaim && crossCultureGeneric) {
        titleMismatch++;
        issues.push({
          severity: 'medium',
          market: label,
          marketId: market.id,
          type: item.type,
          title: item.title,
          url: item.url,
          issue: '地区名与通用视频不符',
          detail: '标题暗示地方专题，实际为通用文化定义视频',
        });
      }

      if (check.ok && !themeOk(item.type, item.theme, item.title, check.pageTitle)) {
        themeWeak++;
        issues.push({
          severity: 'low',
          market: label,
          marketId: market.id,
          type: item.type,
          title: item.title,
          url: item.url,
          issue: '与本地文化故事关联偏弱',
          detail: '建议人工复核是否保留',
        });
      }
    }
  }

  const stats = {
    markets: markets.length,
    uniqueUrls: cache.size,
    failAccess,
    titleMismatch,
    themeWeak,
    designerValueFail,
    totalIssues: issues.length,
    checkedAt: new Date().toISOString(),
  };

  const critical = issues.filter((i) => i.severity === 'critical' || i.severity === 'high');
  const passed = critical.length === 0 && titleMismatch === 0;

  return { issues, stats, passed, cache };
}

export function writeGuardianReport(result, outDir) {
  mkdirSync(outDir, { recursive: true });
  const ts = result.stats.checkedAt.replace(/[:.]/g, '-');
  const latestPath = join(outDir, 'latest.json');
  const archivePath = join(outDir, `report-${ts}.json`);
  const body = JSON.stringify(result, null, 2);
  writeFileSync(latestPath, body, 'utf8');
  writeFileSync(archivePath, body, 'utf8');
  return { latestPath, archivePath };
}
