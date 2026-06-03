/**
 * 部署视觉测试版到独立 Netlify 站点（不影响正式站）
 * 用法：node scripts/deploy-staging.mjs
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SITE_NAME = process.env.STAGING_SITE_NAME || 'cross-culture-design-preview';
const SITE_ID = process.env.STAGING_SITE_ID?.trim();

function readNetlifyToken() {
  if (process.env.NETLIFY_AUTH_TOKEN?.trim()) {
    return process.env.NETLIFY_AUTH_TOKEN.trim();
  }
  const cfgPath = path.join(
    process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
    'netlify',
    'Config',
    'config.json',
  );
  if (!fs.existsSync(cfgPath)) {
    throw new Error('未找到 Netlify 登录信息，请先运行: npx netlify-cli login');
  }
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const token = Object.values(cfg.users || {})[0]?.auth?.token;
  if (!token) throw new Error('请运行 npx netlify-cli login');
  return token;
}

async function netlifyFetch(token, pathSuffix, options = {}) {
  const res = await fetch(`https://api.netlify.com/api/v1${pathSuffix}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body && !(options.body instanceof Buffer)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...options.headers,
    },
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(data.message || data.error || `Netlify API ${res.status}: ${text.slice(0, 200)}`);
  }
  return data;
}

async function findOrCreateSite(token) {
  if (SITE_ID) {
    const site = await netlifyFetch(token, `/sites/${SITE_ID}`);
    console.log('OK: 使用测试站点', site.name, site.ssl_url || site.url);
    return site;
  }
  const sites = await netlifyFetch(token, '/sites?filter=all&per_page=100');
  let site = sites.find((s) => s.name === SITE_NAME);
  if (site) {
    console.log('OK: 已有测试站点', site.name, site.ssl_url || site.url);
    return site;
  }
  site = await netlifyFetch(token, '/sites', {
    method: 'POST',
    body: JSON.stringify({ name: SITE_NAME }),
  });
  console.log('OK: 已创建测试站点', site.name, site.ssl_url || site.url);
  return site;
}

function buildStagingDist() {
  const result = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_STAGING: 'true',
      VITE_APP_ENV: 'staging',
    },
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) throw new Error('vite build 失败');
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    throw new Error('dist/index.html 不存在');
  }
}

async function deployDist(token, siteId, siteName) {
  const cli = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = [
    '--yes',
    'netlify-cli@17.38.1',
    'deploy',
    '--prod',
    '--dir=dist',
    `--site=${siteName || siteId}`,
  ];
  const result = spawnSync(cli, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, NETLIFY_AUTH_TOKEN: token },
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) throw new Error('netlify deploy 失败');
  const site = await netlifyFetch(token, `/sites/${siteId}`);
  return site.ssl_url || site.url;
}

async function main() {
  console.log('构建视觉测试版 (VITE_STAGING=true)...');
  buildStagingDist();
  const token = readNetlifyToken();
  const site = await findOrCreateSite(token);
  const url = await deployDist(token, site.id, site.name);
  const stagingUrl = url.endsWith('/') ? url : `${url}/`;
  const statePath = path.join(ROOT, '.staging-deploy-state.json');
  fs.writeFileSync(
    statePath,
    JSON.stringify({ stagingUrl, siteId: site.id, deployedAt: new Date().toISOString() }, null, 2),
  );
  console.log('\n========================================');
  console.log('视觉测试版已上线（非正式站）');
  console.log('测试地址:', stagingUrl);
  console.log('正式站未改动:', process.env.MAIN_SITE_URL || 'https://ephemeral-bubblegum-a79332.netlify.app');
  console.log('========================================\n');
}

main().catch((e) => {
  console.error('失败:', e.message);
  process.exit(1);
});
