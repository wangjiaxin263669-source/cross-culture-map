/**
 * 本地启动视觉测试版（不消耗 Netlify 积分）
 */
import { spawnSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...process.env, VITE_STAGING: 'true', VITE_APP_ENV: 'staging' };
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const tex = path.join(root, 'public', 'globe', 'earth-blue-marble.jpg');
if (!existsSync(tex) || statSync(tex).size < 1000) {
  console.log('正在下载地球贴图…');
  spawnSync(npm, ['run', 'globe:textures'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
}

console.log('本地视觉测试版 → http://localhost:5173 （不部署 Netlify）\n');

const result = spawnSync(npm, ['run', 'dev'], { cwd: root, stdio: 'inherit', env, shell: process.platform === 'win32' });
process.exit(result.status ?? 1);
