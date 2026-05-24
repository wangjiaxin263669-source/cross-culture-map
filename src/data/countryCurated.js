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
  cultureDef: bilibili('BV1td4y1P7Us', '什么是文化？文化的三个常见定义', '理论'),
  birmingham: bilibili('BV1rr4y1S76L', '伯明翰学派与当代文化研究', '理论'),
  i18nProduct: bilibili('BV1CUDpYKEMG', '海外产品原型与多语言本地化效率', 'UX'),
};

const WP_CROSS = woshipm(
  'https://www.woshipm.com/pd/2875181.html',
  '跨文化设计：面向不同文化背景的产品设计',
  '方法论',
  '高/低语境、信息密度与布局差异',
);

const WP_HOFSTEDE = woshipm(
  'https://www.woshipm.com/pd/4448329.html',
  '国际化产品设计：霍夫斯泰德文化维度（含中日美对比）',
  '维度数据',
  '不确定性规避、个人主义等如何落到界面',
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
      bilibili('BV1tT411s7u7', '设计行业与 UX/交互方向概览（含跨领域对比）', 'UX'),
      SHARED_VIDEOS.i18nProduct,
    ],
    caseLink: 'https://www.starbucks.com/',
  },
  japan: {
    references: [
      woshipm(
        'https://www.woshipm.com/pd/4448329.html',
        '霍夫斯泰德维度下的日本 UX：进度条、日历与信息冗余',
        'UX 研究',
        '高不确定性规避 92 → 界面需可预期',
      ),
      woshipm(
        'https://www.woshipm.com/share/6281743.html',
        '为日本市场打造多场景设计语言',
        '本地化',
        '日式美学体验 vs SaaS 信任感',
      ),
      article(
        'https://www.roomie.tw/posts/71704',
        '电影海报演进史：好莱坞片来到日本为何字特别多',
        'Roomie',
        '视觉案例',
        '与「爱乐之城」日版海报叙事一致',
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
      bilibili('BV1tT411s7u7', '设计行业与 UX 方向概览', 'UX'),
    ],
    caseLink: null,
  },
  brazil: {
    references: [
      WP_HOFSTEDE,
      woshipm(
        'https://www.woshipm.com/pd/2875181.html',
        '跨文化设计：高语境文化与社交信任',
        'UX 研究',
        '集体主义、人际推荐与界面信任机制',
      ),
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
      woshipm(
        'https://www.woshipm.com/pd/2875181.html',
        '跨文化设计：RTL、色彩与宗教文化敏感',
        '本地化',
        '权力距离与合规表达',
      ),
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
      woshipm(
        'https://www.woshipm.com/pd/2875181.html',
        '跨文化设计：价格敏感与多语言包容',
        'UX 研究',
        '低带宽、折扣前置、多语言切换',
      ),
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
  'https://www.bilibili.com/video/BV1td4y1P7Us/',
  'https://www.bilibili.com/video/BV1rr4y1S76L/',
  'https://www.bilibili.com/video/BV1CUDpYKEMG/',
  'https://www.bilibili.com/video/BV1tT411s7u7/',
  'https://www.bilibili.com/video/BV1KQ4y1175c/',
  'https://www.bilibili.com/video/BV1uSr8YjED9/',
  'https://www.bilibili.com/video/BV14Px2z4Eq9/',
  'https://www.bilibili.com/video/BV1F91pByEfu/',
  'https://www.bilibili.com/video/BV1KE411w7yG/',
  'https://www.bilibili.com/video/BV1b34y1B7EW/',
  'https://www.bilibili.com/video/BV1xx411c7mu/',
  'https://www.bilibili.com/video/BV1yJ411a7kG/',
  'https://www.bilibili.com/video/BV1QE411w7Dd/',
  'https://www.bilibili.com/video/BV1Yh411o7Sz/',
  'https://www.bilibili.com/video/BV1fWLA67EQG/',
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
