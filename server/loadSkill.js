import fs from 'fs';
import path from 'path';
import { getServerDir } from './paths.js';

const BUNDLED_SKILL = path.join(getServerDir(), 'prompts', 'cross-cultural-research-SKILL.md');
const COMPACT_SKILL = path.join(getServerDir(), 'prompts', 'cross-cultural-research-SKILL-compact.md');
const DESKTOP_SKILL = path.join(
  process.env.USERPROFILE || '',
  'Desktop',
  'cross-cultural-research',
  'SKILL.md'
);

/** @type {Map<string, { body: string, source: string }>} */
const skillCache = new Map();

/** Serverless 完整版 SKILL 截断上限 */
const SERVERLESS_SKILL_MAX = 6500;

export function isServerlessRuntime() {
  return Boolean(
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AWS_EXECUTION_ENV ||
    process.env.NETLIFY,
  );
}

function trimForServerless(body) {
  if (!isServerlessRuntime() || body.length <= SERVERLESS_SKILL_MAX) return body;
  return `${body.slice(0, SERVERLESS_SKILL_MAX)}\n\n…（Serverless 环境已截断 SKILL 以控制生成耗时）`;
}

/** 去掉 YAML frontmatter，保留 Markdown 正文 */
function stripFrontmatter(text) {
  if (text.startsWith('---')) {
    const end = text.indexOf('---', 3);
    if (end !== -1) {
      return text.slice(end + 3).trim();
    }
  }
  return text.trim();
}

function readSkillFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  return stripFrontmatter(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * @param {{ variant?: 'compact' | 'full' }} options
 * - compact：对话 & Netlify 报告（快、省 token）
 * - full：本地完整报告（整合版 SKILL）
 */
export function loadSkillPrompt(options = {}) {
  const variant = options.variant === 'compact' ? 'compact' : 'full';
  const cacheKey = `${variant}:${isServerlessRuntime() ? 'sls' : 'local'}`;
  if (skillCache.has(cacheKey)) {
    return skillCache.get(cacheKey);
  }

  if (variant === 'compact') {
    const compact =
      readSkillFile(COMPACT_SKILL) ||
      readSkillFile(BUNDLED_SKILL)?.slice(0, SERVERLESS_SKILL_MAX);
    const result = {
      body: compact || '你是一名跨文化研究设计专家。',
      source: compact ? 'compact' : 'fallback',
    };
    skillCache.set(cacheKey, result);
    return result;
  }

  const candidates = isServerlessRuntime()
    ? [{ path: BUNDLED_SKILL, label: 'bundled' }]
    : [
        { path: process.env.SKILL_PATH, label: 'SKILL_PATH' },
        { path: BUNDLED_SKILL, label: 'bundled' },
        { path: DESKTOP_SKILL, label: 'Desktop/cross-cultural-research/SKILL.md' },
      ];

  for (const { path: p, label } of candidates) {
    const raw = readSkillFile(p);
    if (raw) {
      const result = { body: trimForServerless(raw), source: label };
      skillCache.set(cacheKey, result);
      return result;
    }
  }

  const fallback = { body: '你是一名跨文化研究设计专家。', source: 'fallback' };
  skillCache.set(cacheKey, fallback);
  return fallback;
}

export function getSkillMeta() {
  const { source } = loadSkillPrompt({ variant: 'compact' });
  return { skill: 'cross-cultural-research', skillSource: source };
}
