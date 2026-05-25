/**
 * 模拟调研（参考 atypica.AI）：人设构建 → AI 访谈 → 洞察报告
 */
import { buildCountryContext, runChatCompletion } from './deepseek.js';
import { parseJsonFromLlm } from './parseLlmJson.js';
import { formatResearchMaterialsForPrompt } from './simulatedResearch/materialsPrompt.js';

const USER_MIND_RULE = `【用户思维原则】所有发现、痛点、建议必须来自受访者自发表达、犹豫、表情与语气落差，可结合外部语料印证；禁止用产品经理逻辑推演或替用户下结论。`;

const PERSONA_MAX_TOKENS = 2000;
const INTERVIEW_MAX_TOKENS = 4096;
const REPORT_MAX_TOKENS = 2800;

/** 调用 DeepSeek 并解析 JSON，失败自动重试一次 */
async function chatJson(messages, options, { retryHint } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const msgs =
        attempt === 0
          ? messages
          : [
              ...messages.slice(0, -1),
              {
                role: 'user',
                content: `${messages[messages.length - 1].content}\n\n【重试】${retryHint || '上次输出不是合法 JSON。仅输出一个 JSON 对象；字符串内双引号须写成 \\"；每条 text 控制在 120 字以内，勿截断。'}`,
              },
            ];
      const content = await runChatCompletion(msgs, { ...options, jsonMode: true });
      return parseJsonFromLlm(content);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

function getMarketLabel(country) {
  if (!country) return '目标市场';
  return (
    country.displayTitle ||
    (country.parentTitle && country.marketType === 'region'
      ? `${country.parentTitle} · ${country.title}`
      : country.title)
  );
}

/**
 * 根据调研主题与人群条件，生成 2–5 个当地受访者人设
 */
export async function generateResearchPersonas({
  researchTopic,
  audienceCriteria,
  personaCount = 3,
  country,
  corpusContext = '',
  researchMaterials = null,
}) {
  const market = getMarketLabel(country);
  const count = Math.min(5, Math.max(2, Number(personaCount) || 3));
  const countryCtx = country ? buildCountryContext(country) : '';

  const system = `你是跨文化用户研究专家，擅长为【${market}】市场构建高保真受访者人设（Persona）。
人设需体现当地文化维度、消费心理与真实口语，避免刻板印象。输出必须是合法 JSON，不要 markdown 包裹外多余文字。`;

  const corpusBlock = corpusContext
    ? `\n## 外部语料（小红书/微博/知乎等，构建人设时请吸收真实口吻与痛点）\n${corpusContext}\n`
    : '';
  const materialsBlock = formatResearchMaterialsForPrompt(researchMaterials);

  const user = `${USER_MIND_RULE}
${materialsBlock}
调研主题：${researchTopic}
目标人群：${audienceCriteria || '由你根据主题合理设定'}
市场：${market}
${countryCtx}
${corpusBlock}
请生成 ${count} 位差异化受访者，JSON 格式：
{
  "personas": [
    {
      "id": "p1",
      "name": "当地常见姓名",
      "age": 28,
      "occupation": "职业",
      "city": "城市",
      "oneLiner": "一句话人设",
      "background": "2-3句生活背景",
      "values": ["价值观1","价值观2"],
      "painPoints": ["痛点1","痛点2"],
      "decisionStyle": "如何做购买/使用决策",
      "culturalNotes": "与${market}文化相关的1-2句特征",
      "corpusInspiration": "吸收了哪条外部语料观点（可选）"
    }
  ]
}`;

  const data = await chatJson(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { maxTokens: PERSONA_MAX_TOKENS, temperature: 0.75 },
    { retryHint: '人设 JSON 无效。仅输出 {"personas":[...]}，姓名与背景用当地语言，字符串内引号须转义。' },
  );
  const personas = data.personas || data;
  if (!Array.isArray(personas) || personas.length === 0) {
    throw new Error('人设生成失败，请重试');
  }
  return personas.map((p, i) => ({
    ...p,
    id: p.id || `p${i + 1}`,
  }));
}

/**
 * 模拟「访谈员 ↔ 受访者」深度对话（单次生成完整笔录）
 */
export async function runSimulatedInterview({
  persona,
  researchTopic,
  guideQuestions = [],
  country,
  corpusContext = '',
  researchMaterials = null,
}) {
  const market = getMarketLabel(country);
  const countryCtx = country ? buildCountryContext(country) : '';
  const guide =
    guideQuestions.length > 0
      ? `须覆盖以下问题方向：\n${guideQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
      : '自拟 5–6 个深度追问（含行为、情绪、决策、文化相关）';

  const system = `你同时协调两位研究专员（输出一份 JSON）：
1) **访谈笔录专员**：资深定性访谈员，与受访者对话、追问
2) **表情与情绪观察专员**（静默不发言）：记录受访者在使用软件、进入某场景、看到某界面时的微表情、语气变化、情绪落差（嘴上说 OK 但表情犹豫等）
3) 受访者「${persona.name}」——严格按人设第一人称回答，口语化

