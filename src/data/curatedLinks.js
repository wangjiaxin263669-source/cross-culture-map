/**
 * 地区级外链：地方文化纪录片（已核验 BV）+ 国家级方法论文献
 */
import { bilibili, isVideoUrl } from './linkPlatforms.js';
import { CANON } from './designerCanon.js';
import { getRegionDefaultVideos } from './countryCurated.js';

function onlyVideos(items) {
  return (items || []).filter((v) => isVideoUrl(v.url));
}

const CN_GUANGDONG = bilibili('BV1KQ4y1175c', '纪录片《粤韵声情》粤剧与广府曲艺文化', '地方文化');
const CN_GUANGDONG2 = bilibili('BV1uSr8YjED9', '现代繁荣中心广东：地域性格【速览中国】', '地方文化');
const CN_BEIJING = bilibili('BV14Px2z4Eq9', '央视纪录片《百年守护》故宫与北京礼制文化', '地方文化');
const CN_SHANGHAI = bilibili('BV1F91pByEfu', '【此刻中国】上海：一座城的百年摩登', '地方文化');
const CN_SICHUAN = bilibili('BV1hLrYB2E4t', '古代四川交通与蜀道：巴蜀文化地理', '地方文化');
const CN_SHAANXI = bilibili('BV1Cu9FYLECs', '西安大雁塔与古都长安城市文化（航拍纪实）', '地方文化');
const CN_YUNNAN = bilibili('BV1t2RhY5Eai', '纪录片《紧那罗的沉吟》傣族神鸟舞与云南非遗', '地方文化');
const CN_XINJIANG = bilibili('BV12441167ru', '【行疆】骑行中国纪录片（含新疆篇章）', '地方文化');
const CN_TIBET = bilibili('BV14x41157mS', '五集纪录片《西藏时光》【CCTV9】', '地方文化');
const CN_NORTHEAST = bilibili('BV18b411v7qo', '【央视纪录片】最后的山神（鄂伦春·东北森林文化）', '地方文化');
const CN_FUJIAN = bilibili('BV1fWLA67EQG', '闽南语文化影像《番客》侨乡与海洋商贸', '地方文化');
const CN_HUBEI = bilibili('BV1sx411H7WH', '纪录片《楚国八百年》（荆楚文化·全八集）', '地方文化');

/** 中国省级 */
export const CHINA_REGION_LINKS = {
  guangdong: {
    videos: getRegionDefaultVideos([CN_GUANGDONG, CN_GUANGDONG2]),
    refs: [CANON.crossDesign],
  },
  beijing: { videos: getRegionDefaultVideos(CN_BEIJING) },
  shanghai: { videos: getRegionDefaultVideos(CN_SHANGHAI) },
  sichuan: { videos: getRegionDefaultVideos(CN_SICHUAN) },
  zhejiang: {
    videos: getRegionDefaultVideos(null),
    refs: [CANON.crossDesign],
  },
  shaanxi: { videos: getRegionDefaultVideos(CN_SHAANXI) },
  yunnan: { videos: getRegionDefaultVideos(CN_YUNNAN) },
  xinjiang: { videos: getRegionDefaultVideos(CN_XINJIANG) },
  tibet: { videos: getRegionDefaultVideos(CN_TIBET) },
  northeast: { videos: getRegionDefaultVideos(CN_NORTHEAST) },
  fujian: {
    videos: getRegionDefaultVideos(CN_FUJIAN),
    refs: [CANON.crossDesign],
  },
  hubei: { videos: getRegionDefaultVideos(CN_HUBEI) },
};

/** 无地方纪录片的地区：仅保留框架视频 + 国家文献（诚实标注，不伪造地方片名） */
const REGION_VIDEO_FALLBACK = getRegionDefaultVideos(null);

export const REGION_VIDEOS_BY_ID = {
  'us-ca': REGION_VIDEO_FALLBACK,
  'us-ny': REGION_VIDEO_FALLBACK,
  'us-tx': REGION_VIDEO_FALLBACK,
  'us-fl': REGION_VIDEO_FALLBACK,
  'us-wa': REGION_VIDEO_FALLBACK,
  'us-il': REGION_VIDEO_FALLBACK,
  'us-ma': REGION_VIDEO_FALLBACK,
  'us-hi': REGION_VIDEO_FALLBACK,
  'us-ga': REGION_VIDEO_FALLBACK,
  'us-co': REGION_VIDEO_FALLBACK,
  'jp-13': REGION_VIDEO_FALLBACK,
  'jp-27': REGION_VIDEO_FALLBACK,
  'jp-26': REGION_VIDEO_FALLBACK,
  'jp-01': REGION_VIDEO_FALLBACK,
  'jp-47': REGION_VIDEO_FALLBACK,
  'jp-23': REGION_VIDEO_FALLBACK,
  'jp-40': REGION_VIDEO_FALLBACK,
  'jp-14': REGION_VIDEO_FALLBACK,
  'de-by': REGION_VIDEO_FALLBACK,
  'de-be': REGION_VIDEO_FALLBACK,
  'de-nw': REGION_VIDEO_FALLBACK,
  'de-hh': REGION_VIDEO_FALLBACK,
  'de-bw': REGION_VIDEO_FALLBACK,
  'br-sp': REGION_VIDEO_FALLBACK,
  'br-rj': REGION_VIDEO_FALLBACK,
  'br-ba': REGION_VIDEO_FALLBACK,
  'br-am': REGION_VIDEO_FALLBACK,
  'br-mg': REGION_VIDEO_FALLBACK,
  'br-pr': REGION_VIDEO_FALLBACK,
  'in-mh': REGION_VIDEO_FALLBACK,
  'in-dl': REGION_VIDEO_FALLBACK,
  'in-ka': REGION_VIDEO_FALLBACK,
  'in-tn': REGION_VIDEO_FALLBACK,
  'in-wb': REGION_VIDEO_FALLBACK,
  'in-rj': REGION_VIDEO_FALLBACK,
};

export function getCuratedVideos(regionId) {
  const list = REGION_VIDEOS_BY_ID[regionId];
  return list ? onlyVideos(list) : null;
}
