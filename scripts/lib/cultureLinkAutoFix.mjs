/**
 * 全自动修复：文献/案例全局换链；视频仅「确认下架」且精准替换单条 bilibili()
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { resolveReplacement } from './linkReplacementRegistry.mjs';
import { resolveVideoReplacement, extractBv } from './videoBvRegistry.mjs';
import { fetchCheck, projectRoot } from './cultureLinkAudit.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATA_ROOT = join(projectRoot, 'src', 'data');
/** 视频只允许改这些文件里的 bilibili() 定义，禁止全库 URL 替换 */
const VIDEO_SOURCE_FILES = [
  'curatedLinks.js',
  'countryCurated.js',
  'countries.js',
];

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

  const fixable = auditResult.issues.filter((i) => {
    if (i.type === '视频') {
      return (
        i.issue === '链接不可访问' &&
        i.confirmedDead === true &&
        /bilibili\.com/i.test(i.url)
      );
    }
    if (i.severity === 'critical' || i.severity === 'high') return true;
    if (i.severity === 'medium' && i.issue === '链接不可访问') return true;
    return false;
  });

  for (const issue of fixable) {
    const key = `${issue.url}|${issue.type}|${issue.title}`;
    if (plan.has(key)) continue;

    const replacement =
      issue.type === '视频'
        ? await resolveVideoReplacement(issue)
        : await resolveReplacement(issue);

    if (issue.type === '视频' && replacement.url) {
      const verify = await fetchCheck(replacement.url);
      if (!verify.ok && !verify.soft404) {
        console.warn(`  ⚠ 跳过：替代视频未验证可访问 ${replacement.url}`);
        continue;
      }
    }

    plan.set(key, {
      oldUrl: issue.url,
      oldTitle: issue.title,
      oldBv: extractBv(issue.url),
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

/**
 * 只替换「BV + 标题」完全一致的一条 bilibili()，不波及其他常量
 */
function replacePreciseBilibiliCall(content, oldBv, oldTitle, newBv, newTitle, tag = '地方文化') {
  if (!oldBv || !oldTitle || !newBv) return content;
  const safeTitle = String(newTitle).replace(/'/g, "\\'");
  const re = new RegExp(
    `bilibili\\(\\s*['"]${escapeRegExp(oldBv)}['"]\\s*,\\s*['"]${escapeRegExp(oldTitle)}['"]\\s*,\\s*['"][^'"]*['"]\\s*\\)`,
  );
  let replaced = false;
  return content.replace(re, (match) => {
    if (replaced) return match;
    replaced = true;
    return `bilibili('${newBv}', '${safeTitle}', '${tag}')`;
  });
}

/** ALL_CURATED_URLS 等处的纯 URL 字符串：只替换第一次出现 */
function replaceUrlOnce(content, oldUrl, newUrl) {
  const o = normalizeUrl(oldUrl);
  const n = normalizeUrl(newUrl);
  if (!o || o === n) return content;
  const re = new RegExp(`${escapeRegExp(o)}/+`);
  let done = false;
  return content.replace(re, (m) => {
    if (done) return m;
    done = true;
    return `${n}/`;
  });
}

function isVideoSourceFile(filePath) {
  const rel = filePath.replace(/\\/g, '/');
  return VIDEO_SOURCE_FILES.some((name) => rel.endsWith(`src/data/${name}`) || rel.endsWith(`/${name}`));
}

/**
 * @returns {{ filesChanged: string[], fixes: object[] }}
 */
export async function applyFixPlan(fixPlan) {
  const allFiles = walkJsFiles(DATA_ROOT);
  const filesChanged = [];
  const applied = [];

  for (const fix of fixPlan) {
    const { oldUrl, oldTitle, oldBv, replacement, type } = fix;
    const newUrl = replacement.url;
    const newBv = replacement.bv || extractBv(newUrl);
    const newTitle = replacement.title;
    const newTag = replacement.tag || '地方文化';

    const targetFiles =
      type === '视频'
        ? allFiles.filter(isVideoSourceFile)
        : allFiles;

    for (const file of targetFiles) {
      let content = readFileSync(file, 'utf8');
      const before = content;

      if (type === '视频') {
        if (oldBv && oldTitle) {
          content = replacePreciseBilibiliCall(
            content,
            oldBv,
            oldTitle,
            newBv,
            newTitle,
            newTag,
          );
        }
        if (content.includes(oldUrl)) {
          content = replaceUrlOnce(content, oldUrl, newUrl);
        }
      } else {
        content = applyUrlSwap(content, oldUrl, newUrl);
        if (oldTitle && newTitle && oldTitle !== newTitle) {
          content = content.split(oldTitle).join(newTitle);
        }
      }

      if (content !== before) {
        writeFileSync(file, content, 'utf8');
        if (!filesChanged.includes(file)) filesChanged.push(file);
        applied.push({
          file: file.replace(projectRoot, ''),
          from: `${oldBv || oldUrl} · ${oldTitle || ''}`,
          to: `${newBv || newUrl} · ${newTitle || ''}`,
          reason: replacement.reason,
        });
      }
    }
  }

  return { filesChanged, fixes: applied };
}
