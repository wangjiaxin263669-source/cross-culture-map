/**
 * 管理员赠送余额
 * 用法：node scripts/grant-balance.mjs --phone 15016249923 --yuan 10
 */
const args = process.argv.slice(2);
function getArg(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}

const phone = getArg('--phone') || process.env.GRANT_PHONE;
const yuan = getArg('--yuan') || process.env.GRANT_YUAN || '10';
const site =
  getArg('--site') || process.env.SITE_URL || 'https://ephemeral-bubblegum-a79332.netlify.app';
const secret =
  getArg('--secret') || process.env.RECHARGE_ADMIN_SECRET || 'CcMapProdAdmin_7f3e9a2b';
const note = getArg('--note') || '管理员赠送';

if (!phone) {
  console.error('用法: node scripts/grant-balance.mjs --phone 手机号 --yuan 10');
  process.exit(1);
}

const res = await fetch(`${site.replace(/\/$/, '')}/api/wallet/admin/grant`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Admin-Secret': secret,
  },
  body: JSON.stringify({ phone, amountYuan: Number(yuan), note }),
});

const data = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error('❌', data.error || res.status);
  process.exit(1);
}
console.log('✅', data.message);
console.log(JSON.stringify(data, null, 2));
