import React from 'react';
import { getRegionUnitLabel } from '../data/markets';

/**
 * 同一国家/地区下的子区域快捷切换
 */
export default function RegionPicker({ parentId, parentTitle, regions, activeId, onSelect }) {
  if (!regions?.length) return null;

  const unit = getRegionUnitLabel(parentId);

  return (
    <div className="region-picker">
      <p className="region-picker-hint">
        📍 {parentTitle} 下辖 {regions.length} 个{unit}级地区 · 也可在地球上直接点击标签
      </p>
      <div className="region-chips">
        {regions.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`region-chip ${r.id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(r)}
          >
            {r.title}
          </button>
        ))}
      </div>
    </div>
  );
}
