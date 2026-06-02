/**
 * 验证：主站 admin/grant API 与管理员页逻辑联动
 * 用法：node scripts/test-credit-admin-linkage.mjs
 */
import { createHash } from 'crypto';
import { getRechargeAdminSecret } from '../server/wallet/adminSecret.js';

const MAIN = process.env.MAIN_SITE_URL || 'https://ephemeral-bubblegum-a79332.netlify.app';
const ADMIN_PAGE = process.env.ADMIN_PAGE_URL || '';
const SECRET = process.env.RECHARGE_ADMIN_SECRET || getRechargeAdminSecret();
const phone = process.env.TEST_PHONE || `186${String(Date.now()).slice(-8)}`;
const password = 'Test123456';

async function registerOrLogin() {
  const fp = createHash('sha256').update(`linkage-${phone}`).digest('hex');
  const reg = await fetch(`${MAIN}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname: '充值联动测',
      phone,
      password,
      confirmPassword: password,
      deviceFingerprint: fp,
    }),
  });
  const data = await reg.json().catch(() => ({}));
  if (reg.ok) return data.token;
  if (/已被注册/.test(data.error || '')) {
    const login = await fetch(`${MAIN}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    const ld = await login.json();
    if (!login.ok) throw new Error(`登录失败: ${ld.error}`);
    return ld.token;
  }
  throw new Error(`注册失败: ${data.error}`);
}

async function main() {
  console.log('主站 API:', MAIN);
  if (ADMIN_PAGE) console.log('管理员页:', ADMIN_PAGE);
  console.log('测试手机:', phone);

  if (ADMIN_PAGE) {
    const pageRes = await fetch(ADMIN_PAGE);
    const html = await pageRes.text();
    if (!pageRes.ok || !html.includes('管理员 · 积分充值')) {
      throw new Error(`管理员页面不可访问 (${pageRes.status})`);
    }
    console.log('OK: 管理员充值页可打开');
  } else {
    console.log('跳过管理员页检查（请设置 ADMIN_PAGE_URL 验证隐藏站）');
  }

  const token = await registerOrLogin();
  const balBefore = await fetch(`${MAIN}/api/wallet/balance`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

  const grant = await fetch(`${MAIN}/api/wallet/admin/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Secret': SECRET,
    },
    body: JSON.stringify({
      phone,
      amountYuan: 3,
      note: '管理员页联动验证',
    }),
  });
  const grantData = await grant.json().catch(() => ({}));
  if (!grant.ok) throw new Error(`充值失败: ${grantData.error || grant.status}`);
  console.log('OK:', grantData.message);

  const token2 = await registerOrLogin();
  const balAfter = await fetch(`${MAIN}/api/wallet/balance`, {
    headers: { Authorization: `Bearer ${token2}` },
  }).then((r) => r.json());

  const before = Number(balBefore.balanceCents ?? 0);
  const after = Number(balAfter.balanceCents ?? 0);
  if (after < before + 300) {
    throw new Error(`余额未增加: ${before} → ${after} 分`);
  }
  console.log(`OK: 主站余额 ¥${balBefore.balanceYuan} → ¥${balAfter.balanceYuan}`);
  console.log('\n管理员充值 ↔ 主站联动验证通过');
}

main().catch((e) => {
  console.error('失败:', e.message);
  process.exit(1);
});
