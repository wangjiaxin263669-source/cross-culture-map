/**
 * 构建独立管理员充值站（不发布到主站 public/）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAdminSecretCharCodes } from '../server/wallet/adminSecret.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'credit-admin', 'index.html');
const destDir = path.join(root, 'credit-admin', 'dist');
const dest = path.join(destDir, 'index.html');

if (!fs.existsSync(src)) {
  console.error('[build-credit-admin] 源文件不存在:', src);
  process.exit(1);
}

let html = fs.readFileSync(src, 'utf8');
const codes = getAdminSecretCharCodes();
if (!html.includes('__ADMIN_SECRET_CODES__')) {
  console.error('[build-credit-admin] 模板缺少 __ADMIN_SECRET_CODES__ 占位符');
  process.exit(1);
}
html = html.replace('__ADMIN_SECRET_CODES__', JSON.stringify(codes));

fs.mkdirSync(destDir, { recursive: true });
fs.writeFileSync(dest, html, 'utf8');

fs.writeFileSync(
  path.join(destDir, '_headers'),
  `/*
  X-Robots-Tag: noindex, nofollow, noarchive
  Cache-Control: no-store
`,
  'utf8',
);

fs.writeFileSync(
  path.join(destDir, 'robots.txt'),
  `User-agent: *
Disallow: /
`,
  'utf8',
);

console.log('[build-credit-admin] → credit-admin/dist/');
