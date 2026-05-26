/**
 * 钱包：校验失败不扣费；AI 失败应退款（需本地 npm run dev + 已登录 token）
 * 用法：TOKEN=xxx node scripts/test-wallet-refund.mjs
 */
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001';
const TOKEN = process.env.TOKEN || process.env.TEST_AUTH_TOKEN;

async function api(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function balance(token) {
  const res = await fetch(`${BASE}/api/wallet/balance`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.balanceCents;
}

async function main() {
  if (!TOKEN) {
    console.error('请设置 TOKEN 或 TEST_AUTH_TOKEN（浏览器 localStorage cc_auth_token）');
    process.exit(1);
  }

  const b0 = await balance(TOKEN);
  console.log('初始余额(分):', b0);

  const bad = await api(
    '/api/simulated-research/personas',
    { researchTopic: '', country: { title: '日本', label: 'JP' } },
    TOKEN,
  );
  if (bad.status !== 400) throw new Error(`空主题应 400，实际 ${bad.status}`);
  const b1 = await balance(TOKEN);
  if (b1 !== b0) throw new Error(`校验失败不应扣费: ${b0} -> ${b1}`);
  console.log('OK: 扣费前校验，余额未变');

  const fail = await api(
    '/api/chat',
    { message: 'ping', country: null, model: 'invalid-model-xyz' },
    TOKEN,
  );
  if (fail.status < 500 && fail.status !== 400) {
    console.log('chat 失败状态:', fail.status, fail.data);
  }
  const b2 = await balance(TOKEN);
  if (fail.data?.refunded) {
    console.log('OK: 失败响应含 refunded', fail.data.refundedYuan);
  }
  if (fail.status >= 500 && b2 < b1) {
    throw new Error('AI 失败后余额应恢复');
  }
  if (fail.status >= 500 && b2 === b1) {
    console.log('OK: 失败后余额已恢复');
  } else {
    console.log('ℹ️  chat 未触发 500，跳过退款断言（可能模型回退成功）');
  }

  console.log('\n钱包退款冒烟完成');
}

main().catch((e) => {
  console.error('失败:', e.message);
  process.exit(1);
});
