/**
 * 本地构建并预览视觉测试版（不消耗 Netlify 积分）
 * 会先启动本地 API，再 vite preview
 */
import { spawn, spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...process.env, VITE_STAGING: 'true', VITE_APP_ENV: 'staging' };
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const port = 3001;

async function waitForApi(maxMs = 20000) {
  const url = `http://127.0.0.1:${port}/api/health`;
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`本地 API 未在 ${port} 端口启动，请检查 .env 或端口占用`);
}

function startApiServer() {
  spawnSync(process.execPath, ['scripts/kill-api-port.mjs'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: root,
    env: { ...env, PORT: String(port), API_PORT: String(port) },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  child.on('exit', () => process.exit(0));
  return child;
}

console.log('构建视觉测试版…');
const build = spawnSync(npm, ['run', 'build'], {
  cwd: root,
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32',
});
if (build.status !== 0) process.exit(build.status ?? 1);

console.log('\n启动本地 API…');
const api = startApiServer();
try {
  await waitForApi();
} catch (err) {
  console.error(err.message);
  api.kill();
  process.exit(1);
}

console.log('\n本地预览 → http://localhost:4173 （不部署 Netlify）');
console.log('按 Ctrl+C 结束\n');

const preview = spawnSync(npm, ['run', 'preview'], {
  cwd: root,
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32',
});
api.kill();
process.exit(preview.status ?? 1);
