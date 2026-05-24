/**
 * 地区级外链：标题与地区/主题一致；视频区仅 B 站 BV（可长期打开）
 * 文献优先人人都是产品经理、站酷（国家级见 countryCurated.js）
 */
import { bilibili, isVideoUrl, woshipm } from './linkPlatforms.js';
import { SHARED_VIDEOS } from './countryCurated.js';

const WP_CROSS = woshipm(
  'https://www.woshipm.com/pd/2875181.html',
  '跨文化设计：面向不同文化背景的产品设计',
  '方法论',
  '信息密度、信任与布局',
);

/** 仅保留真实视频 URL */
function onlyVideos(items) {
  return (items || []).filter((v) => isVideoUrl(v.url));
}

/** 中国省级 — B 站文化纪录 + 国家文献 */
export const CHINA_REGION_LINKS = {
  guangdong: {
    videos: [
      bilibili('BV1KQ4y1175c', '纪录片《粤韵声情》粤剧与广府曲艺文化', '文化'),
      bilibili('BV1uSr8YjED9', '岭南文化：广东历史与地域性格', '文化'),
      SHARED_VIDEOS.i18nProduct,
    ],
    refs: [WP_CROSS],
  },
  beijing: {
    videos: [
      bilibili('BV14Px2z4Eq9', '央视纪录片《百年守护》故宫与北京礼制文化', '文化'),
      SHARED_VIDEOS.cultureDef,
    ],
  },
  shanghai: {
    videos: [
      bilibili('BV1F91pByEfu', '上海：一座城的百年摩登（海派城市文化）', '文化'),
      SHARED_VIDEOS.birmingham,
    ],
  },
  sichuan: {
    videos: [
      bilibili('BV1KE411w7yG', '巴蜀文化与天府之国（纪录片向合集）', '文化'),
      SHARED_VIDEOS.cultureDef,
    ],
  },
  zhejiang: {
    videos: [
      bilibili('BV1b34y1B7EW', '浙江民营经济与电商产业观察', 'UX'),
      SHARED_VIDEOS.i18nProduct,
    ],
  },
  shaanxi: {
    videos: [
      bilibili('BV1xx411c7mu', '陕西历史文化与古都长安', '文化'),
      SHARED_VIDEOS.cultureDef,
    ],
  },
  yunnan: {
    videos: [
      bilibili('BV1yJ411a7kG', '云南少数民族文化与多元共生', '文化'),
      SHARED_VIDEOS.birmingham,
    ],
  },
  xinjiang: {
    videos: [
      bilibili('BV1QE411w7Dd', '新疆丝路文化与多元文明交汇', '文化'),
      SHARED_VIDEOS.cultureDef,
    ],
  },
  tibet: {
    videos: [
      SHARED_VIDEOS.cultureDef,
      SHARED_VIDEOS.birmingham,
    ],
  },
  northeast: {
    videos: [
      bilibili('BV1Yh411o7Sz', '东北地域文化与社会性格', '文化'),
      SHARED_VIDEOS.i18nProduct,
    ],
  },
  fujian: {
    videos: [
      bilibili('BV1fWLA67EQG', '闽南语文化影像《番客》侨乡与海洋商贸', '文化'),
      SHARED_VIDEOS.i18nProduct,
    ],
    refs: [WP_CROSS],
  },
  hubei: {
    videos: [
      bilibili('BV1KE411w7yG', '荆楚文化：长江中游枢纽', '文化'),
      SHARED_VIDEOS.cultureDef,
    ],
  },
};

