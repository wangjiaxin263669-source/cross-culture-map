/**
 * B 站视频精准替换表 — 按市场/地区保留文化主题，避免全局换成同一 BV
 */
import { pathToFileURL } from 'url';
import { join } from 'path';
import { projectRoot } from './cultureLinkAudit.mjs';

let _canon = null;
async function loadFoundation() {
  if (_canon) return _canon;
  const mod = await import(
    pathToFileURL(join(projectRoot, 'src', 'data', 'designerCanon.js')).href
  );
  _canon = mod.FOUNDATION_VIDEO;
  return _canon;
}

/** 已知下架 BV → 已核验替代（优先同主题地方文化片） */
export const BV_REPLACEMENTS = {
  // 示例：'BVxxxxxxxx': { bv: 'BV1KQ4y1175c', title: '...', tag: '地方文化' },
};

/**
 * 市场 ID → 备用地方文化片（与 curatedLinks 一致；仅当该片确认下架时使用）
 */
export const MARKET_VIDEO_BACKUP = {
  'cn-gd': { bv: 'BV1uSr8YjED9', title: '现代繁荣中心广东：地域性格【速览中国】', tag: '地方文化' },
  'cn-bj': { bv: 'BV14Px2z4Eq9', title: '央视纪录片《百年守护》故宫与北京礼制文化', tag: '地方文化' },
  'cn-sh': { bv: 'BV1F91pByEfu', title: '【此刻中国】上海：一座城的百年摩登', tag: '地方文化' },
  'cn-sc': { bv: 'BV1hLrYB2E4t', title: '古代四川交通与蜀道：巴蜀文化地理', tag: '地方文化' },
  'cn-sn': { bv: 'BV1Cu9FYLECs', title: '西安大雁塔与古都长安城市文化（航拍纪实）', tag: '地方文化' },
  'cn-yn': { bv: 'BV1t2RhY5Eai', title: '纪录片《紧那罗的沉吟》傣族神鸟舞与云南非遗', tag: '地方文化' },
  'cn-xj': { bv: 'BV12441167ru', title: '【行疆】骑行中国纪录片（含新疆篇章）', tag: '地方文化' },
  'cn-xz': { bv: 'BV14x41157mS', title: '五集纪录片《西藏时光》【CCTV9】', tag: '地方文化' },
  'cn-ln': { bv: 'BV18b411v7qo', title: '【央视纪录片】最后的山神（鄂伦春·东北森林文化）', tag: '地方文化' },
  'cn-fj': { bv: 'BV1fWLA67EQG', title: '闽南语文化影像《番客》侨乡与海洋商贸', tag: '地方文化' },
  'cn-hb': { bv: 'BV1sx411H7WH', title: '纪录片《楚国八百年》（荆楚文化·全八集）', tag: '地方文化' },
};

const PROVINCE_LINK_KEY = {
  guangdong: 'cn-gd',
  beijing: 'cn-bj',
  shanghai: 'cn-sh',
  sichuan: 'cn-sc',
  shaanxi: 'cn-sn',
  yunnan: 'cn-yn',
  xinjiang: 'cn-xj',
  tibet: 'cn-xz',
  northeast: 'cn-ln',
  fujian: 'cn-fj',
  hubei: 'cn-hb',
};

export function extractBv(url = '') {
  const m = String(url).match(/BV[\w]+/i);
  return m ? m[0] : null;
}

/**
 * @param {{ url: string, marketId?: string, title?: string }} issue
 */
export async function resolveVideoReplacement(issue) {
  const oldBv = extractBv(issue.url);
  const foundation = await loadFoundation();

  if (oldBv && BV_REPLACEMENTS[oldBv]) {
    const r = BV_REPLACEMENTS[oldBv];
    return {
      url: `https://www.bilibili.com/video/${r.bv}/`,
      title: r.title,
      tag: r.tag || '地方文化',
      bv: r.bv,
      reason: `BV ${oldBv} 已下架 → 注册表替代 ${r.bv}`,
    };
  }

  const backup = issue.marketId && MARKET_VIDEO_BACKUP[issue.marketId];
  if (backup && backup.bv !== oldBv) {
    return {
      url: `https://www.bilibili.com/video/${backup.bv}/`,
      title: backup.title,
      tag: backup.tag,
      bv: backup.bv,
      reason: `按地区 ${issue.marketId} 备用文化片替换（保持地方主题）`,
    };
  }

  return {
    url: foundation.url,
    title: foundation.title,
    tag: foundation.tag || '框架',
    bv: extractBv(foundation.url),
    reason: '无同地区备用片 → 跨文化框架入门片（设计师必读）',
  };
}

export { PROVINCE_LINK_KEY };
