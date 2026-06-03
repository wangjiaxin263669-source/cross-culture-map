/**
 * 本地构建并预览视觉测试版（不消耗 Netlify 积分）
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...process.env, VITE_STAGING: 'true', VITE_APP_ENV: 'staging' };
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

console.log('构建视觉测试版…');
const build = spawnSync(npm, ['run', 'build'], { cwd: root, stdio: 'inherit', env, shell: process.platform === 'win32' });
if (build.status !== 0) process.exit(build.status ?? 1);

console.log('\n本地预览 → http://localhost:4173 （不部署 Netlify）\n');
const preview = spawnSync(npm, ['run', 'preview'], { cwd: root, stdio: 'inherit', env, shell: process.platform === 'win32' });
process.exit(preview.status ?? 1);
