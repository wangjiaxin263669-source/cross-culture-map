import React from 'react';

/**
 * 当某国家有多个地区时，在面板内快速切换（地球仪已可点省份，此为辅助）
 */
export default function RegionPicker({ parent, regions, activeId, onSelect }) {
  if (!regions?.length) return null;

  return (
    <div className="region-picker">
      <p className="region-picker-hint">
        📍 {parent.title} 下辖 {regions.length} 个省级地区 · 也可在地球上直接点击省份标签
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
