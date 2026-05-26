/**
 * 验证线上「一设备一账号」：无指纹 / 同指纹二次注册
 */
import { createHash } from 'crypto';

const BASE = process.env.VERIFY_BASE_URL || 'https://ephemeral-bubblegum-a79332.netlify.app';
const DEVICE_FP = createHash('sha256').update(`verify-${Date.now()}`).digest('hex');

async function register(payload) {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function main() {
  console.log('BASE', BASE);
  console.log('FP', DEVICE_FP.slice(0, 16) + '…');

  const noFp = await register({
    nickname: '无指纹测试',
    phone: `196${String(Date.now()).slice(-8)}`,
    password: 'Test123456',
    confirmPassword: 'Test123456',
  });
  console.log('\n1) 无 deviceFingerprint:', noFp.status, noFp.data.error || 'OK');

  const phone1 = `195${String(Date.now()).slice(-8)}`;
  const reg1 = await register({
    nickname: '设备测试1',
    phone: phone1,
    password: 'Test123456',
    confirmPassword: 'Test123456',
    deviceFingerprint: DEVICE_FP,
  });
  console.log('2) 首次带指纹注册:', reg1.status, reg1.data.error || `OK phone=${phone1}`);

  const phone2 = `194${String(Date.now()).slice(-8)}`;
  const reg2 = await register({
    nickname: '设备测试2',
    phone: phone2,
    password: 'Test123456',
    confirmPassword: 'Test123456',
    deviceFingerprint: DEVICE_FP,
  });
  console.log('3) 同指纹二次注册:', reg2.status, reg2.data.code || '', reg2.data.error || 'OK');

  if (reg1.status === 200 && reg2.status === 403 && reg2.data.code === 'DEVICE_ALREADY_REGISTERED') {
    console.log('\n结论: 一设备一账号 已生效');
    return;
  }
  if (noFp.status === 400 && /无法识别/.test(noFp.data.error || '')) {
    console.log('\n结论: 设备校验已开启，但缺指纹会报「无法识别」——前端须提交指纹');
  }
  if (reg1.status === 200 && reg2.status === 200) {
    console.log('\n结论: 失败——同设备可注册两次（限制未生效或未部署）');
    process.exit(1);
  }
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
