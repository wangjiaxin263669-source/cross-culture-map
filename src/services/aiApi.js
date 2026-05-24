import { getAuthHeaders } from './authApi.js';

const API_BASE = import.meta.env.VITE_API_URL || '';

function apiErrorHint(status, path = '') {
  const isReport = path.includes('/report');
  if (status === 502 || status === 504) {
    return (
      (isReport ? '报告' : '对话') +
      '超时或后端未响应（' +
      status +
      '）。请确认：① 本地运行 npm run dev，打开终端端口（常见 http://localhost:5174，勿用 5173）；' +
      '② 若刚改过代码请 Ctrl+C 后重新 npm run dev；' +
      '③ 线上 Netlify 环境变量 DEEPSEEK_API_KEY；④ 等待约 15–45 秒后重试'
    );
  }
  if (status === 0) {
    return '无法连接后端。请运行 npm run dev，不要只打开 dist 文件夹或错误端口。';
  }
  return `请求失败 (${status})，请确认已运行 npm run dev`;
}

async function request(path, body, { timeoutMs = 90000 } = {}) {
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
      throw new Error(
        path.includes('/report')
          ? '报告请求超时（120秒）。请缩短产品描述后重试，或重启 npm run dev。'
          : '对话请求超时（90秒）。请稍后重试，或重启 npm run dev。',
      );
    }
    throw new Error(apiErrorHint(0));
  } finally {
    clearTimeout(timer);
  }

  let data = {};
  try {
    data = await res.json();
  } catch {
    /* 非 JSON 响应（如 Netlify 504 HTML） */
  }
  if (!res.ok) {
    if (res.status === 402) {
      const err = new Error(data.error || '余额不足，请先充值');
      err.code = 'INSUFFICIENT_BALANCE';
      err.status = 402;
      throw err;
    }
    throw new Error(data.error || apiErrorHint(res.status, path));
  }
  return data;
}

/** 将选中国家对象精简后传给后端（控制体积，避免 Netlify 超时） */
export function serializeCountry(country) {
  if (!country) return null;
  const displayTitle =
    country.displayTitle ||
    (country.parentTitle && country.marketType === 'region'
      ? `${country.parentTitle} · ${country.title}`
      : country.title);
  const story = country.culturalStory;
  const slimStory = story
    ? {
        title: story.title,
        paragraphs: (story.paragraphs || []).slice(0, 2),
        designLink: story.designLink,
      }
    : undefined;
  return {
    label: country.label,
    title: country.title,
    displayTitle,
    marketType: country.marketType || 'country',
    parentId: country.parentId,
    parentTitle: country.parentTitle,
    tagline: country.tagline,
    overview: country.overview,
    density: country.density,
    radarData: country.radarData,
    culturalStory: slimStory,
    methodology: country.methodology?.steps
      ? { intro: country.methodology.intro, steps: country.methodology.steps.slice(0, 4) }
      : undefined,
    references: (country.references || []).slice(0, 4),
    videos: (country.videos || []).slice(0, 3),
  };
}

export async function sendChatMessage({ message, history, country }) {
  const data = await request(
    '/api/chat',
    {
      message,
      history,
      country: serializeCountry(country),
    },
    { timeoutMs: 90000 },
  );
  return data.reply;
}

export async function generateReport({ productIdea, country }) {
  const data = await request(
    '/api/report',
    {
      productIdea,
      country: serializeCountry(country),
    },
    { timeoutMs: 120000 },
  );
  return data.report;
}

export async function checkAiHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}
