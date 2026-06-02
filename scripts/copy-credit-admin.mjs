/**
 * 构建前：将管理员充值页复制到 public/admin-credits，并注入内置密钥（非明文）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAdminSecretCharCodes } from '../server/wallet/adminSecret.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'credit-admin', 'index.html');
const destDir = path.join(root, 'public', 'admin-credits');
const dest = path.join(destDir, 'index.html');

if (!fs.existsSync(src)) {
  console.warn('[copy-credit-admin] 源文件不存在，跳过');
  process.exit(0);
}

let html = fs.readFileSync(src, 'utf8');
const codes = getAdminSecretCharCodes();
if (!html.includes('__ADMIN_SECRET_CODES__')) {
  console.warn('[copy-credit-admin] 模板缺少 __ADMIN_SECRET_CODES__ 占位符');
  process.exit(1);
}
html = html.replace('__ADMIN_SECRET_CODES__', JSON.stringify(codes));

fs.mkdirSync(destDir, { recursive: true });
fs.writeFileSync(dest, html, 'utf8');
console.log('[copy-credit-admin] → public/admin-credits/index.html');
