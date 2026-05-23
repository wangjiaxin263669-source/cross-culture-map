/**
 * 统一市场单元：国家 或 国家下属地区（省/州/县等）
 */
import { countriesData } from './countries';
import { chinaProvinces } from './regions/china-provinces';
import { usaStates } from './regions/usa-states';
import { japanPrefectures } from './regions/japan-prefectures';
import { brazilStates } from './regions/brazil-states';
import { germanyStates } from './regions/germany-states';
import { indiaStates } from './regions/india-states';

const countries = countriesData.map((c) => ({
  ...c,
  id: c.id || c.label.toLowerCase().replace(/\s+/g, '-'),
  marketType: 'country',
}));

const countryMap = Object.fromEntries(countries.map((c) => [c.id, c]));

/** 所有地区级市场（地球仪可点击） */
export const allRegions = [
  ...chinaProvinces,
  ...usaStates,
  ...japanPrefectures,
  ...brazilStates,
  ...germanyStates,
  ...indiaStates,
];

/** 按国家 id 获取下属地区列表 */
export function getRegionsByParentId(parentId) {
  if (!parentId) return [];
  return allRegions.filter((r) => r.parentId === parentId);
}

/** 获取国家配置的地区单位名称（省/州/县） */
export function getRegionUnitLabel(parentId) {
  const c = countryMap[parentId];
  return c?.regionUnit || '地区';
}

/** 地球仪上可点击的全部标签 */
export function getGlobeLabels() {
  const labels = [];
  for (const c of countries) {
    if (c.hasRegions) continue;
    labels.push(c);
  }
  labels.push(...allRegions);
  return labels;
}

export const globeLabelsData = getGlobeLabels();

export function getMarketDisplayTitle(market) {
  if (!market) return '';
  if (market.parentTitle && market.marketType === 'region') {
    return `${market.parentTitle} · ${market.title}`;
  }
  return market.title;
}

export function normalizeMarket(item) {
  if (!item) return null;
  if (item.marketType === 'region' && item.parentId) {
    const parent = countryMap[item.parentId];
    return {
      ...item,
      parentTitle: item.parentTitle || parent?.title || item.parentId,
    };
  }
  return item;
}

export {
  countries as countriesData,
  chinaProvinces,
  usaStates,
  japanPrefectures,
  brazilStates,
  germanyStates,
  indiaStates,
  countryMap,
};
