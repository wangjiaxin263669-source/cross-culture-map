#!/usr/bin/env node
/**
 * 校验已上线使用的 curated 链接（不含 countries.js 内被覆盖的旧占位 URL）
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dataDir = join(root, 'src', 'data');

const VIDEO_RE = /bilibili\.com\/video\/bv|douyin\.com\/video\//i;

function isVideoUrl(url) {
  return VIDEO_RE.test(String(url));
}

function extractUrlsFromFile(path) {
  const text = readFileSync(path, 'utf8');
  const urls = [...text.matchAll(/https?:\/\/[^\s'"]+/g)].map((m) => m[0].replace(/[,;)]+$/g, ''));
  return urls;
}

async function headOk(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'cross-culture-map-link-check/1.0' },
    });
    if (res.status >= 200 && res.status < 400) return { ok: true, status: res.status };
    const getRes = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'cross-culture-map-link-check/1.0' },
    });
    return { ok: getRes.status >= 200 && getRes.status < 400, status: getRes.status };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

const scanFiles = [
  join(dataDir, 'countryCurated.js'),
  join(dataDir, 'curatedLinks.js'),
  ...readdirSync(join(dataDir, 'regions'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => join(dataDir, 'regions', f)),
];

const allUrls = new Set();
for (const f of scanFiles) {
  for (const u of extractUrlsFromFile(f)) allUrls.add(u);
}

console.log(`检查 ${allUrls.size} 个 curated URL\n`);

let failed = 0;
for (const url of [...allUrls].sort()) {
  const r = await headOk(url);
  const tag = isVideoUrl(url) ? 'VIDEO' : 'ARTICLE';
  if (r.ok) {
    console.log(`OK  [${tag}] ${r.status} ${url}`);
  } else {
    failed += 1;
    console.log(`FAIL[${tag}] ${r.status || ''} ${r.error || ''} ${url}`);
  }
}

if (failed > 0) {
  console.log(`\n${failed} 个链接需更换`);
  process.exit(1);
}
console.log('\n全部 curated 链接可访问');