模拟真实一对一深度访谈；若有 UI 流程素材，访谈员须按步骤追问自发感受。输出合法 JSON。`;

  const corpusBlock = corpusContext
    ? `\n## 外部语料（真实用户口吻参考，勿逻辑推演）\n${corpusContext}\n`
    : '';
  const materialsBlock = formatResearchMaterialsForPrompt(researchMaterials);

  const user = `${USER_MIND_RULE}
${materialsBlock}
市场：${market}
调研主题：${researchTopic}
${countryCtx}
${corpusBlock}
受访者人设：
- ${persona.name}，${persona.age}岁，${persona.occupation}，${persona.city || market}
- 背景：${persona.background}
- 价值观：${(persona.values || []).join('、')}
- 痛点：${(persona.painPoints || []).join('、')}
- 决策风格：${persona.decisionStyle || '未说明'}

${guide}

输出 JSON：
{
  "summary": "本场访谈 2 句摘要（强调用户自发问题）",
  "transcript": [
    { "role": "interviewer", "text": "访谈员问题" },
    { "role": "participant", "text": "受访者回答" }
  ],
  "observationLog": [
    {
      "transcriptIndex": 1,
      "scene": "场景如：打开支付页/到店取货",
      "expression": "微表情描述",
      "emotion": "情绪状态",
      "gapNote": "言语与表情/情绪的落差",
      "userMindInsight": "用户自发顾虑（非逻辑推演）"
    }
  ],
  "keyQuotes": ["原话金句"],
  "insights": ["基于自发反应的洞察"]
}
transcript 固定 5 轮（10 条访+答）；每条 text≤100字。observationLog 在每条 participant 回答后至少 1 条（transcriptIndex 指向该条 transcript 下标）。用当地语言。`;

  const data = await chatJson(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { maxTokens: INTERVIEW_MAX_TOKENS, temperature: 0.65 },
    {
      retryHint:
        '访谈 JSON 无效或被截断。仅输出一个 JSON；transcript 恰好 10 条；每条 text≤100字；引号转义为 \\".',
    },
  );
  return {
    personaId: persona.id,
    personaName: persona.name,
    summary: data.summary || '',
    transcript: Array.isArray(data.transcript) ? data.transcript : [],
    observationLog: Array.isArray(data.observationLog) ? data.observationLog : [],
    keyQuotes: data.keyQuotes || [],
    insights: data.insights || [],
  };
}

/**
 * 综合多场模拟访谈，输出 Markdown 调研报告
 */
