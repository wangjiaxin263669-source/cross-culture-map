import { getCuratedVideos } from '../curatedLinks.js';
import { isVideoUrl } from '../linkPlatforms.js';

function filterVideos(list) {
  return (list || []).filter((v) => isVideoUrl(v.url));
}

/** 统一构造地区市场单元 */
export function createRegion(parentId, parentTitle, countryLabel, baseRefs, data) {
  const curatedVideos = getCuratedVideos(data.id);
  const videos = filterVideos(data.videos ?? curatedVideos ?? []);
  return {
    marketType: 'region',
    parentId,
    parentTitle,
    countryLabel,
    regionUnit: data.regionUnit,
    ...data,
    title: data.title,
    label: data.label || data.title,
    videos,
    references: [...(data.references || []), ...baseRefs],
  };
}
