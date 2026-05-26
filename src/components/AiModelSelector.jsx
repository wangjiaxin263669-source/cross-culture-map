import React from 'react';
import { useAiModel } from '../context/AiModelContext';

/** 顶部 DeepSeek V4 模型切换 */
export default function AiModelSelector({ compact = false }) {
  const { modelId, setModelId, models, current } = useAiModel();

  return (
    <div className={`ai-model-selector ${compact ? 'compact' : ''}`} title={current?.description}>
      <label className="ai-model-label" htmlFor="ai-model-select">
        AI 模型
      </label>
      <select
        id="ai-model-select"
        className="ai-model-select"
        value={modelId}
        onChange={(e) => setModelId(e.target.value)}
      >
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
            {m.tag ? ` · ${m.tag}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
