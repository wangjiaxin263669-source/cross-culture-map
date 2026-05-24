import { retrieveRelevantChunks, formatKnowledgeContext } from './knowledge.js';
import { loadSkillPrompt } from './loadSkill.js';

const API_BASE = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com';
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const CHAT_MAX_TOKENS = Number(process.env.DEEPSEEK_CHAT_MAX_TOKENS || 3000);
const REPORT_SECTION_MAX_TOKENS = Number(process.env.DEEPSEEK_REPORT_MAX_TOKENS || 1400);
const API_TIMEOUT_MS = Number(process.env.DEEPSEEK_TIMEOUT_MS || 55000);

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

执行 SKILL「文化民族志四步法」，输出 **精炼 Markdown**（控制篇幅，条理清晰）。
`;
  }

  return prompt;
}

function appendReportSectionGuide(prompt, section) {
  if (section === 'analysis') {
    return `${prompt}

## 本轮仅输出报告前半部分（勿写后半部分标题）

# 本地化设计报告 · {国家/地区}

## 1. 文化背景与 Cultural Fit Gap（3–5 句）

## 2. 维度诊断（因）— 结合 Hofstede，每项 1–2 句

## 3. 关键发现（3–5 条，含设计影响）`;
  }
  if (section === 'strategy') {
    return `${prompt}

## 本轮仅输出报告后半部分（勿重复前半标题）

## 4. UI/UX 策略（果）— 信息架构 / 视觉 / 文案 / 信任（各 2–3 点）

## 5. 风险评级（🔴🟡🟢）

## 6. 可执行建议 P0/P1/P2

## 7. 验证方法（2–3 条）`;
  }
  return `${prompt}

# 本地化设计报告 · {国家/地区}
## 1–7 完整结构（精炼，总字数 ≤2000）`;
}

function buildAgentSystemPromptWithSection(opts) {
  const base = buildAgentSystemPrompt(opts);
  if (opts.mode !== 'report') return base;
  return appendReportSectionGuide(base, opts.section || 'full');
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
  const methodBlock = country.methodology?.steps?.length
    ? `\n- 结论依据：${country.methodology.steps.join('；')}`
    : '';
  const refBlock = country.references?.length
    ? `\n- 文献：${country.references.map((r) => `${r.title} (${r.url})`).join('；')}`
    : '';
  const videoBlock = country.videos?.length
    ? `\n- 推荐视频：${country.videos.map((v) => `${v.title} (${v.url})`).join('；')}`
    : '';
  const regionLabel =
    country.displayTitle ||
    (country.parentTitle && country.marketType === 'region'
      ? `${country.parentTitle} · ${country.title}`
      : country.title);
  return `
## 当前目标市场（平台内置 Hofstede 数据）
- 国家/地区：${regionLabel}（${country.label}）
- 单元类型：${country.marketType === 'region' ? `地区（${country.parentTitle || '下属行政区'}）` : '国家'}
- 文化概览：${country.overview || country.tagline || ''}
- 维度分数：${dims}
- UI 信息密度指数：${country.density}%${storyBlock}${methodBlock}${refBlock}${videoBlock}
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

async function chatCompletion(messages, { maxTokens = CHAT_MAX_TOKENS } = {}) {
  const apiKey = getApiKey();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.6,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('DeepSeek 响应超时，请稍后重试或缩短产品描述');
    }
    throw wrapApiError(err);
  } finally {
    clearTimeout(timer);
  }

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
    return await chatCompletion(messages, { maxTokens: CHAT_MAX_TOKENS });
  } catch (err) {
    if (err.message?.startsWith('未配置') || err.message?.startsWith('DEEPSEEK')) throw err;
    throw wrapApiError(err);
  }
}

async function generateReportSection({ productIdea, country, section }) {
  const query = `${productIdea} ${country.title} 本地化 UI UX 设计`;
  const chunks = retrieveRelevantChunks(query, section === 'analysis' ? 4 : 3);
  const knowledge = formatKnowledgeContext(chunks);
  const systemContent = buildAgentSystemPromptWithSection({
    knowledge,
    country,
    mode: 'report',
    section,
  });

  const regionLabel =
    country.displayTitle ||
    (country.parentTitle && country.marketType === 'region'
      ? `${country.parentTitle} · ${country.title}`
      : country.title);

  const userContent = `请为以下产品在【${regionLabel}】市场生成本地化设计报告（${section === 'analysis' ? '前半：背景+维度+发现' : '后半：策略+风险+建议+验证'}）。

产品/设计构想：
${productIdea}

要求：引用 Hofstede 分数与课程资料；因果清晰；篇幅精炼。`;

  const messages = [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent },
  ];

  return chatCompletion(messages, { maxTokens: REPORT_SECTION_MAX_TOKENS });
}

/** 并行生成两段报告，避免 Netlify 30s 网关超时 */
export async function generateLocalizationReport({ productIdea, country }) {
  if (!country) {
    throw new Error('请先在地球上选择目标国家/地区');
  }

  try {
    const [analysis, strategy] = await Promise.all([
      generateReportSection({ productIdea, country, section: 'analysis' }),
      generateReportSection({ productIdea, country, section: 'strategy' }),
    ]);
    return `${analysis.trim()}\n\n${strategy.trim()}`;
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
