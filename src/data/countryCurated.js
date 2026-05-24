/**
 * 各国文献 / 视频 / 案例 — 已与 culturalStory、designInsights 主题对齐
 * 视频仅 B 站 BV；文献优先人人都是产品经理、站酷、知乎
 */
import {
  bilibili,
  woshipm,
  zcool,
  article,
} from './linkPlatforms.js';

/** 跨文化方法论 — 多国可复用的 B 站视频（已核对可打开） */
export const SHARED_VIDEOS = {
  cultureDef: bilibili('BV1td4y1P7Us', '【文化的定义】什么是文化？文化是什么？', '理论'),
  birmingham: bilibili('BV1rr4y1S76L', '文化的四种含义｜威廉斯与汤普森｜文化研究源起', '理论'),
  i18nProduct: bilibili('BV1CUDpYKEMG', '做海外产品如何提升原型设计效率（多语言本地化）', 'UX'),
};

const WP_CROSS = woshipm(
  'https://www.woshipm.com/pd/2875181.html',
  '跨文化设计：面向不同文化背景的产品设计',
  '方法论',
  '高/低语境、信息密度与布局差异',
);

const WP_HOFSTEDE = woshipm(
  'https://www.woshipm.com/pd/4448329.html',
  '国际化产品设计：Hofstede的文化维度',
  '维度数据',
  '含中国/日本/美国等对比；不确定性规避、个人主义如何落到界面',
);

const ZCOOL_CROSS = zcool(
  'https://m.zcool.com.cn/article/ZMTQwNTM3Ng==.html',
  '跨文化产品的设计思路',
  '设计方法',
  '文化差异提取、规避禁忌、单一/多元文化策略',
);

const ZCOOL_FONT = zcool(
  'https://m.zcool.com.cn/article/ZMTY2MDY2NA==.html',
  '跨文化设计实践：多语言字体的文化适配',
  'UX',
  '字体、排版习惯与文化禁忌',
);

/** 国家级外链包（覆盖 countries.js 中的 references / videos / 案例链接） */
export const COUNTRY_CURATED = {
  china: {
    references: [
      WP_HOFSTEDE,
      WP_CROSS,
      ZCOOL_CROSS,
    ],
    videos: [
      SHARED_VIDEOS.cultureDef,
      SHARED_VIDEOS.birmingham,
      SHARED_VIDEOS.i18nProduct,
    ],
    caseLink: 'https://www.starbucks.com.cn/',
  },
  usa: {
    references: [
      WP_HOFSTEDE,
      WP_CROSS,
      ZCOOL_FONT,
    ],
    videos: [
      SHARED_VIDEOS.cultureDef,
      bilibili('BV1tT411s7u7', '设计行业未来何去何从？平面/UI/交互等方向概览', 'UX'),
      SHARED_VIDEOS.i18nProduct,
    ],
    caseLink: 'https://www.starbucks.com/',
  },
  japan: {
    references: [
      WP_HOFSTEDE,
      woshipm(
        'https://www.woshipm.com/share/6281743.html',
        '为日本市场打造多场景设计语言',
        '本地化',
        '日式美学体验 vs SaaS 信任感；高不确定性规避下的界面预期',
      ),
      article(
        'https://www.roomie.tw/posts/71704',
        '電影海報演進史：好萊塢電影來到日本後為何字特別多',
        'Roomie',
        '视觉案例',
        '与「爱乐之城」日版海报信息密度叙事一致',
      ),
    ],
    videos: [
      SHARED_VIDEOS.cultureDef,
      SHARED_VIDEOS.i18nProduct,
      SHARED_VIDEOS.birmingham,
    ],
    caseLink: 'https://www.roomie.tw/posts/71704',
  },
  germany: {
    references: [
      WP_HOFSTEDE,
      WP_CROSS,
      ZCOOL_FONT,
    ],
    videos: [
      SHARED_VIDEOS.i18nProduct,
      SHARED_VIDEOS.cultureDef,
      bilibili('BV1tT411s7u7', '设计行业未来何去何从？平面/UI/交互等方向概览', 'UX'),
    ],
    caseLink: null,
  },
  brazil: {
    references: [
      WP_HOFSTEDE,
      WP_CROSS,
      ZCOOL_CROSS,
    ],
    videos: [
      SHARED_VIDEOS.cultureDef,
      SHARED_VIDEOS.birmingham,
      SHARED_VIDEOS.i18nProduct,
    ],
    caseLink: null,
  },
  'saudi-arabia': {
    references: [
      WP_HOFSTEDE,
      ZCOOL_FONT,
      WP_CROSS,
    ],
    videos: [
      SHARED_VIDEOS.i18nProduct,
      SHARED_VIDEOS.cultureDef,
      SHARED_VIDEOS.birmingham,
    ],
    caseLink: null,
  },
  india: {
    references: [
      WP_HOFSTEDE,
      WP_CROSS,
      ZCOOL_CROSS,
    ],
    videos: [
      SHARED_VIDEOS.i18nProduct,
      SHARED_VIDEOS.cultureDef,
      SHARED_VIDEOS.birmingham,
    ],
    caseLink: null,
  },
};

