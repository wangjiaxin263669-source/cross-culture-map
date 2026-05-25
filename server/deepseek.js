import { retrieveRelevantChunks, formatKnowledgeContext } from './knowledge.js';
import { isServerlessRuntime, loadSkillPrompt } from './loadSkill.js';

const API_BASE = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com';
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const CHAT_MAX_TOKENS = Number(process.env.DEEPSEEK_CHAT_MAX_TOKENS || 1800);
const REPORT_SECTION_MAX_TOKENS = Number(process.env.DEEPSEEK_REPORT_MAX_TOKENS || 1400);
const REPORT_SINGLE_MAX_TOKENS = Number(process.env.DEEPSEEK_REPORT_SINGLE_MAX_TOKENS || 3200);
const API_TIMEOUT_MS = Number(
  process.env.DEEPSEEK_TIMEOUT_MS || (isServerlessRuntime() ? 50000 : 55000),
);
const CHAT_RAG_CHUNKS = 2;
const REPORT_RAG_CHUNKS = 3;

const PLATFORM_APPENDIX = `
## 平台集成说明（CROSS-CULTURE · 整合版 SKILL）

你同时掌握 **整合版 cross-cultural-research SKILL** 的全部能力，输出时 **不得删减** 既有工具，按场景 **组合调用**：

| 层级 | 能力 | 用法 |
|------|------|------|
| **主干** | 三步分析法 | 对话/报告的 **章节结构**（发现问题→分析根因→应对/总结） |
| **工具** | 六维度 Hofstede | 第二步必引平台雷达分数 |
| **工具** | 文化民族志四步法 | 第二、三步的研究与设计深度 |
| **工具** | 场景 A/B/C/D | 自动识别用户意图（入市/转化低/预算/视觉） |
| **工具** | 五大研究视角 | 第二步选 1–2 条深化 |
| **工具** | 区域速查 + 语用学 | 面子理论、高/低语境等 |
| **工具** | Cultural Fit Gap | 场景 A 或新市场必给适配度判断 |
| **工具** | 研究方法与验证 | 第三步与文末 |
| **思维** | 五大产品思维 | **全程**：用户感受(反上帝视角)、项目/B计划、数据、商业三角、全局 |

**用户输入**：产品 / 人群 / 场景 / 目标（缺则假设并标明）。

**数据**：Hofstede + 文化故事/文献/视频 + 课程 RAG（注明「据课程资料」）。

**表达（给中国产品设计师）**：
- **说人话**：像产品总监汇报，不要论文腔
- 文化概念必须用「人话定义 + 例子 + 对产品意味着什么」四行降维
- 第三步含 **7 阶段全链路** + **B 计划** + **可量化指标**
- 五大思维：至少各 1 次——用户真实感受、横向协作、数据驱动、商业平衡、全盘非单点
- 【因】→【果】；🔴🟡🟢；P0/P1/P2 对应阶段

## 对话模式

文化背景 → 发现问题(含用户感受) → 分析(降维) → 应对(全链路+B计划+指标) → 验证。
`;