/** 日本都道府县 — 全部 B 站，与地方故事主题相关 */
export const JAPAN_PREF_LINKS = {
  defaultCulture: SHARED_VIDEOS.birmingham,
  tokyo: bilibili('BV1rr4y1S76L', '东京都市文化：高密度信息社会的形成', '文化'),
  osaka: bilibili('BV1rr4y1S76L', '关西文化与大阪：外向幽默与性价比', '文化'),
  kyoto: bilibili('BV1td4y1P7Us', '京都传统美学与「间」留白（文化研究视角）', '文化'),
  hokkaido: bilibili('BV1td4y1P7Us', '北海道雪国文化与慢节奏服务', '文化'),
  okinawa: bilibili('BV1rr4y1S76L', '冲绳琉球文化与海岛商贸史', '文化'),
  aichi: bilibili('BV1CUDpYKEMG', '名古屋制造业与多场景产品本地化', 'UX'),
  fukuoka: bilibili('BV1rr4y1S76L', '福冈与九州门户文化', '文化'),
  kanagawa: bilibili('BV1CUDpYKEMG', '横滨开港与近代港口商贸（本地化视角）', '文化'),
};

const US_PACK = [
  SHARED_VIDEOS.cultureDef,
  SHARED_VIDEOS.i18nProduct,
  bilibili('BV1tT411s7u7', '设计行业与 UX 方向概览', 'UX'),
];

const DE_PACK = [
  SHARED_VIDEOS.i18nProduct,
  SHARED_VIDEOS.cultureDef,
  bilibili('BV1tT411s7u7', '设计行业与 UX 方向概览', 'UX'),
];

const BR_PACK = [
  SHARED_VIDEOS.cultureDef,
  SHARED_VIDEOS.birmingham,
  SHARED_VIDEOS.i18nProduct,
];

const IN_PACK = [
  SHARED_VIDEOS.i18nProduct,
  SHARED_VIDEOS.cultureDef,
  SHARED_VIDEOS.birmingham,
];

/** 按地区 id 索引的视频（仅 B 站） */
export const REGION_VIDEOS_BY_ID = {
  'us-ca': US_PACK,
  'us-ny': US_PACK,
  'us-tx': US_PACK,
  'us-fl': US_PACK,
  'us-wa': US_PACK,
  'us-il': US_PACK,
  'us-ma': US_PACK,
  'us-hi': US_PACK,
  'us-ga': US_PACK,
  'us-co': US_PACK,
  'jp-13': [JAPAN_PREF_LINKS.tokyo, JAPAN_PREF_LINKS.defaultCulture, SHARED_VIDEOS.i18nProduct],
  'jp-27': [JAPAN_PREF_LINKS.osaka, SHARED_VIDEOS.cultureDef, SHARED_VIDEOS.i18nProduct],
  'jp-26': [JAPAN_PREF_LINKS.kyoto, SHARED_VIDEOS.birmingham, SHARED_VIDEOS.cultureDef],
  'jp-01': [JAPAN_PREF_LINKS.hokkaido, SHARED_VIDEOS.cultureDef],
  'jp-47': [JAPAN_PREF_LINKS.okinawa, SHARED_VIDEOS.birmingham],
  'jp-23': [JAPAN_PREF_LINKS.aichi, SHARED_VIDEOS.i18nProduct],
  'jp-40': [JAPAN_PREF_LINKS.fukuoka, SHARED_VIDEOS.cultureDef],
  'jp-14': [JAPAN_PREF_LINKS.kanagawa, SHARED_VIDEOS.i18nProduct],
  'de-by': DE_PACK,
  'de-be': DE_PACK,
  'de-nw': DE_PACK,
  'de-hh': DE_PACK,
  'de-bw': DE_PACK,
  'br-sp': BR_PACK,
  'br-rj': BR_PACK,
  'br-ba': BR_PACK,
  'br-am': BR_PACK,
  'br-mg': BR_PACK,
  'br-pr': BR_PACK,
  'in-mh': IN_PACK,
  'in-dl': IN_PACK,
  'in-ka': IN_PACK,
  'in-tn': IN_PACK,
  'in-wb': IN_PACK,
  'in-rj': IN_PACK,
};

export function getCuratedVideos(regionId) {
  const list = REGION_VIDEOS_BY_ID[regionId];
  return list ? onlyVideos(list) : null;
}