/** 地区卡片底部追加的「国家基准」文献（替换原 Hofstede/Baymard 英文站） */
export function getRegionBaseRefs(countryId) {
  const pack = COUNTRY_CURATED[countryId];
  if (!pack) return [];
  return pack.references.slice(0, 2);
}

/** 供 scripts/validate-curated-links.mjs 扫描的完整 URL 列表 */
export const ALL_CURATED_URLS = [
  'https://www.woshipm.com/pd/2875181.html',
  'https://www.woshipm.com/pd/4448329.html',
  'https://www.woshipm.com/share/6281743.html',
  'https://m.zcool.com.cn/article/ZMTQwNTM3Ng==.html',
  'https://m.zcool.com.cn/article/ZMTY2MDY2NA==.html',
  'https://www.roomie.tw/posts/71704',
  'https://www.starbucks.com.cn/',
  'https://www.starbucks.com/',
  'https://www.apple.com/',
  'https://oag.ca.gov/privacy/ccpa',
  'https://hbr.org/topic/subject/innovation',
  'https://www.bilibili.com/video/BV1td4y1P7Us/',
  'https://www.bilibili.com/video/BV1rr4y1S76L/',
  'https://www.bilibili.com/video/BV1CUDpYKEMG/',
  'https://www.bilibili.com/video/BV1tT411s7u7/',
  'https://www.bilibili.com/video/BV1KQ4y1175c/',
  'https://www.bilibili.com/video/BV1uSr8YjED9/',
  'https://www.bilibili.com/video/BV14Px2z4Eq9/',
  'https://www.bilibili.com/video/BV1F91pByEfu/',
  'https://www.bilibili.com/video/BV1hLrYB2E4t/',
  'https://www.bilibili.com/video/BV1Cu9FYLECs/',
  'https://www.bilibili.com/video/BV1t2RhY5Eai/',
  'https://www.bilibili.com/video/BV12441167ru/',
  'https://www.bilibili.com/video/BV14x41157mS/',
  'https://www.bilibili.com/video/BV18b411v7qo/',
  'https://www.bilibili.com/video/BV1fWLA67EQG/',
  'https://www.bilibili.com/video/BV1sx411H7WH/',
];

export function applyCountryCurated(country) {
  const pack = COUNTRY_CURATED[country.id];
  if (!pack) return country;

  const designInsights = (country.designInsights || []).map((tip, i) => {
    if (i === 1 && pack.caseLink) {
      return { ...tip, caseLink: pack.caseLink };
    }
    return tip;
  });

  return {
    ...country,
    references: pack.references,
    videos: pack.videos,
    designInsights,
  };
}
