/**
 * 失效/低价值链接 → 设计师必读经典替换表（全自动守护用）
 */
import { pathToFileURL } from 'url';
import { join } from 'path';
import { projectRoot } from './cultureLinkAudit.mjs';

let _canon = null;
async function loadCanon() {
  if (_canon) return _canon;
  const mod = await import(
    pathToFileURL(join(projectRoot, 'src', 'data', 'designerCanon.js')).href
  );
  _canon = { CANON: mod.CANON, FOUNDATION_VIDEO: mod.FOUNDATION_VIDEO, WHY: mod.WHY };
  return _canon;
}

/** 已知失效域名的永久替代（国内可稳定打开） */
export const URL_REPLACEMENTS = {
  'https://design.google/library/building-for-everyone/': {
    canonKey: 'globalUi',
    reason: 'Google Design 在部分网络不可达，改为人人都是产品经理新兴市场 UX 经典',
  },
  'https://oag.ca.gov/privacy/ccpa': {
    canonKey: 'gdpr',
    reason: '加州政府站在 CI 环境不可达，改用 GDPR Cookie UX 经典（同属隐私合规设计）',
  },
};

function countryFromMarketId(marketId) {
  if (!marketId) return null;
  if (marketId.startsWith('cn-') || marketId === 'china') return 'china';
  if (marketId.startsWith('us-') || marketId === 'usa') return 'usa';
  if (marketId.startsWith('jp-') || marketId === 'japan') return 'japan';
  if (marketId.startsWith('de-') || marketId === 'germany') return 'germany';
  if (marketId.startsWith('br-') || marketId === 'brazil') return 'brazil';
  if (marketId === 'saudi-arabia') return 'saudi-arabia';
  if (marketId.startsWith('in-') || marketId === 'india') return 'india';
  return marketId;
}

const COUNTRY_CANON_PRIORITY = {
  china: ['hofstede', 'cnUsApp', 'crossDesign'],
  usa: ['hofstede', 'smokey', 'cnUsApp'],
  japan: ['hofstede', 'japanMarket', 'posterCase'],
  germany: ['hofstede', 'gdpr', 'zcoolFont'],
  brazil: ['hofstede', 'globalUi', 'crossDesign'],
  'saudi-arabia': ['hofstede', 'globalUi', 'zcoolFont'],
  india: ['hofstede', 'globalUi', 'zcoolCross'],
};

export async function resolveReplacement(issue) {
  const { url, type, marketId, issue: issueKind } = issue;
  const { CANON, FOUNDATION_VIDEO } = await loadCanon();

  const direct = URL_REPLACEMENTS[url];
  if (direct?.canonKey && CANON[direct.canonKey]) {
    return { ...CANON[direct.canonKey], fixType: 'canon', reason: direct.reason };
  }

  if (type === '视频') {
    return {
      ...FOUNDATION_VIDEO,
      fixType: 'foundationVideo',
      reason: `${issueKind} → 替换为跨文化框架入门片（设计师必读）`,
    };
  }

  const country = countryFromMarketId(marketId);
  const keys = COUNTRY_CANON_PRIORITY[country] || ['hofstede', 'crossDesign'];
  for (const key of keys) {
    if (CANON[key] && CANON[key].url !== url) {
      return { ...CANON[key], fixType: 'canon', reason: `按 ${country || '默认'} 市场替换为经典文献` };
    }
  }
  return { ...CANON.hofstede, fixType: 'canon', reason: '默认替换霍夫斯泰德经典' };
}

export function refToUrl(ref) {
  return ref?.url || '';
}

export function formatNoteForFile(note) {
  if (!note) return '';
  const escaped = String(note).replace(/'/g, "\\'");
  return escaped;
}
