/** 统一构造地区市场单元 */
export function createRegion(parentId, parentTitle, countryLabel, baseRefs, data) {
  return {
    marketType: 'region',
    parentId,
    parentTitle,
    countryLabel,
    regionUnit: data.regionUnit,
    ...data,
    title: data.title,
    label: data.label || data.title,
    references: [...(data.references || []), ...baseRefs],
  };
}
