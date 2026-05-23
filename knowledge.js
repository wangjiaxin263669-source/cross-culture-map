import fs from 'fs';
import path from 'path';
import { getServerDir } from './paths.js';

const KNOWLEDGE_PATH = path.join(getServerDir(), 'data', 'knowledge-chunks.json');

let knowledgeBase = null;

function loadKnowledge() {
  if (knowledgeBase) return knowledgeBase;
  if (!fs.existsSync(KNOWLEDGE_PATH)) {
    knowledgeBase = { chunks: [], source: null };
    return knowledgeBase;
  }
  knowledgeBase = JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, 'utf-8'));
  return knowledgeBase;
}

/** 简单关键词检索：为查询匹配最相关的 PDF 知识块 */
export function retrieveRelevantChunks(query, limit = 4) {
  const { chunks } = loadKnowledge();
  if (!chunks?.length || !query?.trim()) return [];

  const terms = query
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);

  const extraTerms = [
    '文化', '跨文化', '设计', 'hofstede', '权力', '个人主义', '集体主义',
    '不确定性', '男性度', '长期', '宽容', 'ui', 'ux', '本地化', '网站',
  ].filter((t) => query.includes(t) || query.toLowerCase().includes(t));

  const allTerms = [...new Set([...terms, ...extraTerms])];

  const scored = chunks.map((chunk) => {
    const text = chunk.text.toLowerCase();
    let score = 0;
    for (const term of allTerms) {
      const t = term.toLowerCase();
      if (text.includes(t)) score += t.length > 3 ? 3 : 1;
    }
    return { ...chunk, score };
  });

  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ id, text }) => ({ id, text }));
}

export function formatKnowledgeContext(chunks) {
  if (!chunks.length) {
    return '（知识库暂无匹配段落，请基于 Hofstede 文化维度与设计研究通用框架作答。）';
  }
  return chunks
    .map((c, i) => `【课程资料 ${i + 1}】\n${c.text}`)
    .join('\n\n---\n\n');
}

export function getKnowledgeMeta() {
  const kb = loadKnowledge();
  return {
    source: kb.source,
    chunkCount: kb.chunkCount ?? kb.chunks?.length ?? 0,
    builtAt: kb.builtAt,
  };
}
