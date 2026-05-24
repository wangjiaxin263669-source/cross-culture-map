/**
 * 外部语料检索：精选库 + 可选 Serper 全网/站点搜索
 */
import fs from 'fs';
import path from 'path';
import { getServerDir } from '../paths.js';

const SNIPPETS_PATH = path.join(getServerDir(), 'data', 'corpus-snippets.json');

let cachedSnippets = null;

function loadSnippets() {
  if (cachedSnippets) return cachedSnippets;
  if (!fs.existsSync(SNIPPETS_PATH)) {
    cachedSnippets = [];
    return cachedSnippets;
  }
  const raw = JSON.parse(fs.readFileSync(SNIPPETS_PATH, 'utf-8'));
  cachedSnippets = raw.snippets || [];
  return cachedSnippets;
}

function scoreSnippet(snippet, queryTerms, marketId) {
  const text = `${snippet.title} ${snippet.content} ${(snippet.keywords || []).join(' ')}`.toLowerCase();
  let score = 0;
  for (const term of queryTerms) {
    if (text.includes(term)) score += term.length > 2 ? 3 : 1;
  }
  if (marketId && snippet.markets?.includes(marketId)) score += 5;
  return score;
}

function searchCurated({ query, marketId, sources, limit = 8 }) {
  const terms = String(query)
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);

  const sourceSet = new Set(sources || ['xiaohongshu', 'weibo', 'zhihu', 'reddit', 'twitter']);

  return loadSnippets()
    .filter((s) => sourceSet.has(s.source) || sourceSet.has('curated'))
    .map((s) => ({ ...s, score: scoreSnippet(s, terms, marketId) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score, ...rest }) => rest);
}

/** Serper Google Search API（可选，用于小红书站点等） */
async function searchSerper({ query, site, limit = 5 }) {
  const key = process.env.SERPER_API_KEY?.trim();
  if (!key) return [];

  const q = site ? `${query} site:${site}` : query;
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': key,
    },
    body: JSON.stringify({ q, num: limit, gl: 'cn', hl: 'zh-cn' }),
  });

  if (!res.ok) return [];
  const data = await res.json();
  return (data.organic || []).slice(0, limit).map((item) => ({
    source: site?.includes('xiaohongshu') ? 'xiaohongshu' : 'web',
    sourceLabel: site?.includes('xiaohongshu') ? '小红书·搜索' : '全网搜索',
    title: item.title,
    content: item.snippet || '',
    author: item.source || 'web',
    url: item.link,
    fromSerper: true,
  }));
}

/**
 * @param {{ query: string, marketId?: string, sources?: string[] }} opts
 */
export async function searchCorpus({ query, marketId, sources = ['xiaohongshu', 'weibo', 'zhihu'] }) {
  if (!query?.trim()) {
    return { snippets: [], meta: { curated: 0, serper: 0, serperConfigured: Boolean(process.env.SERPER_API_KEY) } };
  }

  const wantWeb = sources.includes('web');
  const wantXhs = sources.includes('xiaohongshu');
  const curatedSources = sources.filter((s) => s !== 'web');

  const curated = searchCurated({
    query,
    marketId,
    sources: curatedSources.length ? curatedSources : ['xiaohongshu', 'weibo', 'zhihu'],
    limit: 8,
  });

  let serperItems = [];
  if (process.env.SERPER_API_KEY?.trim()) {
    const tasks = [];
    if (wantXhs) {
      tasks.push(searchSerper({ query, site: 'xiaohongshu.com', limit: 4 }));
    }
    if (wantWeb) {
      tasks.push(searchSerper({ query, limit: 4 }));
    }
    const batches = await Promise.all(tasks);
    serperItems = batches.flat();
  }

  const seen = new Set();
  const merged = [];
  for (const item of [...curated, ...serperItems]) {
    const key = `${item.title}|${item.content?.slice(0, 40)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return {
    snippets: merged.slice(0, 12),
    meta: {
      curated: curated.length,
      serper: serperItems.length,
      serperConfigured: Boolean(process.env.SERPER_API_KEY?.trim()),
    },
  };
}

export function formatCorpusForPrompt(snippets) {
  if (!snippets?.length) {
    return '（未检索到外部语料，将主要依据文化维度与平台数据生成人设。）';
  }
  return snippets
    .map(
      (s, i) =>
        `【${s.sourceLabel || s.source} ${i + 1}】${s.title}\n作者/来源：${s.author || '—'}\n内容：${s.content}\n链接：${s.url || '—'}`,
    )
    .join('\n\n---\n\n');
}

export function getCorpusMeta() {
  return {
    snippetCount: loadSnippets().length,
    serperConfigured: Boolean(process.env.SERPER_API_KEY?.trim()),
    sources: ['xiaohongshu', 'weibo', 'zhihu', 'reddit', 'twitter', 'web'],
  };
}
