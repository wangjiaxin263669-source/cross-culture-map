/**
 * 验证线上注册后跨请求可登录（模拟另一台设备）
 * 用法：node scripts/test-auth-persistence-prod.mjs
 */
import { createHash } from 'crypto';

const BASE = process.env.VERIFY_BASE_URL || 'https://ephemeral-bubblegum-a79332.netlify.app';
const phone = `188${String(Date.now()).slice(-8)}`;
const password = 'Test123456';
const fp = createHash('sha256').update(`auth-persist-${Date.now()}`).digest('hex');

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function main() {
  console.log('BASE', BASE);
  console.log('phone', phone);

  const health = await fetch(`${BASE}/api/health`).then((r) => r.json());
  console.log('storage:', health.auth?.storage, health.auth?.storageNote || '');

  const reg = await post('/api/auth/register', {
    nickname: '跨设备测试',
    phone,
    password,
    confirmPassword: password,
    deviceFingerprint: fp,
  });
  if (reg.status !== 200) {
    throw new Error(`注册失败 ${reg.status}: ${reg.data.error || JSON.stringify(reg.data)}`);
  }
  console.log('OK: 注册成功', reg.data.user?.displayName);

  await new Promise((r) => setTimeout(r, 500));

  const login = await post('/api/auth/login', { phone, password });
  if (login.status !== 200) {
    throw new Error(`跨设备登录失败 ${login.status}: ${login.data.error}`);
  }
  console.log('OK: 登录成功', login.data.user?.phone);

  const login2 = await post('/api/auth/login', { phone, password });
  if (login2.status !== 200) {
    throw new Error(`二次登录失败 ${login2.status}`);
  }
  console.log('OK: 二次登录成功');

  console.log('\n账号跨请求持久化测试通过');
}

main().catch((e) => {
  console.error('失败:', e.message);
  process.exit(1);
});
