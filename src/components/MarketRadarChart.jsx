import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export default function MarketRadarChart({ data }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="rgba(212,196,168,0.14)" />
        <PolarAngleAxis
          dataKey="name"
          tick={{ fill: '#b8b0a8', fontSize: 11, letterSpacing: '0.02em' }}
        />
        <Tooltip
          wrapperStyle={{
            backgroundColor: 'rgba(10,9,8,0.96)',
            border: '1px solid rgba(212,196,168,0.24)',
            borderRadius: '10px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
          }}
          itemStyle={{ color: '#d4c4a8' }}
          labelStyle={{ color: '#fafaf9' }}
        />
        <Radar
          name="维度数据"
          dataKey="score"
          stroke="#d4c4a8"
          strokeWidth={1.75}
          fill="#d4c4a8"
          fillOpacity={0.24}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
