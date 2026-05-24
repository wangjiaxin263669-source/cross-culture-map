const API_BASE = import.meta.env.VITE_API_URL || '';

function apiErrorHint(status) {
  if (status === 502 || status === 504) {
    return (
      '报告生成超时或后端未响应（' +
      status +
      '）。请确认：① 本地已运行 npm run dev 并打开终端显示的端口（如 http://localhost:5174）；' +
      '② 线上站 Netlify 已配置 DEEPSEEK_API_KEY；③ 稍后重试（报告约需 20–40 秒）'
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('请求超时（90秒）。报告内容较多时请稍后重试，或缩短产品描述。');
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
    throw new Error(data.error || apiErrorHint(res.status));
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
  const data = await request('/api/chat', {
    message,
    history,
    country: serializeCountry(country),
  });
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
