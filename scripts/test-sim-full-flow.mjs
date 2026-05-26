/**
 * 模拟调研全流程自测：注册 → 人设 → 访谈 → 报告
 * 用法：先 npm run dev，再 node scripts/test-sim-full-flow.mjs
 */
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

const japanCountry = {
  title: '日本',
  displayTitle: '日本',
  marketType: 'country',
};

const materialsPayload = {
  skipped: false,
  projectDocuments: [],
  productImages: [{ id: 'p1', name: 'product.jpg', hasImage: true }],
  uiFlowSteps: [
    { step: 1, label: '首页', hasImage: true },
    { step: 2, label: '支付页', hasImage: true },
  ],
  uiScreenshot: { label: '订阅弹窗', hasImage: true },
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
    if (e.name === 'AbortError') throw new Error(`${path} 超时 (${timeoutMs}ms)`);
    throw new Error(`${path} 连接失败: ${e.message}`);
  } finally {
    clearTimeout(timer);
  }
  let data = {};
  try {
    data = await res.json();
  } catch {
    throw new Error(`${path} 响应非 JSON (${res.status})`);
  }
  if (!res.ok) throw new Error(data.error || `${path} HTTP ${res.status}`);
  return data;
}

async function main() {
  const phone = `198${String(Date.now()).slice(-8)}`;
  const password = 'TestFlow123!';

  console.log('API:', API);
  console.log('1) 健康检查…');
  const health = await fetch(`${API}/api/health`).then((r) => r.json());
  if (!health?.ok && health?.status !== 'ok') {
    const h2 = await fetch(`${API}/api/health`).catch(() => null);
    if (!h2?.ok) console.warn('   health 端点非常规，继续');
  }
  console.log('   OK');

  console.log('2) 注册 + 登录', phone);
  await req('/api/auth/register', { phone, password, confirmPassword: password, nickname: '流程自测' });
  const { token } = await req('/api/auth/login', { phone, password });
  console.log('   token OK');

  const topic = '日本 Z 世代对手游订阅付费的自发顾虑';
  const audience = '18-25 岁、常玩手游、对自动续费敏感';

  console.log('3) 生成人设（含素材 payload）…');
  const t0 = Date.now();
  const { personas } = await req(
    '/api/simulated-research/personas',
    {
      researchTopic: topic,
      audienceCriteria: audience,
      personaCount: 2,
      country: japanCountry,
      corpusSnippets: [],
      researchMaterials: materialsPayload,
    },
    token,
    120000,
  );
  if (!personas?.length) throw new Error('人设为空');
  console.log(`   OK ${Date.now() - t0}ms · ${personas.length} 人: ${personas.map((p) => p.name).join('、')}`);

  const interviews = [];
  for (let i = 0; i < personas.length; i += 1) {
    const p = personas[i];
    console.log(`4) 模拟访谈 ${i + 1}/${personas.length} · ${p.name}…`);
    const t1 = Date.now();
    const { interview } = await req(
      '/api/simulated-research/interview',
      {
        persona: p,
        researchTopic: topic,
        guideQuestions: ['你最近为游戏花过钱吗？', '什么会让你犹豫订阅？'],
        country: japanCountry,
        corpusContext: '',
        researchMaterials: materialsPayload,
      },
      token,
      180000,
    );
    if (!interview?.transcript?.length) throw new Error(`访谈 ${p.name} transcript 为空`);
    const obs = interview.observationLog?.length || 0;
    console.log(
      `   OK ${Date.now() - t1}ms · transcript=${interview.transcript.length} observation=${obs}`,
    );
    interviews.push(interview);
  }

  console.log('5) 生成调研报告…');
  const t2 = Date.now();
  const { report } = await req(
    '/api/simulated-research/report',
    {
      researchTopic: topic,
      audienceCriteria: audience,
      personas,
      interviews,
      country: japanCountry,
      corpusSnippets: [],
      researchMaterials: materialsPayload,
    },
    token,
    180000,
  );
  if (!report || report.length < 200) throw new Error('报告过短或为空');
  console.log(`   OK ${Date.now() - t2}ms · ${report.length} 字`);
  console.log('\n✅ 模拟调研全流程自测通过');
}

main().catch((e) => {
  console.error('\n❌', e.message);
  process.exit(1);
});
