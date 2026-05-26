/**
 * DeepSeek V4 模型配置（用户可在前端切换）
 */
export const DEEPSEEK_MODELS = [
  {
    id: 'deepseek-v4-flash',
    label: 'V4 Flash',
    description: '响应更快，适合对话与多轮模拟调研',
    tag: '推荐',
  },
  {
    id: 'deepseek-v4-pro',
    label: 'V4 Pro',
    description: '推理更深，适合长报告与复杂分析',
    tag: '深度',
  },
];

const DEFAULT_MODEL_ID =
  process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-v4-flash';

const ALLOWED_IDS = new Set(DEEPSEEK_MODELS.map((m) => m.id));

/** 校验并解析请求中的 model，非法则回退默认 */
export function resolveDeepSeekModel(requested) {
  const id = String(requested || DEFAULT_MODEL_ID).trim();
  if (ALLOWED_IDS.has(id)) return id;
  if (ALLOWED_IDS.has(DEFAULT_MODEL_ID)) return DEFAULT_MODEL_ID;
  return DEEPSEEK_MODELS[0].id;
}

export function getDefaultDeepSeekModel() {
  return resolveDeepSeekModel(DEFAULT_MODEL_ID);
}

export function getDeepSeekModelsPublicConfig() {
  return {
    defaultModel: getDefaultDeepSeekModel(),
    models: DEEPSEEK_MODELS,
  };
}
