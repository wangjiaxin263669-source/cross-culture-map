import { retrieveRelevantChunks, formatKnowledgeContext } from './knowledge.js';
import { loadSkillPrompt } from './loadSkill.js';

const API_BASE = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com';
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

const PLATFORM_APPENDIX = `
## 平台集成说明（CROSS-CULTURE Design Decision Platform）

你正在该平台中运行，需与以下数据协同：
- **Hofstede 六维度分数**：若用户已在地球仪选定国家，必须引用平台提供的维度数据（权力距离、个人主义、不确定性规避等）。
- **课程 PDF 知识库**：下方「本轮检索资料」来自《跨文化研究》课程讲义，引用时注明「据课程资料」。
- **因果表达**：分析时先写【因】文化机制/维度，再写【果】UI/UX/文案/交互策略。
- **故事化表达**：优先用简短历史/文化故事帮助理解，避免枯燥堆砌理论；可推荐 1–2 个延伸阅读视频链接（Bilibili / YouTube / NN/g 等）。
- **语言**：默认中文，专业术语可附英文。

## 场景识别（自动匹配 SKILL 中的场景 A/B/C/D）

- 进入新市场 / 本地化 → 场景 A：文化适配差距分析（Cultural Fit Gap Analysis）
- 功能转化率低 / 水土不服 → 场景 B：定位文化假设 + 验证方法
- 预算有限的研究 → 场景 C：轻量远程民族志方案
- 视觉/符号/色彩接受度 → 场景 D：文化符号学分析

## 对话模式（左侧「跨文化设计助手」）

- 遵循 SKILL 输出格式：文化背景分析 → 关键发现 → 风险评级（🔴🟡🟢）→ 可执行建议 → 验证方法
- 回答简洁、分点，避免空泛；提醒文化框架是启发式而非刻板分类
`;

function buildAgentSystemPrompt({ knowledge, country, mode = 'chat' }) {
  const { body: skillBody } = loadSkillPrompt();

  let prompt = `${skillBody}

${PLATFORM_APPENDIX}

## 本轮检索到的课程资料（RAG）
${knowledge}
${buildCountryContext(country)}
`;

  if (mode === 'report') {
    prompt += `
## 报告模式（右侧「生成本地化设计报告」）

请执行 SKILL 中的「文化民族志四步法」，并输出完整 Markdown 报告，结构如下：

# 本地化设计报告 · {国家}

## 1. 文化背景分析
（2-3 句总览，含 Cultural Fit Gap 判断）

## 2. 文化维度诊断（因）— 结合 Hofstede 分数逐项分析

## 3. 关键发现
（编号列表，每项含设计影响）

## 4. UI/UX 本地化策略（果）
### 4.1 信息架构与布局
### 4.2 视觉与色彩
### 4.3 文案与沟通调性（高/低语境）
### 4.4 交互与信任机制

## 5. 风险评级
（🔴 高 / 🟡 中 / 🟢 低，列表说明）

## 6. 参考案例与对照

## 7. 可执行建议（按优先级 P0/P1/P2）

## 8. 验证方法（A/B、民族志、文化探针等）

## 9. 研究方法论建议（Research for Design 路径）
`;
  }

  return prompt;
}

function getApiKey() {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) {
    throw new Error('未配置 DEEPSEEK_API_KEY。请在项目根目录 .env 中填入 DeepSeek API Key（https://platform.deepseek.com/api_keys）');
  }
  return key;
}

function wrapApiError(err, data) {
  const msg = err?.message || data?.error?.message || String(err);
  if (msg.includes('401') || msg.includes('invalid') || msg.includes('authentication')) {
    return new Error('DEEPSEEK_API_KEY 无效或已过期，请在 DeepSeek 开放平台重新创建并更新 .env');
  }
  if (msg.includes('fetch failed') || msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT')) {
    return new Error('无法连接 DeepSeek API，请检查网络后重试。');
  }
  if (msg.includes('Insufficient Balance') || msg.includes('insufficient_quota')) {
    return new Error('DeepSeek 账户余额不足，请前往平台充值后重试。');
  }
  return new Error(msg || 'AI 请求失败');
}

function buildCountryContext(country) {
  if (!country) return '';
  const dims = country.radarData
    ?.map((d) => `${d.name}: ${d.score}`)
    .join('；');
  const story = country.culturalStory;
  const storyBlock = story
    ? `
- 文化故事「${story.title}」：${(story.paragraphs || []).join(' ')}
- 故事→设计：${story.designLink || ''}`
    : '';
  const videoBlock = country.videos?.length
    ? `\n- 平台推荐视频：${country.videos.map((v) => `${v.title} (${v.url})`).join('；')}`
    : '';
  return `
## 当前目标市场（平台内置 Hofstede 数据）
- 国家/地区：${country.title}（${country.label}）
- 文化概览：${country.overview || country.tagline || ''}
- 维度分数：${dims}
- UI 信息密度指数：${country.density}%${storyBlock}${videoBlock}
`;
}

function normalizeHistory(history) {
  return history
    .filter((m) => m?.text?.trim())
    .map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: String(m.text).trim(),
    }))
    .filter((m, i, arr) => !(i === 0 && m.role === 'assistant'))
    .slice(-20);
}

async function chatCompletion(messages) {
  const apiKey = getApiKey();
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.65,
      max_tokens: 4096,
    }),
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    throw wrapApiError(null, data);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('DeepSeek 返回为空，请重试');
  }
  return content;
}

export async function generateChatReply({ message, history = [], country = null }) {
  const chunks = retrieveRelevantChunks(message, 4);
  const knowledge = formatKnowledgeContext(chunks);
  const systemContent = buildAgentSystemPrompt({ knowledge, country, mode: 'chat' });

  const messages = [
    { role: 'system', content: systemContent },
    ...normalizeHistory(history),
    { role: 'user', content: String(message).trim() },
  ];

  try {
    return await chatCompletion(messages);
  } catch (err) {
    if (err.message?.startsWith('未配置') || err.message?.startsWith('DEEPSEEK')) throw err;
    throw wrapApiError(err);
  }
}

export async function generateLocalizationReport({ productIdea, country }) {
  if (!country) {
    throw new Error('请先在地球上选择目标国家/地区');
  }

  const query = `${productIdea} ${country.title} 本地化 UI UX 设计`;
  const chunks = retrieveRelevantChunks(query, 5);
  const knowledge = formatKnowledgeContext(chunks);
  const systemContent = buildAgentSystemPrompt({ knowledge, country, mode: 'report' });

  const userContent = `请为以下产品在【${country.title}】市场生成本地化设计报告。

产品/设计构想：
${productIdea}

要求：
1. 严格执行系统提示中的报告结构与 SKILL 四步法
2. 引用平台 Hofstede 维度分数与课程资料
3. 给出 Cultural Fit Gap 判断与 P0/P1/P2 优先级建议`;

  const messages = [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent },
  ];

  try {
    return await chatCompletion(messages);
  } catch (err) {
    if (err.message?.startsWith('未配置') || err.message?.startsWith('DEEPSEEK')) throw err;
    throw wrapApiError(err);
  }
}

export function getModelName() {
  return MODEL;
}

export function isConfigured() {
  return Boolean(process.env.DEEPSEEK_API_KEY?.trim());
}
