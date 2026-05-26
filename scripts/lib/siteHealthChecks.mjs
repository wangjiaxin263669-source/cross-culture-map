/**
 * 站点健康检查（结构化结果，供 smoke-test 与 site-health-guardian 共用）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  DEFAULT_PROD_URL,
  MAX_CURATED_LINK_SAMPLES,
  AI_TIMEOUT_MS,
} from './siteHealthConfig.mjs';
import { testDeviceFingerprint } from './testDeviceFp.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');

/** @typedef {{ id: string, name: string, severity: 'critical'|'warn'|'info', ok: boolean, detail?: string, httpStatus?: number, errorCode?: string }} CheckResult */

export async function httpJson(base, route, options = {}) {
  const url = `${base.replace(/\/$/, '')}${route}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    ...options,
    headers,
    signal: options.signal || AbortSignal.timeout(options.timeoutMs || 60000),
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text.slice(0, 800) };
  }
  return { status: res.status, body, ok: res.ok, text };
}

/** @returns {CheckResult} */
function check(id, name, ok, detail, extra = {}) {
  return {
    id,
    name,
    severity: extra.severity || (ok ? 'info' : 'critical'),
    ok,
    detail,
    ...extra,
  };
}

export async function checkHealth(base) {
  try {
    const { status, body, ok, text } = await httpJson(base, '/api/health');
    if (!ok) {
      const errCode = body?.error || (text?.includes('usage_exceeded') ? 'usage_exceeded' : null);
      return check('health', 'API 健康检查', false, `HTTP ${status}`, {
        httpStatus: status,
        errorCode: errCode,
        severity: errCode === 'usage_exceeded' ? 'warn' : 'critical',
      });
    }
    return check('health', 'API 健康检查', true, `AI=${body.aiConfigured} storage=${body.auth?.storage}`, {
      severity: 'info',
    });
  } catch (e) {
    return check('health', 'API 健康检查', false, e.message, { severity: 'critical' });
  }
}

export async function checkFrontendShell(base) {
  try {
    const res = await fetch(base.replace(/\/$/, '') + '/', {
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
    });
    const html = await res.text();
    const hasBrand = /CROSS-CULTURE|跨文化/i.test(html);
    const hasBundle = /assets\/.*\.js/i.test(html) || res.ok;
    const ok = res.ok && hasBrand && hasBundle;
    return check(
      'frontend',
      '正式站首页',
      ok,
      ok ? `HTTP ${res.status}` : `缺少品牌标识或资源 (HTTP ${res.status})`,
      { httpStatus: res.status, severity: ok ? 'info' : 'critical' },
    );
  } catch (e) {
    return check('frontend', '正式站首页', false, e.message, { severity: 'critical' });
  }
}

/** @returns {{ checks: CheckResult[], token: string|null }} */
export async function checkAuthFlow(base) {
  const phone = `139${String(Date.now()).slice(-8)}`;
  const password = 'GuardianTest1!';
  const displayName = '健康守护测试';
  const deviceFingerprint = testDeviceFingerprint(phone);

  const reg = await httpJson(base, '/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      displayName,
      phone,
      password,
      confirmPassword: password,
      deviceFingerprint,
    }),
  });
  if (reg.status !== 200) {
    return {
      checks: [
        check('auth_register', '注册', false, reg.body?.error || `HTTP ${reg.status}`, {
          httpStatus: reg.status,
        }),
      ],
      token: null,
    };
  }

  await new Promise((r) => setTimeout(r, 500));

  const login = await httpJson(base, '/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  });
  if (login.status !== 200 || !login.body?.token) {
    return {
      checks: [
        check('auth_register', '注册', true, `¥${reg.body.user?.balanceYuan}`, { severity: 'info' }),
        check('auth_login', '登录', false, login.body?.error || `HTTP ${login.status}`, {
          httpStatus: login.status,
        }),
      ],
      token: null,
    };
  }

  const me = await httpJson(base, '/api/auth/me', {
    headers: { Authorization: `Bearer ${login.body.token}` },
  });

  const dup = await httpJson(base, '/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      displayName,
      phone,
      password,
      confirmPassword: password,
      deviceFingerprint,
    }),
  });

  return {
    checks: [
      check('auth_register', '注册', true, `余额 ¥${reg.body.user?.balanceYuan}`, { severity: 'info' }),
      check('auth_login', '登录', true, 'token 有效', { severity: 'info' }),
      check('auth_me', '会话 /me', me.status === 200, me.body?.error || `HTTP ${me.status}`, {
        severity: me.status === 200 ? 'info' : 'critical',
      }),
      check(
        'auth_dup',
        '重复注册拦截',
        dup.status === 400 && /已被注册/.test(dup.body?.error || ''),
        dup.body?.error || `HTTP ${dup.status}`,
        { severity: 'info' },
      ),
    ],
    token: login.body.token,
  };
}

export async function checkWallet(base, token) {
  const auth = { Authorization: `Bearer ${token}` };
  const results = [];
  const cfg = await httpJson(base, '/api/wallet/config', { headers: auth });
  results.push(
    check(
      'wallet_config',
      '钱包配置',
      cfg.status === 200,
      cfg.body?.wallet?.costsYuan
        ? `sim ¥${cfg.body.wallet.costsYuan.sim_personas}/次`
        : cfg.body?.error || `HTTP ${cfg.status}`,
      { severity: cfg.status === 200 ? 'info' : 'critical' },
    ),
  );

  const bal = await httpJson(base, '/api/wallet/balance', { headers: auth });
  results.push(
    check('wallet_balance', '余额查询', bal.status === 200, `¥${bal.body?.balanceYuan ?? '?'}`, {
      severity: bal.status === 200 ? 'info' : 'critical',
    }),
  );

  const order = await httpJson(base, '/api/wallet/recharge/create', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ packageId: 'p10', payType: 'wxpay' }),
  });
  const orderOk = order.status === 200 && order.body?.orderId;
  results.push(
    check(
      'wallet_recharge',
      '充值下单',
      orderOk,
      orderOk
        ? `provider=${order.body.provider || order.body.mode}`
        : order.body?.error || `HTTP ${order.status}`,
      { severity: orderOk ? 'info' : 'critical' },
    ),
  );

  return results;
}

export async function checkOpenPlatform(base) {
  const { status, body, ok } = await httpJson(base, '/api/open-platform/status');
  if (!ok) {
    return check('open_platform', '开放平台状态', false, `HTTP ${status}`, { httpStatus: status });
  }
  const jo = body.platforms?.justone;
  return check(
    'open_platform',
    'Just One API',
    Boolean(jo?.configured),
    `configured=${jo?.configured} connected=${jo?.connected}`,
    { severity: jo?.configured ? 'info' : 'warn' },
  );
}

export async function checkCorpus(base) {
  const { status, body, ok } = await httpJson(base, '/api/corpus/search', {
    method: 'POST',
    body: JSON.stringify({ query: '跨文化 设计', marketId: 'cn', sources: ['xiaohongshu'] }),
    timeoutMs: 90000,
  });
  if (!ok) {
    return check('corpus', '语料检索', false, body?.error || `HTTP ${status}`, {
      severity: 'warn',
      httpStatus: status,
    });
  }
  return check('corpus', '语料检索', true, `${body.snippets?.length ?? 0} 条`, { severity: 'info' });
}

export async function checkAiChat(base, token, health) {
  if (!health?.aiConfigured) {
    return check('ai_chat', 'AI 对话', true, '跳过：未配置 DEEPSEEK', { severity: 'info' });
  }
  const auth = { Authorization: `Bearer ${token}` };
  const { status, body } = await httpJson(base, '/api/chat', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      message: '用一句话说明跨文化 UI 设计要点',
      country: { id: 'cn', title: '中国', marketType: 'country' },
      history: [],
    }),
    timeoutMs: AI_TIMEOUT_MS,
  });
  if (status === 402 || body?.code === 'INSUFFICIENT_BALANCE') {
    return check('ai_chat', 'AI 对话', true, '跳过：余额不足', { severity: 'warn' });
  }
  const transient = [502, 503, 504, 529].includes(status);
  const ok = status === 200 && body?.reply?.trim();
  return check('ai_chat', 'AI 对话', ok, ok ? body.reply.slice(0, 60) : body?.error || `HTTP ${status}`, {
    severity: ok ? 'info' : transient ? 'warn' : 'critical',
  });
}

export async function checkAiReport(base, token, health) {
  if (!health?.aiConfigured) {
    return check('ai_report', '三步分析报告', true, '跳过：未配置 DEEPSEEK', { severity: 'info' });
  }
  const auth = { Authorization: `Bearer ${token}` };
  const { status, body } = await httpJson(base, '/api/report', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      productIdea: '守护测试：App 进入中国',
      country: { id: 'cn', title: '中国', marketType: 'country', overview: '测', tagline: '测' },
    }),
    timeoutMs: AI_TIMEOUT_MS,
  });
  if (status === 402) {
    return check('ai_report', '三步分析报告', true, '跳过：余额不足', { severity: 'warn' });
  }
  const transient = [502, 503, 504, 529].includes(status);
  const ok = status === 200 && body?.report?.trim();
  return check('ai_report', '三步分析报告', ok, ok ? body.report.slice(0, 60) : body?.error || `HTTP ${status}`, {
    severity: ok ? 'info' : transient ? 'warn' : 'critical',
  });
}

export async function checkAiSimPersonas(base, token, health) {
  if (!health?.aiConfigured) {
    return check('ai_sim', '模拟调研人设', true, '跳过：未配置 DEEPSEEK', { severity: 'info' });
  }
  const auth = { Authorization: `Bearer ${token}` };
  const { status, body } = await httpJson(base, '/api/simulated-research/personas', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      researchTopic: '守护测试：二手交易信任',
      audienceCriteria: '18-25',
      personaCount: 2,
      country: { id: 'cn', title: '中国', marketType: 'country' },
      corpusSnippets: [],
    }),
    timeoutMs: AI_TIMEOUT_MS,
  });
  if (status === 402) {
    return check('ai_sim', '模拟调研人设', true, '跳过：余额不足', { severity: 'warn' });
  }
  const ok = status === 200 && body?.personas?.length >= 1;
  return check(
    'ai_sim',
    '模拟调研人设',
    ok,
    ok ? `${body.personas.length} 人` : body?.error || `HTTP ${status}`,
    { severity: ok ? 'info' : 'critical' },
  );
}

/** 只读：从数据文件提取 URL 抽样检测，不写回 */
export function sampleCuratedUrls(limit = MAX_CURATED_LINK_SAMPLES) {
  const dataDir = path.join(ROOT, 'src/data');
  const files = ['countries.js', 'curatedLinks.js', 'countryCurated.js'];
  const urls = new Set();
  const urlRe = /https?:\/\/[^\s'"<>\\]+/g;

  for (const file of files) {
    const p = path.join(dataDir, file);
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, 'utf8');
    for (const m of text.matchAll(urlRe)) {
      let u = m[0].replace(/[),.;]+$/, '');
      if (u.length > 12 && !u.includes('localhost')) urls.add(u);
      if (urls.size >= limit * 3) break;
    }
  }

  return [...urls].slice(0, limit);
}

export async function checkCuratedLinksReadOnly() {
  const urls = sampleCuratedUrls();
  let dead = 0;
  let ok = 0;
  const deadList = [];

  for (const url of urls) {
    try {
      let res = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CrossCultureMap-Guardian/1.0)' },
      });
      if (res.status === 405 || res.status === 403) {
        res = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          signal: AbortSignal.timeout(15000),
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CrossCultureMap-Guardian/1.0)' },
        });
      }
      if (res.ok || res.status === 403) ok += 1;
      else {
        dead += 1;
        deadList.push({ url: url.slice(0, 120), status: res.status });
      }
    } catch (e) {
      dead += 1;
      deadList.push({ url: url.slice(0, 120), error: e.message });
    }
  }

  const ratio = urls.length ? ok / urls.length : 1;
  return {
    check: check(
      'curated_links',
      '文化链接抽样（只读）',
      ratio >= 0.6,
      `${ok}/${urls.length} 可达（不自动换链）`,
      {
        severity: ratio >= 0.6 ? 'info' : 'warn',
      },
    ),
    deadList,
    sampled: urls.length,
  };
}

/**
 * @param {string} base
 * @param {{ runAi?: boolean }} opts
 */
export async function runProductionSuite(base, opts = {}) {
  const checks = [];
  const { status, body, ok } = await httpJson(base, '/api/health');
  const healthBody = ok ? body : null;

  checks.push(
    ok
      ? check('health', 'API 健康检查', true, `AI=${body.aiConfigured}`, { severity: 'info' })
      : check('health', 'API 健康检查', false, `HTTP ${status}`, {
          httpStatus: status,
          errorCode: body?.error,
          severity: body?.error === 'usage_exceeded' ? 'warn' : 'critical',
        }),
  );

  checks.push(await checkFrontendShell(base));
  checks.push(await checkOpenPlatform(base));

  const suggestedFixes = [];

  if (!ok && body?.error === 'usage_exceeded') {
    suggestedFixes.push({
      kind: 'manual',
      note: 'Netlify 函数用量超限，等待配额重置或升级套餐；可配置 NETLIFY_BUILD_HOOK 尝试重建',
    });
    return { checks, suggestedFixes, deadLinks: [], authToken: null, health: null };
  }

  if (!ok) {
    return { checks, suggestedFixes, deadLinks: [], authToken: null, health: null };
  }

  const auth = await checkAuthFlow(base);
  checks.push(...auth.checks);

  const token = auth.token;
  if (token) {
    checks.push(...(await checkWallet(base, token)));
    checks.push(await checkCorpus(base));
    if (opts.runAi !== false) {
      checks.push(await checkAiChat(base, token, healthBody));
      checks.push(await checkAiReport(base, token, healthBody));
      checks.push(await checkAiSimPersonas(base, token, healthBody));
    }
  }

  const linkAudit = await checkCuratedLinksReadOnly();
  checks.push(linkAudit.check);

  if (linkAudit.deadList?.length) {
    for (const d of linkAudit.deadList.slice(0, 5)) {
      suggestedFixes.push({
        kind: 'manual',
        note: `失效链接需人工或在 culture-link-guardian 确认后处理: ${d.url}`,
      });
    }
  }

  return {
    checks,
    suggestedFixes,
    deadLinks: linkAudit.deadList,
    authToken: token,
    health: healthBody,
  };
}

export { DEFAULT_PROD_URL };
