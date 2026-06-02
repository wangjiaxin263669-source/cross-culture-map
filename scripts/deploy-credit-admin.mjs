/**
 * 部署 credit-admin 到 Netlify（独立站点）并验证与主站联动
 * 用法：node scripts/deploy-credit-admin.mjs
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { getRechargeAdminSecret, getAdminSecretCharCodes } from '../server/wallet/adminSecret.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ADMIN_DIR = path.join(ROOT, 'credit-admin');
const MAIN_SITE = process.env.MAIN_SITE_URL || 'https://ephemeral-bubblegum-a79332.netlify.app';
const ADMIN_SECRET = process.env.RECHARGE_ADMIN_SECRET || getRechargeAdminSecret();
const SITE_NAME = process.env.CREDIT_ADMIN_SITE_NAME || 'cross-culture-credit-admin';

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
  const user = Object.values(cfg.users || {})[0];
  const token = user?.auth?.token;
  if (!token) throw new Error('请运行 npx netlify-cli login');
  return token;
}

async function netlifyFetch(token, pathSuffix, options = {}) {
  const res = await fetch(`https://api.netlify.com/api/v1${pathSuffix}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? {} : { 'Content-Type': 'application/json' }),
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
  const sites = await netlifyFetch(token, '/sites?filter=all&per_page=100');
  let site = sites.find(
    (s) => s.name === SITE_NAME || s.custom_domain?.includes('credit-admin'),
  );
  if (site) {
    console.log('OK: 已有管理员站点', site.name, site.ssl_url || site.url);
    return site;
  }
  site = await netlifyFetch(token, '/sites', {
    method: 'POST',
    body: JSON.stringify({
      name: SITE_NAME,
      custom_domain: null,
    }),
  });
  console.log('OK: 已创建新站点', site.name, site.ssl_url || site.url);
  return site;
}

function buildFileDigests(dir, base = dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(base, full).replace(/\\/g, '/');
    if (fs.statSync(full).isDirectory()) continue;
    const content = fs.readFileSync(full);
    files.push({
      path: `/${rel}`,
      sha: createHash('sha1').update(content).digest('hex'),
      content: content.toString('base64'),
    });
  }
  return files;
}

function prepareAdminDeployDir() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-credit-admin-'));
  for (const name of fs.readdirSync(ADMIN_DIR)) {
    const src = path.join(ADMIN_DIR, name);
    const dest = path.join(tmp, name);
    if (fs.statSync(src).isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
      continue;
    }
    if (name === 'index.html') {
      let html = fs.readFileSync(src, 'utf8');
      html = html.replace('__ADMIN_SECRET_CODES__', JSON.stringify(getAdminSecretCharCodes()));
      fs.writeFileSync(dest, html, 'utf8');
    } else {
      fs.copyFileSync(src, dest);
    }
  }
  return tmp;
}

async function deployAdminSite(token, siteId) {
  const deployDir = prepareAdminDeployDir();
  const files = buildFileDigests(deployDir);
  const deploy = await netlifyFetch(token, `/sites/${siteId}/deploys`, {
    method: 'POST',
    body: JSON.stringify({ files: Object.fromEntries(files.map((f) => [f.path, f.sha])) }),
  });
  await netlifyFetch(token, `/deploys/${deploy.id}/upload/${encodeURIComponent(files[0].path.slice(1))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: Buffer.from(files[0].content, 'base64'),
  });
  for (let i = 1; i < files.length; i += 1) {
    const f = files[i];
    await netlifyFetch(
      token,
      `/deploys/${deploy.id}/upload/${encodeURIComponent(f.path.slice(1))}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: Buffer.from(f.content, 'base64'),
      },
    );
  }
  console.log('OK: 文件已上传，deploy id', deploy.id);
  for (let i = 0; i < 30; i += 1) {
    await new Promise((r) => setTimeout(r, 3000));
    const status = await netlifyFetch(token, `/deploys/${deploy.id}`);
    console.log(`   部署状态: ${status.state}`);
    if (status.state === 'ready') {
      return status.ssl_url || status.deploy_ssl_url || status.url;
    }
    if (status.state === 'error') {
      throw new Error(`部署失败: ${status.error_message || 'unknown'}`);
    }
  }
  throw new Error('部署超时');
}

async function registerTestUser(phone, password) {
  const fp = createHash('sha256').update(`admin-test-${phone}`).digest('hex');
  const res = await fetch(`${MAIN_SITE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname: '充值联动测试',
      phone,
      password,
      confirmPassword: password,
      deviceFingerprint: fp,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 200) return { token: data.token, user: data.user };
  if (res.status === 400 && /已被注册/.test(data.error || '')) {
    const login = await fetch(`${MAIN_SITE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    const ld = await login.json();
    if (!login.ok) throw new Error(`登录失败: ${ld.error}`);
    return { token: ld.token, user: ld.user };
  }
  throw new Error(`注册失败: ${data.error || res.status}`);
}

async function verifyGrantLink(phone) {
  const beforeBal = await fetch(`${MAIN_SITE}/api/wallet/balance`, {
    headers: { Authorization: `Bearer ${(await registerTestUser(phone, 'Test123456')).token}` },
  }).then((r) => r.json());

  const grant = await fetch(`${MAIN_SITE}/api/wallet/admin/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Secret': ADMIN_SECRET,
    },
    body: JSON.stringify({ phone, amountYuan: 1.5, note: '管理员小站联动测试' }),
  });
  const grantData = await grant.json().catch(() => ({}));
  if (!grant.ok) throw new Error(`充值 API 失败: ${grantData.error || grant.status}`);

  const login = await registerTestUser(phone, 'Test123456');
  const afterBal = await fetch(`${MAIN_SITE}/api/wallet/balance`, {
    headers: { Authorization: `Bearer ${login.token}` },
  }).then((r) => r.json());

  const before = Number(beforeBal.balanceCents ?? 0);
  const after = Number(afterBal.balanceCents ?? 0);
  if (after < before + 150) {
    throw new Error(`余额未增加: ${before} -> ${after}`);
  }
  console.log('OK: 主站充值联动', `¥${(before / 100).toFixed(2)} → ¥${(after / 100).toFixed(2)}`);
  console.log('   ', grantData.message);
  return grantData;
}

async function verifyAdminPage(adminUrl) {
  const html = await fetch(adminUrl).then((r) => r.text());
  if (!html.includes('管理员 · 积分充值')) {
    throw new Error('管理员页面内容异常');
  }
  console.log('OK: 管理员小站可访问', adminUrl);
}

async function main() {
  console.log('主站:', MAIN_SITE);
  const token = readNetlifyToken();
  const site = await findOrCreateSite(token);
  const adminUrl = await deployAdminSite(token, site.id);
  const url = adminUrl.endsWith('/') ? adminUrl : `${adminUrl}/`;
  await verifyAdminPage(url);

  const phone = `186${String(Date.now()).slice(-8)}`;
  console.log('\n联动测试手机号:', phone);
  await verifyGrantLink(phone);

  const statePath = path.join(ADMIN_DIR, '.deploy-state.json');
  fs.writeFileSync(
    statePath,
    JSON.stringify({ adminUrl: url, mainSite: MAIN_SITE, deployedAt: new Date().toISOString() }, null, 2),
  );

  console.log('\n========================================');
  console.log('管理员充值站:', url);
  console.log('主站平台:   ', MAIN_SITE);
  console.log('管理员页已内置密钥，无需手动填写');
  console.log('联动测试: 通过');
  console.log('========================================\n');
}

main().catch((e) => {
  console.error('失败:', e.message);
  process.exit(1);
});
