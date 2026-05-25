/**
 * 站点健康守护 · 全自动托管配置（永不自动改业务数据文件）
 */

export const DEFAULT_PROD_URL =
  process.env.SITE_URL?.trim() ||
  process.env.FRONTEND_URL?.trim() ||
  'https://ephemeral-bubblegum-a79332.netlify.app';

export const NETLIFY_SITE_ID =
  process.env.NETLIFY_SITE_ID?.trim() || '6c06b462-2090-44e3-8234-e6d929d01674';

/** 绝不允许自动修改的路径前缀 */
export const PROTECTED_PATH_PREFIXES = [
  'src/data/',
  'src/',
  'server/',
  'public/',
  'netlify/',
  '.github/workflows/culture-link-guardian.yml',
  'package.json',
  'package-lock.json',
];

export const REPORT_DIR = 'scripts/guardian-reports';
export const REPORT_FILE = 'site-health-latest.json';

export const MAX_CURATED_LINK_SAMPLES = 24;
export const AI_TIMEOUT_MS = Number(process.env.GUARDIAN_AI_TIMEOUT_MS || 120000);

/** 全自动：复检前等待 Netlify 重建（毫秒） */
export const REBUILD_WAIT_MS = Number(process.env.GUARDIAN_REBUILD_WAIT_MS || 120000);

/** 全自动最大巡检轮次（含重建后复检） */
export const MAX_AUTO_ROUNDS = 3;