function buildAgentSystemPrompt({ knowledge, country, mode = 'chat' }) {
  const skillVariant = mode === 'chat' || isServerlessRuntime() ? 'compact' : 'full';
  const { body: skillBody } = loadSkillPrompt({ variant: skillVariant });

  let prompt = `${skillBody}

${PLATFORM_APPENDIX}

## 本轮检索到的课程资料（RAG）
${knowledge}
${buildCountryContext(country)}
`;

  if (mode === 'report') {
    prompt += `
## 报告模式（右侧「跨文化三步分析报告」）

执行 **整合版 SKILL**：三步主干 + 五大产品思维(必体现) + 六维度 + 四步法 + 7阶段全链路 + B计划 + 数据指标 + Fit Gap。产品语言，非论文。
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

## 1. 发现问题
（含用户感受/真实目的至少1条；全局风险至少1条；🔴🟡🟢）

## 2. 分析问题
（六维度四行降维；中外对照；语用学按需；数据/商业视角各可1段）

## 2.5 Cultural Fit Gap（全局适配度）

## 2.6 五大产品思维速览（⑤条各2–3句人话，供团队对齐）`;
  }
  if (section === 'strategy') {
    return `${prompt}

## 本轮仅输出报告后半部分（从第 3 节开始，勿重复前两节）

## 3. 应对策略或案例总结
（求同存异；P0/P1/P2；不宜给方案时仅案例归纳）

## 4. 适应性设计方案（P0/P1/P2，产品语言，【因】→【果】）

## 5. 产品全链路落地清单（7阶段+横向协作要点）

## 6. B 计划（主方案受阻时的降级路径）

## 7. 数据指标与下一版目标（假设→看什么→成功标准）

## 8. 风险与验证方法

## 9. 收束（全局视角下的首要行动）`;
  }
  return `${prompt}

## 本轮输出完整报告（章节 0–9，精炼，总字数 ≤2800）

# 跨文化产品设计报告 · {国家/地区}

## 0. 项目摘要
## 1. 发现问题（🔴🟡🟢；用户感受+全局风险）
## 2. 分析问题（六维度四行降维）
## 2.5 Cultural Fit Gap
## 2.6 五大产品思维速览
## 3. 应对策略（P0/P1/P2）
## 4. 适应性设计方案
## 5. 产品全链路落地清单（7阶段）
## 6. B 计划
## 7. 数据指标与下一版目标
## 8. 风险与验证方法
## 9. 收束`;
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

export function buildCountryContext(country) {
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

export async function runChatCompletion(
  messages,
  { maxTokens = CHAT_MAX_TOKENS, temperature = 0.6, jsonMode = false } = {},
) {
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
        temperature,
        max_tokens: maxTokens,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
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
  const chunks = retrieveRelevantChunks(message, CHAT_RAG_CHUNKS);
  const knowledge = formatKnowledgeContext(chunks);
  const systemContent = buildAgentSystemPrompt({ knowledge, country, mode: 'chat' });

  const messages = [
    { role: 'system', content: systemContent },
    ...normalizeHistory(history),
    { role: 'user', content: String(message).trim() },
  ];

  try {
    return await runChatCompletion(messages, { maxTokens: CHAT_MAX_TOKENS });
  } catch (err) {
    if (err.message?.startsWith('未配置') || err.message?.startsWith('DEEPSEEK')) throw err;
    throw wrapApiError(err);
  }
}

async function generateReportSection({ productIdea, country, section }) {
  const query = `${productIdea} ${country.title} 本地化 UI UX 设计`;
  const chunks = retrieveRelevantChunks(query, REPORT_RAG_CHUNKS);
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
- 整合版 SKILL + **五大产品思维必体现**（用户感受非上帝视角、项目/B计划、数据指标、商业三角、全局非单点）
- 产品语言、四行降维；7阶段全链路 + B计划 + 下一版数据目标
- 引用平台文化故事与课程资料；可贴 PRD 附录`;

  const messages = [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent },
  ];

  return runChatCompletion(messages, { maxTokens: REPORT_SECTION_MAX_TOKENS });
}

/** Netlify：单次调用 + 精简 SKILL，控制在 60s 内 */
async function generateReportSingleCall({ productIdea, country }) {
  const query = `${productIdea} ${country.title} 本地化 UI UX 设计`;
  const chunks = retrieveRelevantChunks(query, REPORT_RAG_CHUNKS);
  const knowledge = formatKnowledgeContext(chunks);
  const systemContent = buildAgentSystemPromptWithSection({
    knowledge,
    country,
    mode: 'report',
    section: 'full',
  });

  const regionLabel =
    country.displayTitle ||
    (country.parentTitle && country.marketType === 'region'
      ? `${country.parentTitle} · ${country.title}`
      : country.title);

  const userContent = `请为【${regionLabel}】撰写完整跨文化产品设计报告（章节 0–9，精炼可执行）。

产品信息：
${productIdea}

要求：三步 + 五大思维 + Fit Gap + 7阶段 + B计划 + 数据指标；产品语言；引用平台数据。`;

  const messages = [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent },
  ];

  return runChatCompletion(messages, { maxTokens: REPORT_SINGLE_MAX_TOKENS });
}

/** 本地：并行两段；Serverless：单次调用防 504 */
export async function generateLocalizationReport({ productIdea, country }) {
  if (!country) {
    throw new Error('请先在地球上选择目标国家/地区');
  }

  try {
    if (isServerlessRuntime()) {
      return (await generateReportSingleCall({ productIdea, country })).trim();
    }
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
