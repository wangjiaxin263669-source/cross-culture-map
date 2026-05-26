/** 正式站轻量冒烟：两模型各测 chat + 三步报告（短文案） */
const API = process.env.API_BASE || 'https://ephemeral-bubblegum-a79332.netlify.app';
const MODELS = ['deepseek-v4-flash', 'deepseek-v4-pro'];
const country = { title: '日本', displayTitle: '日本', marketType: 'country', label: 'JP', density: 50, radarData: [] };

async function req(path, body, token, ms = 90000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
    signal: c.signal,
  }).finally(() => clearTimeout(t));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.status);
  return data;
}

for (const model of MODELS) {
  const phone = `196${Date.now().toString().slice(-8)}`;
  await req('/api/auth/register', { phone, password: 'T1!', confirmPassword: 'T1!' });
  const { token } = await req('/api/auth/login', { phone, password: 'T1!' });
  const chat = await req('/api/chat', { message: '一句话跨文化要点', country, model }, token);
  const report = await req(
    '/api/report',
    { productIdea: '日本手游订阅', country, model },
    token,
    120000,
  );
  console.log(`✅ ${model}: chat=${chat.reply?.length} report=${report.report?.length} used=${report.model}`);
}
