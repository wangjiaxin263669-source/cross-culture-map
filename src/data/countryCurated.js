/**
 * 各国文献 / 视频 / 案例 — 设计师必读经典，与 culturalStory 主题一一对应
 */
import { CANON, FOUNDATION_VIDEO } from './designerCanon.js';

/** 星巴克中美对照 — 个人主义 vs 集体主义界面经典教案 */
const CASE_STARBUCKS_CN = 'https://www.starbucks.com.cn/';
const CASE_STARBUCKS_US = 'https://www.starbucks.com/';
const CASE_POSTER_JP = 'https://www.roomie.tw/posts/71704';
const CASE_GDPR = 'https://gdpr.eu/cookies/';

/** 国家级外链包 */
export const COUNTRY_CURATED = {
  china: {
    references: [CANON.hofstede, CANON.crossDesign, CANON.cnUsApp],
    videos: [FOUNDATION_VIDEO],
    caseLink: CASE_STARBUCKS_CN,
    caseInsightIndex: 1,
    caseNote: '对比美国站：中国首页信息更满、会员/优惠/社交入口并列——集体主义界面范式。',
  },
  usa: {
    references: [CANON.hofstede, CANON.smokey, CANON.cnUsApp],
    videos: [FOUNDATION_VIDEO],
    caseLink: CASE_STARBUCKS_US,
    caseInsightIndex: 1,
    caseNote: '对比中国站：美国首页极简、突出 Order——个人主义「你说了算」范式。',
  },
  japan: {
    references: [CANON.hofstede, CANON.japanMarket, CANON.posterCase],
    videos: [FOUNDATION_VIDEO],
    caseLink: CASE_POSTER_JP,
    caseInsightIndex: 1,
    caseNote: '同片海报：日版信息冗余、法版留白——高不确定性规避的视觉证据。',
  },
  germany: {
    references: [CANON.hofstede, CANON.gdpr, CANON.zcoolFont],
    videos: [FOUNDATION_VIDEO],
    caseLink: CASE_GDPR,
    caseInsightIndex: 0,
    caseNote: '隐私/Cookie 分层可读——德国用户「先读说明书再点同意」的工程文化映射。',
  },
  brazil: {
    references: [CANON.hofstede, CANON.crossDesign, CANON.globalUi],
    videos: [FOUNDATION_VIDEO],
    caseLink: null,
    caseInsightIndex: null,
  },
  'saudi-arabia': {
    references: [CANON.hofstede, CANON.globalUi, CANON.zcoolFont],
    videos: [FOUNDATION_VIDEO],
    caseLink: null,
    caseInsightIndex: null,
  },
  india: {
    references: [CANON.hofstede, CANON.googleNbU, CANON.zcoolCross],
    videos: [FOUNDATION_VIDEO],
    caseLink: 'https://www.woshipm.com/ucd/6200498.html',
    caseInsightIndex: 0,
    caseNote: '轻量、多语言、价格敏感——「下一十亿用户」设计原则对照印度故事。',
  },
};

/** 地区卡片追加的国家级「方法论」文献（最多 2 条，避免重复堆砌） */
export function getRegionBaseRefs(countryId) {
  const pack = COUNTRY_CURATED[countryId];
  if (!pack) return [];
  return pack.references.slice(0, 2);
}

/** 地区默认视频：地方文化片（可多条）+ 文化定义框架 */
export function getRegionDefaultVideos(regionSpecificVideo) {
  const extras = Array.isArray(regionSpecificVideo)
    ? regionSpecificVideo
    : regionSpecificVideo
      ? [regionSpecificVideo]
      : [];
  return [...extras, FOUNDATION_VIDEO];
}

export const ALL_CURATED_URLS = [
  'https://www.woshipm.com/pd/2875181.html',
  'https://www.woshipm.com/pd/4448329.html',
  'https://www.woshipm.com/share/6281743.html',
  'https://www.woshipm.com/ucd/6200498.html',
  'https://m.zcool.com.cn/article/ZMTQwNTM3Ng==.html',
  'https://m.zcool.com.cn/article/ZMTY2MDY2NA==.html',
  'https://www.woshipm.com/ucd/124750.html',
  'https://www.roomie.tw/posts/71704',
  'https://gdpr.eu/cookies/',
  'https://www.woshipm.com/ucd/6200498.html',
  'https://smokeybear.com/en',
  'https://www.starbucks.com.cn/',
  'https://www.starbucks.com/',
  'https://www.apple.com/',
  'https://www.woshipm.com/pd/4448329.html',
  'https://hbr.org/topic/subject/innovation',
  'https://www.bilibili.com/video/BV1td4y1P7Us/////',
  'https://www.bilibili.com/video/BV1td4y1P7Us////',
  'https://www.bilibili.com/video/BV1td4y1P7Us////',
  'https://www.bilibili.com/video/BV1td4y1P7Us////',
  'https://www.bilibili.com/video/BV1td4y1P7Us////',
  'https://www.bilibili.com/video/BV1td4y1P7Us////',
  'https://www.bilibili.com/video/BV1td4y1P7Us////',
  'https://www.bilibili.com/video/BV1td4y1P7Us////',
  'https://www.bilibili.com/video/BV1td4y1P7Us////',
  'https://www.bilibili.com/video/BV1td4y1P7Us////',
  'https://www.bilibili.com/video/BV1td4y1P7Us////',
  'https://www.bilibili.com/video/BV1td4y1P7Us////',
  'https://www.bilibili.com/video/BV1td4y1P7Us////',
];

export function applyCountryCurated(country) {
  const pack = COUNTRY_CURATED[country.id];
  if (!pack) return country;

  let designInsights = country.designInsights || [];
  if (pack.caseLink != null && pack.caseInsightIndex != null) {
    designInsights = designInsights.map((tip, i) => {
      if (i === pack.caseInsightIndex) {
        return {
          ...tip,
          caseLink: pack.caseLink,
          content: pack.caseNote ? `${tip.content} ${pack.caseNote}` : tip.content,
        };
      }
      return tip;
    });
  }

  return {
    ...country,
    references: pack.references,
    videos: pack.videos,
    designInsights,
  };
}
