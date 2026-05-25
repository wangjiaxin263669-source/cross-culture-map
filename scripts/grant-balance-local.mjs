/** 本地文件库直接入账（STORAGE_BACKEND=file） */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env') });
process.env.STORAGE_BACKEND = 'file';

const phone = process.argv[2] || '15016249923';
const yuan = Number(process.argv[3] || 10);
const cents = Math.round(yuan * 100);

const { findUserByPhone, creditUserBalance, sanitizeUser } = await import('../server/db/store.js');

const user = await findUserByPhone(phone);
if (!user) {
  console.error('未找到用户', phone);
  process.exit(1);
}
const tx = await creditUserBalance(user.id, cents, { type: 'bonus', note: '管理员赠送' });
const safe = await sanitizeUser(await findUserByPhone(phone));
console.log(`✅ ${phone} +¥${yuan.toFixed(2)} → 余额 ¥${safe.balanceYuan} (tx ${tx.id})`);
