const STORAGE_KEY = 'ccm-deepseek-model';
export const MODEL_FLASH = 'deepseek-v4-flash';
export const MODEL_PRO = 'deepseek-v4-pro';

export function getStoredAiModel() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === MODEL_FLASH || v === MODEL_PRO) return v;
  } catch {
    /* ignore */
  }
  return MODEL_FLASH;
}

export function setStoredAiModel(modelId) {
  try {
    localStorage.setItem(STORAGE_KEY, modelId);
  } catch {
    /* ignore */
  }
}
