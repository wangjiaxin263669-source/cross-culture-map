import { serializeCountry } from './aiApi.js';
import { getAuthHeaders } from './authApi.js';
import { getStoredAiModel } from '../utils/aiModelStorage.js';

function withModel(body, model) {
  return { ...body, model: model || getStoredAiModel() };
}

const API_BASE = import.meta.env.VITE_API_URL || '';

async function post(path, body, timeoutMs = 90000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('模拟调研请求超时，请稍后重试');
    }
    throw new Error('无法连接后端，请运行 npm run dev');
  } finally {
    clearTimeout(timer);
  }

  let data = {};
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    if (res.status === 402) {
      const err = new Error(data.error || '余额不足，请先充值');
      err.code = 'INSUFFICIENT_BALANCE';
      err.status = 402;
      throw err;
    }
    throw new Error(data.error || `请求失败 (${res.status})`);
  }
  return data;
}

export async function searchCorpus({ query, marketId, sources }) {
  return post('/api/corpus/search', { query, marketId, sources }, 30000);
}

/** 解析项目框架文档（PDF / Word / PPT）为文本摘要 */
export async function parseProjectDocument(file) {
  const { readFileAsBase64 } = await import('../utils/researchMaterials.js');
  const dataBase64 = await readFileAsBase64(file);
  return post(
    '/api/simulated-research/parse-document',
    { fileName: file.name, dataBase64 },
    60000,
  );
}

export async function generatePersonas({
  researchTopic,
  audienceCriteria,
  personaCount,
  country,
  corpusSnippets,
  corpusContext,
  researchMaterials,
  model,
}) {
  const data = await post(
    '/api/simulated-research/personas',
    withModel(
      {
        researchTopic,
        audienceCriteria,
        personaCount,
        country: serializeCountry(country),
        corpusSnippets,
        corpusContext,
        researchMaterials,
      },
      model,
    ),
  );
  return data.personas;
}

export async function runInterview({
  persona,
  researchTopic,
  guideQuestions,
  country,
  corpusContext,
  researchMaterials,
}) {
  const data = await post('/api/simulated-research/interview', {
    persona,
    researchTopic,
    guideQuestions,
    country: serializeCountry(country),
    corpusContext,
    researchMaterials,
  });
  return data.interview;
}

export async function synthesizeReport({
  researchTopic,
  audienceCriteria,
  personas,
  interviews,
  country,
  corpusSnippets,
  researchMaterials,
  model,
}) {
  const data = await post(
    '/api/simulated-research/report',
    withModel(
      {
        researchTopic,
        audienceCriteria,
        personas,
        interviews,
        country: serializeCountry(country),
        corpusSnippets,
        researchMaterials,
      },
      model,
    ),
    120000,
  );
  return data.report;
}

export async function buildSyncToThreeStepPayload(session) {
  const data = await post('/api/simulated-research/sync-payload', session, 15000);
  return data.productIdea;
}
