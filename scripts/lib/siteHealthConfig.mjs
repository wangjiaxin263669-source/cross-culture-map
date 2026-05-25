/**
 * 站点健康守护 · 配置（只读巡检，禁止自动改业务数据）
 */

export const DEFAULT_PROD_URL =
  process.env.SITE_URL?.trim() ||
  process.env.FRONTEND_URL?.trim() ||
  'https://ephemeral-bubblegum-a79332.netlify.app';

/** 绝不允许自动修改的路径前缀（与视频换链事故隔离） */
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

/** 允许写入的唯一目录 */
export const REPORT_DIR = 'scripts/guardian-reports';

export const REPORT_FILE = 'site-health-latest.json';

/** 从文化数据文件中抽样检测的外链数量上限（只读 HEAD/GET） */
export const MAX_CURATED_LINK_SAMPLES = 24;

/** CI 中 AI 调用超时（毫秒） */
export const AI_TIMEOUT_MS = Number(process.env.GUARDIAN_AI_TIMEOUT_MS || 120000);
