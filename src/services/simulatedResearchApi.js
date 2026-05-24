import { serializeCountry } from './aiApi.js';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function post(path, body, timeoutMs = 90000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    throw new Error(data.error || `请求失败 (${res.status})`);
  }
  return data;
}

export async function generatePersonas({ researchTopic, audienceCriteria, personaCount, country }) {
  const data = await post('/api/simulated-research/personas', {
    researchTopic,
    audienceCriteria,
    personaCount,
    country: serializeCountry(country),
  });
  return data.personas;
}

export async function runInterview({ persona, researchTopic, guideQuestions, country }) {
  const data = await post('/api/simulated-research/interview', {
    persona,
    researchTopic,
    guideQuestions,
    country: serializeCountry(country),
  });
  return data.interview;
}

export async function synthesizeReport({
  researchTopic,
  audienceCriteria,
  personas,
  interviews,
  country,
}) {
  const data = await post(
    '/api/simulated-research/report',
    {
      researchTopic,
      audienceCriteria,
      personas,
      interviews,
      country: serializeCountry(country),
    },
    120000,
  );
  return data.report;
}
