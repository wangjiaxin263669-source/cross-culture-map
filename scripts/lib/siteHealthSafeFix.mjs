/**
 * 站点健康守护 · 安全修复（永不改 src/data 与源码）
 *
 * 允许的修复类型：
 * - netlify_rebuild：正式站 502/503/usage_exceeded 时触发 Build Hook（无仓库文件变更）
 */

import { PROTECTED_PATH_PREFIXES } from './siteHealthConfig.mjs';

const TRANSIENT_HEALTH = new Set([502, 503, 529]);
const TRANSIENT_ERRORS = new Set(['usage_exceeded', 'service_unavailable']);

/**
 * @param {{ checks?: Array<{ id: string, ok: boolean, httpStatus?: number, errorCode?: string }>, suggestedFixes?: Array<{ kind: string, path?: string }> }} report
 * @param {{ NETLIFY_BUILD_HOOK?: string, applyFixes?: boolean }} env
 */
export async function applySafeFixes(report, env = {}) {
  const applied = [];
  const skipped = [];

  if (!env.applyFixes) {
    return {
      applied,
      skipped: [{ type: 'all', reason: 'dry-run 或未传 --apply-safe-fixes' }],
    };
  }

  const healthFail = report.checks?.find((c) => c.id === 'health' && !c.ok);
  const transient =
    healthFail &&
    (TRANSIENT_HEALTH.has(healthFail.httpStatus) ||
      TRANSIENT_ERRORS.has(healthFail.errorCode));

  if (transient && env.NETLIFY_BUILD_HOOK) {
    try {
      const res = await fetch(env.NETLIFY_BUILD_HOOK, {
        method: 'POST',
        signal: AbortSignal.timeout(30000),
      });
      applied.push({
        type: 'netlify_rebuild',
        ok: res.ok,
        status: res.status,
        note: '已触发 Netlify 重建，未修改任何仓库文件',
      });
    } catch (err) {
      applied.push({
        type: 'netlify_rebuild',
        ok: false,
        error: err.message,
      });
    }
  } else if (transient && !env.NETLIFY_BUILD_HOOK) {
    skipped.push({
      type: 'netlify_rebuild',
      reason: '未配置 NETLIFY_BUILD_HOOK，跳过自动重建',
    });
  }

  for (const f of report.suggestedFixes || []) {
    if (f.kind === 'edit_file') {
      skipped.push({
        type: 'edit_file',
        reason: `已禁止自动改文件: ${f.path}`,
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
