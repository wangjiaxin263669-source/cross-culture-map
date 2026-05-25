/**
 * 端到端自测：注册 → 访谈（日本人设样例）
 * 用法：先 npm run dev，再 node scripts/test-sim-interview.mjs
 */
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

const japanPersona = {
  id: 'p1',
  name: '山本 拓也',
  age: 19,
  occupation: '大学生',
  city: '名古屋',
  background: '住在名古屋郊区，每周在便利店打工，喜欢手游与动漫周边。',
  values: ['务实', '重视同伴认同'],
  painPoints: ['零花钱紧', '对订阅制付费犹豫'],
  decisionStyle: '先看评价与短视频再决定',
};

const japanCountry = {
  title: '日本',
  displayTitle: '日本',
  marketType: 'country',
  parentTitle: '',
};

async function req(path, body, token) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    throw new Error(`${path} 响应非 JSON (${res.status}): ${e.message}`);
  }
  if (!res.ok) throw new Error(data.error || `${path} failed ${res.status}`);
  return data;
}

async function main() {
  const phone = `199${String(Date.now()).slice(-8)}`;
  const password = 'TestSim123!';

  console.log('1) 注册', phone);
  await req('/api/auth/register', {
    phone,
    password,
    confirmPassword: password,
    nickname: '自测',
  });

  console.log('2) 登录');
  const { token } = await req('/api/auth/login', { phone, password });
  console.log('   token ok');

  console.log('3) 模拟访谈（日本人设）…');
  const t0 = Date.now();
  const { interview } = await req(
    '/api/simulated-research/interview',
    {
      persona: japanPersona,
      researchTopic: '日本 Z 世代对手游付费意愿',
      guideQuestions: ['你最近为游戏花过钱吗？', '什么会让你愿意付费？'],
      country: japanCountry,
      corpusContext: '',
    },
    token,
  );
  const ms = Date.now() - t0;
  const lines = interview?.transcript?.length ?? 0;
  console.log(`   OK ${ms}ms, transcript=${lines}条, summary=${(interview?.summary || '').slice(0, 40)}…`);
  if (!lines) throw new Error('transcript 为空');
  console.log('\n✅ 模拟访谈自测通过');
}

main().catch((e) => {
  console.error('\n❌', e.message);
  process.exit(1);
});
