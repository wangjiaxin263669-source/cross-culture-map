/**
 * 全自动修复：在 src/data 内替换失效/错位/低价值链接
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { resolveReplacement } from './linkReplacementRegistry.mjs';
import { projectRoot } from './cultureLinkAudit.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATA_ROOT = join(projectRoot, 'src', 'data');
const FIXABLE_SEVERITY = new Set(['critical', 'high', 'medium']);

function walkJsFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkJsFiles(p, acc);
    else if (name.endsWith('.js')) acc.push(p);
  }
  return acc;
}

function normalizeUrl(u) {
  return String(u).replace(/\/+$/, '');
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {import('./cultureLinkAudit.mjs').runCultureLinkAudit extends Function ? Awaited<ReturnType<import('./cultureLinkAudit.mjs').runCultureLinkAudit>> : never} auditResult
 */
export async function buildFixPlan(auditResult) {
  const plan = new Map();
  /** 仅自动修复「确认失效」；标题错位在 B 站可访问时不乱换地方纪录片 */
  const fixable = auditResult.issues.filter((i) => {
    if (i.severity === 'critical' || i.severity === 'high') return true;
    if (i.severity === 'medium' && i.issue === '链接不可访问') return true;
    return false;
  });

  for (const issue of fixable) {
    const key = `${issue.url}|${issue.type}`;
    if (plan.has(key)) continue;
    const replacement = await resolveReplacement(issue);
    plan.set(key, {
      oldUrl: issue.url,
      oldTitle: issue.title,
      type: issue.type,
      marketId: issue.marketId,
      issue: issue.issue,
      replacement,
    });
  }
  return [...plan.values()];
}

function applyUrlSwap(content, oldUrl, newUrl) {
  const o = normalizeUrl(oldUrl);
  const n = normalizeUrl(newUrl);
  if (!o || o === n) return content;
  const target = `${n}/`;
  const re = new RegExp(`${escapeRegExp(o)}/+`, 'g');
  return content.replace(re, target);
}

function applyBilibiliSwap(content, oldUrl, newUrl, newTitle, oldTitle) {
  let out = applyUrlSwap(content, oldUrl, newUrl);
  const oldBv = (oldUrl.match(/BV[\w]+/i) || [])[0];
  const newBv = (newUrl.match(/BV[\w]+/i) || [])[0];
  if (oldBv && newBv && oldBv !== newBv) {
    const re = new RegExp(
      `bilibili\\(\\s*['"]${escapeRegExp(oldBv)}['"]\\s*,\\s*['"]([^'"]*)['"]`,
      'g',
    );
    out = out.replace(re, `bilibili('${newBv}', '${(newTitle || '$1').replace(/'/g, "\\'")}'`);
  }
  if (oldTitle && newTitle && oldTitle !== newTitle) {
    out = out.split(oldTitle).join(newTitle);
  }
  return out;
}

function applyTitleNearUrl(content, oldUrl, oldTitle, newTitle) {
  if (!oldTitle || !newTitle || oldTitle === newTitle) return content;
  if (!content.includes(oldUrl) && !content.includes(oldTitle)) return content;
  return content.split(oldTitle).join(newTitle);
}

/**
 * @returns {{ filesChanged: string[], fixes: object[] }}
 */
export async function applyFixPlan(fixPlan) {
  const files = walkJsFiles(DATA_ROOT);
  const filesChanged = [];
  const applied = [];

  for (const fix of fixPlan) {
    const { oldUrl, oldTitle, replacement, type } = fix;
    const newUrl = replacement.url;
    const newTitle = replacement.title;

    for (const file of files) {
      let content = readFileSync(file, 'utf8');
      const before = content;

      if (type === '视频') {
        content = applyBilibiliSwap(content, oldUrl, newUrl, newTitle, oldTitle);
        content = applyTitleNearUrl(content, oldUrl, oldTitle, newTitle);
      } else {
        content = applyUrlSwap(content, oldUrl, newUrl);
        content = applyTitleNearUrl(content, oldUrl, oldTitle, newTitle);
      }

      if (content !== before) {
        writeFileSync(file, content, 'utf8');
        if (!filesChanged.includes(file)) filesChanged.push(file);
        applied.push({
          file: file.replace(projectRoot, ''),
          from: oldUrl,
          to: newUrl,
          reason: replacement.reason,
        });
      }
    }
  }

  return { filesChanged, fixes: applied };
}
