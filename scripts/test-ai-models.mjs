/**
 * 测试 deepseek-v4-flash / deepseek-v4-pro 在全站 AI 模块是否可用
 * 用法：npm run dev 后 node scripts/test-ai-models.mjs
 */
const API = process.env.API_BASE || 'http://127.0.0.1:3001';
const MODELS = ['deepseek-v4-flash', 'deepseek-v4-pro'];

const japanCountry = {
  title: '日本',
  displayTitle: '日本',
  marketType: 'country',
  label: 'JP',
  density: 50,
  radarData: [{ name: '个人主义', score: 46 }],
};

async function req(path, body, token, timeoutMs = 120000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw new Error(`${path} 超时`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function testModel(model, token) {
  const topic = '日本手游订阅付费自发顾虑（自测）';
  const results = [];

  const chat = await req(
    '/api/chat',
    { message: '用一句话说明跨文化调研要点', history: [], country: japanCountry, model },
    token,
    90000,
  );
  if (!chat.reply?.trim()) throw new Error('chat 无内容');
  results.push(`chat ${chat.reply.length}字 model=${chat.model || model}`);

  const report = await req(
    '/api/report',
    {
      productIdea: '二次元手游订阅 App，目标日本 Z 世代',
      country: japanCountry,
      model,
    },
    token,
    180000,
  );
  if (!report.report?.trim() || report.report.length < 100) throw new Error('report 过短');
  results.push(`report ${report.report.length}字`);

  const { personas } = await req(
    '/api/simulated-research/personas',
    {
      researchTopic: topic,
      audienceCriteria: '18-22岁学生',
      personaCount: 2,
      country: japanCountry,
      researchMaterials: { skipped: true },
      model,
    },
    token,
  );
  if (!personas?.length) throw new Error('personas 空');
  results.push(`personas x${personas.length}`);

  const { interview } = await req(
    '/api/simulated-research/interview',
    {
      persona: personas[0],
      researchTopic: topic,
      guideQuestions: ['你会为游戏订阅吗？'],
      country: japanCountry,
      researchMaterials: { skipped: true },
      model,
    },
    token,
    180000,
  );
  if (!interview?.transcript?.length) throw new Error('interview 空');
  results.push(`interview transcript=${interview.transcript.length}`);

  const simReport = await req(
    '/api/simulated-research/report',
    {
      researchTopic: topic,
      personas,
      interviews: [interview],
      country: japanCountry,
      researchMaterials: { skipped: true },
      model,
    },
    token,
    180000,
  );
  if (!simReport.report?.trim() || simReport.report.length < 100) throw new Error('sim report 过短');
  results.push(`sim_report ${simReport.report.length}字`);

  return results;
}

async function loginFresh() {
  const phone = `197${String(Date.now()).slice(-8)}`;
  const password = 'ModelTest123!';
  await req('/api/auth/register', { phone, password, confirmPassword: password, nickname: '模型自测' });
  const { token } = await req('/api/auth/login', { phone, password });
  return token;
}

async function main() {
  console.log('API:', API);

  const health = await fetch(`${API}/api/health`).then((r) => r.json());
  console.log('可用模型:', health.deepseekModels?.models?.map((m) => m.id).join(', ') || '—');

  let failed = false;
  for (const model of MODELS) {
    console.log(`\n=== ${model} ===`);
    try {
      const token = await loginFresh();
      const t0 = Date.now();
      const lines = await testModel(model, token);
      console.log(`✅ 通过 (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
      lines.forEach((l) => console.log('   ', l));
    } catch (e) {
      failed = true;
      console.error(`❌ 失败:`, e.message);
    }
  }

  if (failed) process.exit(1);
  console.log('\n✅ 两个模型全流程均通过');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
