import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { checkAiHealth } from '../services/aiApi';
import { getStoredAiModel, MODEL_FLASH, setStoredAiModel } from '../utils/aiModelStorage';

const AiModelContext = createContext(null);

const FALLBACK_MODELS = [
  { id: MODEL_FLASH, label: 'V4 Flash', description: '响应更快', tag: '推荐' },
  { id: 'deepseek-v4-pro', label: 'V4 Pro', description: '推理更深', tag: '深度' },
];

export function AiModelProvider({ children }) {
  const [modelId, setModelIdState] = useState(getStoredAiModel);
  const [models, setModels] = useState(FALLBACK_MODELS);
  const [defaultModel, setDefaultModel] = useState(MODEL_FLASH);

  useEffect(() => {
    checkAiHealth()
      .then((h) => {
        const cfg = h?.deepseekModels;
        if (cfg?.models?.length) {
          setModels(cfg.models);
          setDefaultModel(cfg.defaultModel || MODEL_FLASH);
          const stored = getStoredAiModel();
          if (!cfg.models.some((m) => m.id === stored)) {
            setModelIdState(cfg.defaultModel || MODEL_FLASH);
          }
        }
      })
      .catch(() => {});
  }, []);

  const setModelId = useCallback((id) => {
    setModelIdState(id);
    setStoredAiModel(id);
  }, []);

  const current = useMemo(
    () => models.find((m) => m.id === modelId) || models[0],
    [models, modelId],
  );

  const value = useMemo(
    () => ({ modelId, setModelId, models, current, defaultModel }),
    [modelId, setModelId, models, current, defaultModel],
  );

  return <AiModelContext.Provider value={value}>{children}</AiModelContext.Provider>;
}

export function useAiModel() {
  const ctx = useContext(AiModelContext);
  if (!ctx) throw new Error('useAiModel 须在 AiModelProvider 内使用');
  return ctx;
}
