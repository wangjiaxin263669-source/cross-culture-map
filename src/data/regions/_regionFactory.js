import { getCuratedVideos } from '../curatedLinks.js';

/** 统一构造地区市场单元 */
export function createRegion(parentId, parentTitle, countryLabel, baseRefs, data) {
  const curatedVideos = getCuratedVideos(data.id);
  return {
    marketType: 'region',
    parentId,
    parentTitle,
    countryLabel,
    regionUnit: data.regionUnit,
    ...data,
    title: data.title,
    label: data.label || data.title,
    videos: data.videos ?? curatedVideos ?? [],
    references: [...(data.references || []), ...baseRefs],
  };
}
