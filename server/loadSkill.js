import fs from 'fs';
import path from 'path';
import { getServerDir } from './paths.js';

const BUNDLED_SKILL = path.join(getServerDir(), 'prompts', 'cross-cultural-research-SKILL.md');
const DESKTOP_SKILL = path.join(
  process.env.USERPROFILE || '',
  'Desktop',
  'cross-cultural-research',
  'SKILL.md'
);

let cachedSkillBody = null;
let cachedSkillSource = null;

const SERVERLESS_SKILL_MAX = 6500;

function isServerlessRuntime() {
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
 * 加载 cross-cultural-research SKILL（优先 SKILL_PATH → 桌面原版 → 项目内置）
 */
export function loadSkillPrompt() {
  if (cachedSkillBody) {
    return { body: cachedSkillBody, source: cachedSkillSource };
  }

  const candidates = isServerlessRuntime()
    ? [{ path: BUNDLED_SKILL, label: 'bundled' }]
    : [
        { path: process.env.SKILL_PATH, label: 'SKILL_PATH' },
        { path: DESKTOP_SKILL, label: 'Desktop/cross-cultural-research/SKILL.md' },
        { path: BUNDLED_SKILL, label: 'bundled' },
      ];

  for (const { path: p, label } of candidates) {
    const raw = readSkillFile(p);
    if (raw) {
      cachedSkillBody = trimForServerless(raw);
      cachedSkillSource = label;
      return { body: cachedSkillBody, source: label };
    }
  }

  cachedSkillBody = '你是一名跨文化研究设计专家。';
  cachedSkillSource = 'fallback';
  return { body: cachedSkillBody, source: cachedSkillSource };
}

export function getSkillMeta() {
  const { source } = loadSkillPrompt();
  return { skill: 'cross-cultural-research', skillSource: source };
}
