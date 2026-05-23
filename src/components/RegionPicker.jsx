import React from 'react';
import { getRegionUnitLabel } from '../data/markets';

/**
 * 国家全国概览 + 下属地区快捷切换
 */
export default function RegionPicker({
  parentCountry,
  regions,
  activeId,
  onSelectCountry,
  onSelectRegion,
}) {
  if (!parentCountry || !regions?.length) return null;

  const unit = getRegionUnitLabel(parentCountry.id);
  const countryActive = activeId === parentCountry.id;

  return (
    <div className="region-picker">
      <p className="region-picker-hint">
        📍 先读 <strong>{parentCountry.title}</strong> 全国整体介绍，再点下方各{unit}查看地方差异；白色大标签为国家，青色小标签为{unit}。
      </p>
      <div className="region-chips">
        <button
          type="button"
          className={`region-chip region-chip-country ${countryActive ? 'active' : ''}`}
          onClick={() => onSelectCountry(parentCountry)}
        >
          🌐 {parentCountry.title}（全国概览）
        </button>
        {regions.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`region-chip ${r.id === activeId ? 'active' : ''}`}
            onClick={() => onSelectRegion(r)}
          >
            {r.title}
          </button>
        ))}
      </div>
    </div>
  );
}