export async function synthesizeResearchReport({
  researchTopic,
  audienceCriteria,
  personas,
  interviews,
  country,
  corpusSnippets = [],
  researchMaterials = null,
}) {
  const market = getMarketLabel(country);
  const countryCtx = country ? buildCountryContext(country) : '';

  const interviewBlock = interviews
    .map((iv, idx) => {
      const lines = (iv.transcript || [])
        .slice(0, 16)
        .map((t) => `${t.role === 'interviewer' ? '访' : '答'}：${t.text}`)
        .join('\n');
      const obs = (iv.observationLog || [])
        .map(
          (o) =>
            `[观察] ${o.scene || ''} ${o.expression || ''} 情绪:${o.emotion || ''} 落差:${o.gapNote || ''} 自发:${o.userMindInsight || ''}`,
        )
        .join('\n');
      return `### 受访者 ${idx + 1}：${iv.personaName}
摘要：${iv.summary}
金句：${(iv.keyQuotes || []).join('；')}
洞察：${(iv.insights || []).join('；')}
表情/情绪观察：
${obs || '（无）'}
笔录节选：
${lines}`;
    })
    .join('\n\n');

  const corpusBlock =
    corpusSnippets?.length > 0
      ? `\n# 外部语料来源\n${corpusSnippets.map((s) => `- [${s.sourceLabel || s.source}] ${s.title}：${s.content}`).join('\n')}\n`
      : '';

  const system = `你是商业与用户研究总监，擅长把定性访谈转化为可交付的调研报告。
语言：中文，产品团队可读。结合跨文化视角（中国团队出海场景）。`;

  const materialsBlock = formatResearchMaterialsForPrompt(researchMaterials);

  const user = `${USER_MIND_RULE}
请基于以下【模拟访谈】材料，撰写完整调研报告（Markdown）。
${corpusBlock}
${materialsBlock}

# 基本信息
- 市场：${market}
- 主题：${researchTopic}
- 目标人群：${audienceCriteria || '见人设'}
${countryCtx}

# 人设列表
${personas.map((p) => `- **${p.name}**（${p.age}岁，${p.occupation}）：${p.oneLiner || p.background}`).join('\n')}

# 模拟访谈记录
${interviewBlock}

# 报告结构（必须全部包含）
## 1. 执行摘要
## 2. 研究背景与目标
## 3. 受访者画像概览
## 4. 核心发现（分点，标注 🔴🟡🟢；须来自用户自发反应与观察专员记录，非逻辑推演）
## 5. 非语言与情绪观察摘要（微表情、情绪落差、使用软件时的自发顾虑）
## 6. 用户原话摘录（引用块 > 格式）
## 7. 跨文化洞察（与${market}本地习惯、中国团队假设的差异）
## 8. 对产品/设计的建议（P0/P1/P2，对应用户自发问题）
## 9. 局限性与下一步验证建议

要求：有数据感、有引用、可贴进 PRD；总字数 1500–2500 字。`;

  const report = await runChatCompletion(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { maxTokens: REPORT_MAX_TOKENS, temperature: 0.5 },
  );

  return report.trim();
}

/** 供三步分析报告联动的摘要 */
export function buildSimResearchSyncPayload({
  researchTopic,
  audienceCriteria,
  marketTitle,
  personas,
  interviews,
  simReport,
  corpusSnippets,
  researchMaterials,
}) {
  const interviewSummary = (interviews || [])
    .map((iv) => {
      const obs = (iv.observationLog || [])
        .map((o) => `${o.scene}: ${o.userMindInsight || o.gapNote}`)
        .filter(Boolean)
        .join('；');
      return `【${iv.personaName}】${iv.summary}\n金句：${(iv.keyQuotes || []).join('；')}\n观察：${obs || '—'}\n洞察：${(iv.insights || []).join('；')}`;
    })
    .join('\n\n');
  const materialsNote = formatResearchMaterialsForPrompt(researchMaterials);

  const corpusNote =
    corpusSnippets?.length > 0
      ? `\n外部语料（${corpusSnippets.length} 条）：${corpusSnippets.map((s) => s.title).join('、')}`
      : '';

  return `【模拟调研结论 · 请纳入跨文化三步分析】
${USER_MIND_RULE}
调研主题：${researchTopic}
目标人群：${audienceCriteria || '见模拟人设'}
目标市场：${marketTitle}${corpusNote}
${materialsNote}

受访者：${(personas || []).map((p) => `${p.name}(${p.occupation})`).join('、')}

模拟访谈摘要：
${interviewSummary}

模拟调研报告（节选）：
${(simReport || '').slice(0, 3500)}

---
请基于以上模拟调研证据，完成：①发现问题 ②分析根因（含 Hofstede/跨文化）③应对策略与 P0/P1/P2，并指出模拟调研与真实落地仍需验证的点。`;
}
