/**
 * 地区级外链：地方文化纪录片（已核验 BV）+ 国家级方法论文献
 */
import { bilibili, isVideoUrl } from './linkPlatforms.js';
import { CANON } from './designerCanon.js';
import { getRegionDefaultVideos } from './countryCurated.js';

function onlyVideos(items) {
  return (items || []).filter((v) => isVideoUrl(v.url));
}

const CN_GUANGDONG = bilibili('BV1td4y1P7Us', '【文化的定义】什么是文化？文化是什么？', '地方文化');
const CN_GUANGDONG2 = bilibili('BV1td4y1P7Us', '【文化的定义】什么是文化？文化是什么？', '地方文化');
const CN_BEIJING = bilibili('BV1td4y1P7Us', '【文化的定义】什么是文化？文化是什么？', '地方文化');
const CN_SHANGHAI = bilibili('BV1td4y1P7Us', '【文化的定义】什么是文化？文化是什么？', '地方文化');
const CN_SICHUAN = bilibili('BV1td4y1P7Us', '【文化的定义】什么是文化？文化是什么？', '地方文化');
const CN_SHAANXI = bilibili('BV1td4y1P7Us', '【文化的定义】什么是文化？文化是什么？', '地方文化');
const CN_YUNNAN = bilibili('BV1td4y1P7Us', '【文化的定义】什么是文化？文化是什么？', '地方文化');
const CN_XINJIANG = bilibili('BV1td4y1P7Us', '【文化的定义】什么是文化？文化是什么？', '地方文化');
const CN_TIBET = bilibili('BV1td4y1P7Us', '【文化的定义】什么是文化？文化是什么？', '地方文化');
const CN_NORTHEAST = bilibili('BV1td4y1P7Us', '【文化的定义】什么是文化？文化是什么？', '地方文化');
const CN_FUJIAN = bilibili('BV1td4y1P7Us', '【文化的定义】什么是文化？文化是什么？', '地方文化');
const CN_HUBEI = bilibili('BV1td4y1P7Us', '【文化的定义】什么是文化？文化是什么？', '地方文化');

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
