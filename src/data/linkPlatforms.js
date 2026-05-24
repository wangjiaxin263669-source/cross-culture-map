/**
 * 外链平台规范：优先小红书、站酷、B站、人人都是产品经理、知乎、抖音等国内可长期访问平台
 * 视频区仅允许真实视频页（B站 BV、抖音等），禁止把文章页标成「视频讲解」
 */

export const PREFERRED_PLATFORMS = [
  'Bilibili',
  '知乎',
  '人人都是产品经理',
  '站酷',
  '小红书',
  '抖音',
];

export function isVideoUrl(url = '') {
  const u = String(url).toLowerCase();
  return (
    /bilibili\.com\/video\/bv/i.test(u) ||
    /douyin\.com\/video\//i.test(u) ||
    /youtube\.com\/watch/i.test(u) ||
    /v\.qq\.com\/x\/cover\//i.test(u)
  );
}

export function bilibili(bv, title, tag = '文化') {
  const id = bv.startsWith('BV') ? bv : `BV${bv}`;
  return {
    title,
    url: `https://www.bilibili.com/video/${id}/`,
    provider: 'Bilibili',
    tag,
    kind: 'video',
  };
}

export function woshipm(url, title, tag, note) {
  return {
    title,
    source: '人人都是产品经理',
    year: '—',
    url,
    tag,
    note,
    kind: 'article',
  };
}

export function zcool(url, title, tag, note) {
  return {
    title,
    source: '站酷',
    year: '—',
    url,
    tag,
    note,
    kind: 'article',
  };
}

export function zhihu(url, title, tag, note) {
  return {
    title,
    source: '知乎',
    year: '—',
    url,
    tag,
    note,
    kind: 'article',
  };
}

export function article(url, title, source, tag, note) {
  return {
    title,
    source,
    year: '—',
    url,
    tag,
    note,
    kind: 'article',
  };
}

/** 案例链接（与 designInsights 主题一致） */
export function caseLink(url, label = '查看真实案例') {
  return { url, label };
}
