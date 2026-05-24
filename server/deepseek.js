import { retrieveRelevantChunks, formatKnowledgeContext } from './knowledge.js';
import { loadSkillPrompt } from './loadSkill.js';

const API_BASE = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com';
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const CHAT_MAX_TOKENS = Number(process.env.DEEPSEEK_CHAT_MAX_TOKENS || 3000);
const REPORT_SECTION_MAX_TOKENS = Number(process.env.DEEPSEEK_REPORT_MAX_TOKENS || 1400);
const API_TIMEOUT_MS = Number(process.env.DEEPSEEK_TIMEOUT_MS || 55000);

const PLATFORM_APPENDIX = `
## 平台集成说明（CROSS-CULTURE Design Decision Platform）

你正在该平台中运行，服务对象主要是 **中国设计从业者**。

**用户输入通常包含**：产品需求、目标人群、使用场景、要做什么（若缺失则根据产品构想合理补全并标注假设）。

**必须遵循 SKILL 中的「三步分析法」**：
1. **发现问题** — 中国团队在目标市场可能遇到的产品/沟通/交往障碍（多角度、找准案例重点）
2. **分析问题** — 文化根因；必要时用语用学/语言学（面子理论、高/低语境、礼貌策略等）通俗解释
3. **应对或总结** — 尊重当地文化、求同存异、可执行策略（P0/P1/P2）；不宜给方案时只做案例总结

**数据协同**：
- 引用平台 **Hofstede 六维度** 与 **文化故事/文献**（若已选国家/地区）
- 引用下方 **课程 PDF 检索资料** 时注明「据课程资料」
- 可从 SKILL **五大研究视角**（他者镜像、翻译密码、流行文化出海、话语偏见、身份困惑）中选 1–2 个增强分析

**表达**：默认中文；先【因】后【果】；案例具体；避免文化傲慢与刻板印象。

## 对话模式（左侧助手）

结构：文化背景（简）→ 发现问题 → 分析问题 → 应对/总结 → 验证方法。分点清晰，每条标注 🔴🟡🟢 若适用。
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

## 本轮仅输出报告前半部分（勿写后半部分章节）

# 跨文化产品设计报告 · {国家/地区}

> 受众：中国设计团队 → 目标市场

## 0. 项目摘要（产品 / 人群 / 场景 / 目标）

## 1. 发现问题 — 可能遇到的障碍与案例要点
（产品、沟通、交往；多角度；🔴🟡🟢；找准重点）

## 2. 分析问题 — 文化差异与语用学解释
（对照「在中国通常…在目标市场通常…」；Hofstede；可选面子理论/高语境等；据课程资料处注明）`;
  }
  if (section === 'strategy') {
    return `${prompt}

## 本轮仅输出报告后半部分（从第 3 节开始，勿重复前两节）

## 3. 应对策略或案例总结
（尊重当地文化、求同存异；P0/P1/P2；不需方案时做案例归纳）

## 4. UI/UX/文案落地建议（【因】→【果】）

## 5. 五大视角延伸（可选 1–2 条：他者镜像 / 翻译 / 流行文化 / 话语偏见 / 身份）

## 6. 风险与验证方法

## 7. 收束：跨文化同理心（1–2 句）`;
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

  const userContent = `请为【${regionLabel}】市场撰写跨文化产品设计报告（${section === 'analysis' ? '前半：摘要+发现问题+分析问题' : '后半：应对策略+落地建议+验证+收束'}）。

沟通者提供的信息（请从中解析 产品 / 人群 / 场景 / 要做什么；若未写清则合理假设并标明）：
${productIdea}

要求：
- 严格执行 SKILL「三步分析法」，站在中国设计从业者视角
- 分析问题时可引用语用学（如面子理论）与 Hofstede 维度
- 引用平台文化故事与课程资料；因果链清晰；篇幅精炼`;

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
