/**
 * 模拟调研（参考 atypica.AI）：人设构建 → AI 访谈 → 洞察报告
 */
import { buildCountryContext, runChatCompletion } from './deepseek.js';

const PERSONA_MAX_TOKENS = 1400;
const INTERVIEW_MAX_TOKENS = 1800;
const REPORT_MAX_TOKENS = 2800;

function parseJsonFromLlm(text) {
  const raw = String(text).trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1].trim() : raw;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const arrStart = candidate.indexOf('[');
    const pick = start === -1 ? arrStart : arrStart === -1 ? start : Math.min(start, arrStart);
    if (pick >= 0) {
      return JSON.parse(candidate.slice(pick));
    }
    throw new Error('AI 返回格式无法解析，请重试');
  }
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
}) {
  const market = getMarketLabel(country);
  const count = Math.min(5, Math.max(2, Number(personaCount) || 3));
  const countryCtx = country ? buildCountryContext(country) : '';

  const system = `你是跨文化用户研究专家，擅长为【${market}】市场构建高保真受访者人设（Persona）。
人设需体现当地文化维度、消费心理与真实口语，避免刻板印象。输出必须是合法 JSON，不要 markdown 包裹外多余文字。`;

  const user = `调研主题：${researchTopic}
目标人群：${audienceCriteria || '由你根据主题合理设定'}
市场：${market}
${countryCtx}

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
      "culturalNotes": "与${market}文化相关的1-2句特征"
    }
  ]
}`;

  const content = await runChatCompletion(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { maxTokens: PERSONA_MAX_TOKENS, temperature: 0.75 },
  );

  const data = parseJsonFromLlm(content);
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
}) {
  const market = getMarketLabel(country);
  const countryCtx = country ? buildCountryContext(country) : '';
  const guide =
    guideQuestions.length > 0
      ? `须覆盖以下问题方向：\n${guideQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
      : '自拟 5–6 个深度追问（含行为、情绪、决策、文化相关）';

  const system = `你同时扮演：
1) 资深定性访谈员（专业、共情、会追问）
2) 受访者「${persona.name}」——严格按人设回答，用第一人称、口语化、带情绪细节

模拟真实一对一深度访谈，不要写成问卷。输出合法 JSON。`;

  const user = `市场：${market}
调研主题：${researchTopic}
${countryCtx}

受访者人设：
- ${persona.name}，${persona.age}岁，${persona.occupation}，${persona.city || market}
- 背景：${persona.background}
- 价值观：${(persona.values || []).join('、')}
- 痛点：${(persona.painPoints || []).join('、')}
- 决策风格：${persona.decisionStyle || '未说明'}

${guide}

输出 JSON：
{
  "summary": "本场访谈 2 句摘要",
  "transcript": [
    { "role": "interviewer", "text": "访谈员问题" },
    { "role": "participant", "text": "受访者回答（可含情绪与具体场景）" }
  ],
  "keyQuotes": ["原话金句1", "原话金句2"],
  "insights": ["洞察1", "洞察2"]
}
transcript 6–8 轮（12–16条），访谈员要善于追问「为什么」「当时感受如何」。`;

  const content = await runChatCompletion(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { maxTokens: INTERVIEW_MAX_TOKENS, temperature: 0.7 },
  );

  const data = parseJsonFromLlm(content);
  return {
    personaId: persona.id,
    personaName: persona.name,
    summary: data.summary || '',
    transcript: Array.isArray(data.transcript) ? data.transcript : [],
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
}) {
  const market = getMarketLabel(country);
  const countryCtx = country ? buildCountryContext(country) : '';

  const interviewBlock = interviews
    .map((iv, idx) => {
      const lines = (iv.transcript || [])
        .slice(0, 16)
        .map((t) => `${t.role === 'interviewer' ? '访' : '答'}：${t.text}`)
        .join('\n');
      return `### 受访者 ${idx + 1}：${iv.personaName}
摘要：${iv.summary}
金句：${(iv.keyQuotes || []).join('；')}
洞察：${(iv.insights || []).join('；')}
笔录节选：
${lines}`;
    })
    .join('\n\n');

  const system = `你是商业与用户研究总监，擅长把定性访谈转化为可交付的调研报告。
语言：中文，产品团队可读。结合跨文化视角（中国团队出海场景）。`;

  const user = `请基于以下【模拟访谈】材料，撰写完整调研报告（Markdown）。

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
## 4. 核心发现（分点，标注 🔴🟡🟢 优先级）
## 5. 用户原话摘录（引用块 > 格式）
## 6. 跨文化洞察（与${market}本地习惯、中国团队假设的差异）
## 7. 对产品/设计的建议（P0/P1/P2）
## 8. 局限性与下一步验证建议

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
