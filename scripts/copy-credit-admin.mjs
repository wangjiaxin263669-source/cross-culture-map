/**
 * 构建前：将管理员充值页复制到 public/admin-credits（随主站一起发布）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'credit-admin', 'index.html');
const destDir = path.join(root, 'public', 'admin-credits');
const dest = path.join(destDir, 'index.html');

if (!fs.existsSync(src)) {
  console.warn('[copy-credit-admin] 源文件不存在，跳过');
  process.exit(0);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('[copy-credit-admin] → public/admin-credits/index.html');
