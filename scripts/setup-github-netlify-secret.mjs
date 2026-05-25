#!/usr/bin/env node
/**
 * 一键配置 GitHub Secrets：NETLIFY_BUILD_HOOK + NETLIFY_AUTH_TOKEN
 * 不打印 token / hook 全文；需本机已 netlify login 且 git 能访问 GitHub
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SITE_ID = '6c06b462-2090-44e3-8234-e6d929d01674';
const REPO = 'wangjiaxin263669-source/cross-culture-map';
const HOOK_TITLE = 'github-site-health-auto';

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
  const users = cfg.users || {};
  const user = Object.values(users)[0];
  const token = user?.auth?.token;
  if (!token) throw new Error('Netlify config 中无 token，请重新 netlify login');
  return token;
}

function readGithubToken() {
  if (process.env.GH_TOKEN?.trim()) return process.env.GH_TOKEN.trim();
  if (process.env.GITHUB_TOKEN?.trim()) return process.env.GITHUB_TOKEN.trim();
  try {
    const out = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\n\n',
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const line = out.split('\n').find((l) => l.startsWith('password='));
    if (line) return line.slice('password='.length).trim();
  } catch {
    /* ignore */
  }
  throw new Error('需要 GitHub Token：设置 GH_TOKEN 或确保 git 已登录 GitHub');
}

async function netlifyFetch(token, route, options = {}) {
  const res = await fetch(`https://api.netlify.com/api/v1${route}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`Netlify API ${route}: ${res.status} ${data?.message || text}`);
  }
  return data;
}

async function getOrCreateBuildHook(netlifyToken) {
  const hooks = await netlifyFetch(netlifyToken, `/sites/${SITE_ID}/build_hooks`);
  const existing = (hooks || []).find((h) => h.title === HOOK_TITLE);
  if (existing?.url) return existing.url;

  const created = await netlifyFetch(netlifyToken, `/sites/${SITE_ID}/build_hooks`, {
    method: 'POST',
    body: JSON.stringify({ title: HOOK_TITLE, branch: 'main' }),
  });
  if (!created?.url) throw new Error('创建 Build Hook 失败');
  return created.url;
}

async function setGithubSecret(ghToken, name, value) {
  const sodium = (await import('libsodium-wrappers')).default;
  await sodium.ready;

  const [owner, repo] = REPO.split('/');
  const keyRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/secrets/public-key`,
    {
      headers: {
        Authorization: `Bearer ${ghToken}`,
        Accept: 'application/vnd.github+json',
      },
    },
  );
  if (!keyRes.ok) {
    throw new Error(`GitHub public-key: ${keyRes.status} ${await keyRes.text()}`);
  }
  const { key, key_id } = await keyRes.json();

  const binKey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
  const binSec = sodium.from_string(value);
  const encBytes = sodium.crypto_box_seal(binSec, binKey);
  const encrypted_value = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);

  const putRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/secrets/${name}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${ghToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ encrypted_value, key_id }),
    },
  );
  if (!putRes.ok) {
    throw new Error(`GitHub secret ${name}: ${putRes.status} ${await putRes.text()}`);
  }
}

async function main() {
  console.log('配置 GitHub Secrets（站点健康全自动托管）…\n');

  try {
    await import('libsodium-wrappers');
  } catch {
    console.log('安装 libsodium-wrappers（一次性）…');
    execSync('npm install --no-save libsodium-wrappers', { cwd: ROOT, stdio: 'inherit' });
  }

  const netlifyToken = readNetlifyToken();
  const ghToken = readGithubToken();
  const hookUrl = await getOrCreateBuildHook(netlifyToken);

  await setGithubSecret(ghToken, 'NETLIFY_BUILD_HOOK', hookUrl);
  await setGithubSecret(ghToken, 'NETLIFY_AUTH_TOKEN', netlifyToken);

  console.log('✅ 已写入 GitHub Secrets:');
  console.log('   - NETLIFY_BUILD_HOOK（自动重建正式站）');
  console.log('   - NETLIFY_AUTH_TOKEN（备用 API 触发部署）');
  console.log(`\n仓库: ${REPO}`);
  console.log('下次 Site Health Guardian Auto 运行时将自动使用。');
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
