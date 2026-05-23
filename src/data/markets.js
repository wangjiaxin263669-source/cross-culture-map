/**
 * 统一市场单元：国家 或 国家下属地区（省/州等）
 * 地球仪展示规则：有下属地区的国家不显示国家点，改显示各地区点
 */
import { countriesData } from './countries';
import { chinaProvinces } from './regions/china-provinces';

/** 补全国家 id */
const countries = countriesData.map((c) => ({
  ...c,
  id: c.id || c.label.toLowerCase().replace(/\s+/g, '-'),
  marketType: 'country',
}));

const countryMap = Object.fromEntries(countries.map((c) => [c.id, c]));

/** 地球仪上可点击的全部标签 */
export function getGlobeLabels() {
  const labels = [];
  for (const c of countries) {
    if (c.hasRegions) continue;
    labels.push(c);
  }
  labels.push(...chinaProvinces);
  return labels;
}

export const globeLabelsData = getGlobeLabels();

/** 用于 AI / 面板展示的完整标题 */
export function getMarketDisplayTitle(market) {
  if (!market) return '';
  if (market.parentTitle && market.marketType === 'region') {
    return `${market.parentTitle} · ${market.title}`;
  }
  return market.title;
}

/** 解析点击对象，确保字段完整 */
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

export { countries as countriesData, chinaProvinces, countryMap };
