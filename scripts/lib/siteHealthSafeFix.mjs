/**
 * 全自动安全修复 · 仅运维动作，永不改仓库业务文件
 */

import { NETLIFY_SITE_ID, PROTECTED_PATH_PREFIXES } from './siteHealthConfig.mjs';

const TRANSIENT_HTTP = new Set([502, 503, 504, 529]);
const TRANSIENT_ERRORS = new Set(['usage_exceeded', 'service_unavailable']);

function needsInfrastructureRecovery(report) {
  const checks = report.checks || [];
  for (const c of checks) {
    if (c.ok) continue;
    if (TRANSIENT_HTTP.has(c.httpStatus) || TRANSIENT_ERRORS.has(c.errorCode)) {
      return true;
    }
    if (c.id === 'frontend' && c.httpStatus >= 500) return true;
    if (c.id === 'health' && !c.ok) return true;
  }
  return false;
}

async function triggerNetlifyRebuild(env) {
  if (env.NETLIFY_BUILD_HOOK) {
    const res = await fetch(env.NETLIFY_BUILD_HOOK, {
      method: 'POST',
      signal: AbortSignal.timeout(45000),
    });
    return { ok: res.ok, status: res.status, via: 'build_hook' };
  }

  const token = env.NETLIFY_AUTH_TOKEN?.trim();
  if (token && NETLIFY_SITE_ID) {
    const res = await fetch(`https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/builds`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
      signal: AbortSignal.timeout(45000),
    });
    return { ok: res.ok || res.status === 200, status: res.status, via: 'netlify_api' };
  }

  return { ok: false, via: 'none', reason: '缺少 NETLIFY_BUILD_HOOK 或 NETLIFY_AUTH_TOKEN' };
}

/**
 * @param {object} report
 * @param {{ applyFixes?: boolean, NETLIFY_BUILD_HOOK?: string, NETLIFY_AUTH_TOKEN?: string }} env
 */
export async function applySafeFixes(report, env = {}) {
  const applied = [];
  const skipped = [];

  if (!env.applyFixes) {
    return { applied, skipped: [{ type: 'all', reason: 'dry-run' }] };
  }

  if (needsInfrastructureRecovery(report)) {
    try {
      const result = await triggerNetlifyRebuild(env);
      applied.push({
        type: 'netlify_rebuild',
        ...result,
        note: result.ok
          ? `已自动触发正式站重建 (${result.via})，未修改任何代码/数据文件`
          : result.reason || `HTTP ${result.status}`,
      });
    } catch (err) {
      applied.push({ type: 'netlify_rebuild', ok: false, error: err.message });
    }
  }

  for (const f of report.suggestedFixes || []) {
    if (f.kind === 'edit_file') {
      skipped.push({
        type: 'edit_file',
        reason: `禁止自动改文件: ${f.path || 'n/a'}`,
      });
    }
    if (f.kind === 'manual' && /失效链接/.test(f.note || '')) {
      skipped.push({
        type: 'culture_link',
        reason: '外链仅记录，由每周 culture-link-guardian 在确认后处理，本站守护不换链',
      });
    }
  }

  return { applied, skipped };
}

export function assertNoProtectedWrites(filePath) {
  const normalized = String(filePath).replace(/\\/g, '/');
  for (const prefix of PROTECTED_PATH_PREFIXES) {
    if (normalized.startsWith(prefix)) {
      throw new Error(`禁止写入受保护路径: ${filePath}`);
    }
  }
}
