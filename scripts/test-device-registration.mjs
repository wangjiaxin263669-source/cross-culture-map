/**
 * 一设备一账号：同设备二次注册应被拒绝
 * 用法：npm run dev 后 node scripts/test-device-registration.mjs
 */
import { createHash } from 'crypto';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001';
const DEVICE_FP = createHash('sha256')
  .update(`device-test-${Date.now()}-${Math.random()}`)
  .digest('hex');

async function req(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function main() {
  const phone1 = `198${String(Date.now()).slice(-8)}`;
  const phone2 = `197${String(Date.now()).slice(-8)}`;
  const password = 'Test123456';

  const reg1 = await req('/api/auth/register', {
    nickname: '设备测试A',
    phone: phone1,
    password,
    confirmPassword: password,
    deviceFingerprint: DEVICE_FP,
  });
  if (reg1.status !== 200) {
    throw new Error(`首次注册失败: ${reg1.data.error || reg1.status}`);
  }
  console.log('OK: 首次注册成功', phone1);

  const reg2 = await req('/api/auth/register', {
    nickname: '设备测试B',
    phone: phone2,
    password,
    confirmPassword: password,
    deviceFingerprint: DEVICE_FP,
  });
  if (reg2.status !== 403 || reg2.data.code !== 'DEVICE_ALREADY_REGISTERED') {
    throw new Error(`同设备二次注册应 403，实际: ${reg2.status} ${JSON.stringify(reg2.data)}`);
  }
  console.log('OK: 同设备二次注册已拦截');

  const login = await req('/api/auth/login', { phone: phone1, password });
  if (login.status !== 200) {
    throw new Error(`原账号登录失败: ${login.data.error}`);
  }
  console.log('OK: 原账号仍可登录');

  console.log('\n一设备一账号测试通过');
}

main().catch((e) => {
  console.error('失败:', e.message);
  process.exit(1);
});
