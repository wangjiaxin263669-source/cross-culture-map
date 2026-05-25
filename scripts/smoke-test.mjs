/**
 * 全站冒烟测试：健康检查、注册登录、钱包、AI 接口、开放平台、抽样链接
 * 用法: node scripts/smoke-test.mjs [localApiUrl] [prodApiUrl]
 * 默认 local=http://localhost:3001 prod=https://ephemeral-bubblegum-a79332.netlify.app
 */
async function resolveLocalBase() {
  if (process.argv[2]) return process.argv[2];
  for (const port of [3001, 3002]) {
    try {
      const r = await fetch(`http://localhost:${port}/api/health`, { signal: AbortSignal.timeout(3000) });
      if (r.ok) return `http://localhost:${port}`;
    } catch {
      /* try next */
    }
  }
  return 'http://localhost:3001';
}

const LOCAL = await resolveLocalBase();
const PROD = process.argv[3] || 'https://ephemeral-bubblegum-a79332.netlify.app';

const results = [];

function log(icon, name, detail = '') {
  const line = `${icon} ${name}${detail ? ` — ${detail}` : ''}`;
  console.log(line);
  results.push({ icon, name, detail });
}

async function req(base, path, options = {}) {
  const url = `${base.replace(/\/$/, '')}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  let body = null;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text.slice(0, 500) };
  }
  return { status: res.status, body, ok: res.ok };
}

async function testHealth(label, base) {
  try {
    const { status, body, ok } = await req(base, '/api/health');
    if (!ok) {
      log('❌', `${label} health`, `HTTP ${status}`);
      return null;
    }
    log('✅', `${label} health`, `AI=${body.aiConfigured} mode=${body.mode}`);
    const sim = body.wallet?.costsYuan;
    if (sim?.sim_personas) {
      log('ℹ️', `${label} sim pricing`, `personas ¥${sim.sim_personas}`);
    }
    return body;
  } catch (e) {
    log('❌', `${label} health`, e.message);
    return null;
  }
}

async function testAuth(label, base) {
  const phone = `139${String(Date.now()).slice(-8)}`;
  const password = 'TestSmoke1!';
  const displayName = '冒烟测试';

  const reg = await req(base, '/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ displayName, phone, password, confirmPassword: password }),
  });
  if (reg.status !== 200) {
    log('❌', `${label} register`, reg.body?.error || `HTTP ${reg.status}`);
    return null;
  }
  log('✅', `${label} register`, `balance ¥${reg.body.user?.balanceYuan}`);

  await new Promise((r) => setTimeout(r, 400));

  const login = await req(base, '/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  });
  if (login.status !== 200 || !login.body.token) {
    log('❌', `${label} login`, login.body?.error || `HTTP ${login.status}`);
    return null;
  }
  log('✅', `${label} login`, `token ok`);

  const token = login.body.token;
  const me = await req(base, '/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
  if (me.status !== 200) {
    log('❌', `${label} /me`, `HTTP ${me.status}`);
    return null;
  }
  log('✅', `${label} session /me`, me.body.user?.displayName);

  const dup = await req(base, '/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ displayName, phone, password, confirmPassword: password }),
  });
  if (dup.status === 400 && /已被注册/.test(dup.body?.error || '')) {
    log('✅', `${label} duplicate register blocked`);
  } else {
    log('⚠️', `${label} duplicate register`, `expected 400, got ${dup.status}`);
  }

  return { token, phone, user: me.body.user };
}

async function testWallet(label, base, token) {
  const auth = { Authorization: `Bearer ${token}` };
  const cfg = await req(base, '/api/wallet/config', { headers: auth });
  if (cfg.status !== 200) {
    log('❌', `${label} wallet config`, `HTTP ${cfg.status}`);
    return;
  }
  log('✅', `${label} wallet config`, `sim ¥${cfg.body.wallet?.costsYuan?.sim_personas}/次`);

  const bal = await req(base, '/api/wallet/balance', { headers: auth });
  if (bal.status !== 200) {
    log('❌', `${label} balance`, `HTTP ${bal.status}`);
    return;
  }
  log('✅', `${label} balance`, `¥${bal.body.balanceYuan}`);

  const order = await req(base, '/api/wallet/recharge/create', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ packageId: 'p10', payType: 'wxpay' }),
  });
  if (order.status !== 200) {
    log('❌', `${label} recharge create`, order.body?.error || `HTTP ${order.status}`);
    return;
  }
  const provider = order.body.provider || order.body.mode;
  log('✅', `${label} recharge create`, `provider=${provider} order=${order.body.orderId?.slice(0, 8)}…`);

  if (provider === 'mock' || order.body.mockPaid) {
    const bal2 = await req(base, '/api/wallet/balance', { headers: auth });
    log('✅', `${label} mock recharge`, `balance now ¥${bal2.body?.balanceYuan}`);
  } else {
    log('ℹ️', `${label} recharge`, 'wechat_qr — manual pay required on prod');
  }
}

async function testOpenPlatform(label, base) {
  const { status, body, ok } = await req(base, '/api/open-platform/status');
  if (!ok) {
    log('❌', `${label} open-platform`, `HTTP ${status}`);
    return;
  }
  const jo = body.platforms?.justone;
  log(
    jo?.configured ? '✅' : '⚠️',
    `${label} Just One API`,
    `configured=${jo?.configured} connected=${jo?.connected}`,
  );
}

async function testCorpus(label, base) {
  const { status, body, ok } = await req(base, '/api/corpus/search', {
    method: 'POST',
    body: JSON.stringify({
      query: '跨文化 设计',
      marketId: 'cn',
      sources: ['xiaohongshu'],
    }),
  });
  if (!ok) {
    log('❌', `${label} corpus search`, body?.error || `HTTP ${status}`);
    return;
  }
  const n = body.snippets?.length ?? 0;
  log('✅', `${label} corpus search`, `${n} snippets`);
}

async function testChat(label, base, token, health) {
  if (!health?.aiConfigured) {
    log('⏭️', `${label} chat`, 'DEEPSEEK not configured');
    return;
  }
  const auth = { Authorization: `Bearer ${token}` };
  const { status, body } = await req(base, '/api/chat', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      message: '用一句话说明中国用户界面设计特点',
      country: { id: 'cn', title: '中国', marketType: 'country' },
      history: [],
    }),
  });
  if (status === 402 || body?.code === 'INSUFFICIENT_BALANCE') {
    log('⚠️', `${label} chat`, '余额不足');
    return;
  }
  if (status !== 200 || !body.reply?.trim()) {
    log('❌', `${label} chat`, body?.error || `HTTP ${status}`);
    return;
  }
  log('✅', `${label} chat`, `${body.reply.slice(0, 40)}…`);
}

async function testReport(label, base, token, health) {
  if (!health?.aiConfigured) {
    log('⏭️', `${label} report`, 'skip');
    return;
  }
  const auth = { Authorization: `Bearer ${token}` };
  const { status, body } = await req(base, '/api/report', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      productIdea: '测试：二次元电商 App 进入中国',
      country: {
        id: 'cn',
        title: '中国',
        marketType: 'country',
        overview: '测试',
        tagline: '测试',
      },
    }),
  });
  if (status === 402) {
    log('⚠️', `${label} report`, '余额不足');
    return;
  }
  if (status !== 200 || !body.report?.trim()) {
    log('❌', `${label} report`, body?.error || `HTTP ${status}`);
    return;
  }
  log('✅', `${label} report`, `${body.report.slice(0, 50)}…`);
}

async function testSimPersonas(label, base, token, health) {
  if (!health?.aiConfigured) return;
  const auth = { Authorization: `Bearer ${token}` };
  const { status, body } = await req(base, '/api/simulated-research/personas', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      researchTopic: 'Z世代二手潮玩交易信任',
      audienceCriteria: '18-25岁',
      personaCount: 2,
      country: { id: 'cn', title: '中国', marketType: 'country' },
      corpusSnippets: [],
    }),
  });
  if (status === 402) {
    log('⚠️', `${label} sim personas`, '余额不足');
    return null;
  }
  if (status !== 200 || !body.personas?.length) {
    log('❌', `${label} sim personas`, body?.error || `HTTP ${status}`);
    return null;
  }
  log('✅', `${label} sim personas`, `${body.personas.length} 人设`);
  return body.personas;
}

async function testLinksSample() {
  const samples = [
    'https://www.bilibili.com/video/BV1GJ411x7h7',
    'https://onlinelibrary.wiley.com/doi/full/10.1111/j.1083-6101.2009.01454.x',
    'https://www.smashingmagazine.com/2010/03/how-to-design-for-germany/',
  ];
  let ok = 0;
  for (const url of samples) {
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(12000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CrossCultureMap/1.0)' },
      });
      if (res.ok || res.status === 405) ok += 1;
      else log('⚠️', 'link HEAD', `${url} → ${res.status}`);
    } catch (e) {
      try {
        const res = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          signal: AbortSignal.timeout(12000),
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (res.ok) ok += 1;
        else log('⚠️', 'link GET', `${url} → ${res.status}`);
      } catch (e2) {
        log('❌', 'link unreachable', `${url.slice(0, 50)}… ${e2.message}`);
      }
    }
  }
  log(ok === samples.length ? '✅' : '⚠️', `sample links`, `${ok}/${samples.length} reachable`);
}

async function runSuite(label, base, { skipAi = false } = {}) {
  console.log(`\n========== ${label} (${base}) ==========`);
  const health = await testHealth(label, base);
  await testOpenPlatform(label, base);
  const auth = await testAuth(label, base);
  if (!auth) return;
  await testWallet(label, base, auth.token);
  await testCorpus(label, base);
  if (!skipAi && health) {
    await testChat(label, base, auth.token, health);
    if (!skipAi) await testReport(label, base, auth.token, health);
    await testSimPersonas(label, base, auth.token, health);
  }
}

console.log('Cross-Culture Map — Smoke Test\n');
await testLinksSample();
await runSuite('LOCAL', LOCAL, { skipAi: false });
await runSuite('PRODUCTION', PROD, { skipAi: false });

const fails = results.filter((r) => r.icon === '❌').length;
const warns = results.filter((r) => r.icon === '⚠️').length;
console.log(`\n--- Summary: ${fails} failed, ${warns} warnings ---`);
process.exit(fails > 0 ? 1 : 0);
