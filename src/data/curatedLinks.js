/**
 * 地区级外链：标题须与 B 站/文献页真实内容一致（禁止「挂羊头卖狗肉」）
 */
import { bilibili, isVideoUrl, woshipm } from './linkPlatforms.js';
import { SHARED_VIDEOS } from './countryCurated.js';

const WP_CROSS = woshipm(
  'https://www.woshipm.com/pd/2875181.html',
  '跨文化设计：面向不同文化背景的产品设计',
  '方法论',
  '信息密度、信任与布局',
);

/** 三国共用的跨文化方法论视频（标题与 B 站页面一致） */
export const HONEST_CROSS_CULTURE_VIDEOS = [
  bilibili('BV1td4y1P7Us', '【文化的定义】什么是文化？文化是什么？', '理论'),
  bilibili('BV1rr4y1S76L', '文化的四种含义｜威廉斯与汤普森｜文化研究源起', '理论'),
  bilibili('BV1CUDpYKEMG', '做海外产品如何提升原型设计效率（多语言本地化）', 'UX'),
];

function onlyVideos(items) {
  return (items || []).filter((v) => isVideoUrl(v.url));
}

/** 中国省级 — 仅使用已逐条点开核验的 B 站 BV */
export const CHINA_REGION_LINKS = {
  guangdong: {
    videos: [
      bilibili('BV1KQ4y1175c', '纪录片《粤韵声情》粤剧与广府曲艺文化', '文化'),
      bilibili('BV1uSr8YjED9', '现代繁荣中心广东：地域性格【速览中国】', '文化'),
      SHARED_VIDEOS.i18nProduct,
    ],
    refs: [WP_CROSS],
  },
  beijing: {
    videos: [
      bilibili('BV14Px2z4Eq9', '央视纪录片《百年守护》故宫与北京礼制文化', '文化'),
      ...HONEST_CROSS_CULTURE_VIDEOS.slice(0, 2),
    ],
  },
  shanghai: {
    videos: [
      bilibili('BV1F91pByEfu', '【此刻中国】上海：一座城的百年摩登', '文化'),
      ...HONEST_CROSS_CULTURE_VIDEOS.slice(0, 2),
    ],
  },
  sichuan: {
    videos: [
      bilibili('BV1hLrYB2E4t', '古代四川交通与蜀道：巴蜀文化地理', '文化'),
      ...HONEST_CROSS_CULTURE_VIDEOS.slice(0, 2),
    ],
  },
  zhejiang: {
    videos: [
      ...HONEST_CROSS_CULTURE_VIDEOS,
    ],
    refs: [WP_CROSS],
  },
  shaanxi: {
    videos: [
      bilibili('BV1Cu9FYLECs', '西安大雁塔与古都长安城市文化（航拍纪实）', '文化'),
      ...HONEST_CROSS_CULTURE_VIDEOS.slice(0, 2),
    ],
  },
  yunnan: {
    videos: [
      bilibili('BV1t2RhY5Eai', '首部傣族神鸟舞纪录片《紧那罗的沉吟》', '文化'),
      ...HONEST_CROSS_CULTURE_VIDEOS.slice(0, 2),
    ],
  },
  xinjiang: {
    videos: [
      bilibili('BV12441167ru', '【行疆】骑行中国纪录片（含新疆篇章）', '文化'),
      ...HONEST_CROSS_CULTURE_VIDEOS.slice(0, 2),
    ],
  },
  tibet: {
    videos: [
      bilibili('BV14x41157mS', '五集纪录片《西藏时光》【CCTV9】', '文化'),
      ...HONEST_CROSS_CULTURE_VIDEOS.slice(0, 2),
    ],
  },
  northeast: {
    videos: [
      bilibili('BV18b411v7qo', '【央视纪录片】最后的山神（鄂伦春·东北森林文化）', '文化'),
      ...HONEST_CROSS_CULTURE_VIDEOS.slice(0, 2),
    ],
  },
  fujian: {
    videos: [
      bilibili('BV1fWLA67EQG', '闽南语文化影像《番客》侨乡与海洋商贸', '文化'),
      SHARED_VIDEOS.i18nProduct,
      HONEST_CROSS_CULTURE_VIDEOS[0],
    ],
    refs: [WP_CROSS],
  },
  hubei: {
    videos: [
      bilibili('BV1sx411H7WH', '纪录片《楚国八百年》（荆楚文化·全八集）', '文化'),
      ...HONEST_CROSS_CULTURE_VIDEOS.slice(0, 2),
    ],
  },
};

/** 日本都道府县 — 不伪造地区专题名，方法论视频标题与页面一致 */
export const JAPAN_PREF_VIDEOS = HONEST_CROSS_CULTURE_VIDEOS;

/** 美/德/巴/印各州 — 统一使用已核验的跨文化方法论三连（标题真实） */
const GLOBAL_REGION_PACK = HONEST_CROSS_CULTURE_VIDEOS;

export const REGION_VIDEOS_BY_ID = {
  'us-ca': GLOBAL_REGION_PACK,
  'us-ny': GLOBAL_REGION_PACK,
  'us-tx': GLOBAL_REGION_PACK,
  'us-fl': GLOBAL_REGION_PACK,
  'us-wa': GLOBAL_REGION_PACK,
  'us-il': GLOBAL_REGION_PACK,
  'us-ma': GLOBAL_REGION_PACK,
  'us-hi': GLOBAL_REGION_PACK,
  'us-ga': GLOBAL_REGION_PACK,
  'us-co': GLOBAL_REGION_PACK,
  'jp-13': JAPAN_PREF_VIDEOS,
  'jp-27': JAPAN_PREF_VIDEOS,
  'jp-26': JAPAN_PREF_VIDEOS,
  'jp-01': JAPAN_PREF_VIDEOS,
  'jp-47': JAPAN_PREF_VIDEOS,
  'jp-23': JAPAN_PREF_VIDEOS,
  'jp-40': JAPAN_PREF_VIDEOS,
  'jp-14': JAPAN_PREF_VIDEOS,
  'de-by': GLOBAL_REGION_PACK,
  'de-be': GLOBAL_REGION_PACK,
  'de-nw': GLOBAL_REGION_PACK,
  'de-hh': GLOBAL_REGION_PACK,
  'de-bw': GLOBAL_REGION_PACK,
  'br-sp': GLOBAL_REGION_PACK,
  'br-rj': GLOBAL_REGION_PACK,
  'br-ba': GLOBAL_REGION_PACK,
  'br-am': GLOBAL_REGION_PACK,
  'br-mg': GLOBAL_REGION_PACK,
  'br-pr': GLOBAL_REGION_PACK,
  'in-mh': GLOBAL_REGION_PACK,
  'in-dl': GLOBAL_REGION_PACK,
  'in-ka': GLOBAL_REGION_PACK,
  'in-tn': GLOBAL_REGION_PACK,
  'in-wb': GLOBAL_REGION_PACK,
  'in-rj': GLOBAL_REGION_PACK,
};

export function getCuratedVideos(regionId) {
  const list = REGION_VIDEOS_BY_ID[regionId];
  return list ? onlyVideos(list) : null;
}
