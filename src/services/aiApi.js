const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    /* 非 JSON 响应 */
  }
  if (!res.ok) {
    const hint =
      res.status === 502
        ? '后端服务异常（502）。线上站请检查 Netlify 函数日志；本地请用 npm run dev 并打开终端里显示的端口（如 http://localhost:5174）'
        : `请求失败 (${res.status})，请确认已运行 npm run dev`;
    throw new Error(data.error || hint);
  }
  return data;
}

/** 将选中国家对象精简后传给后端（避免过大 payload） */
export function serializeCountry(country) {
  if (!country) return null;
  return {
    label: country.label,
    title: country.title,
    tagline: country.tagline,
    overview: country.overview,
    density: country.density,
    radarData: country.radarData,
    culturalStory: country.culturalStory,
    videos: country.videos,
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
  const data = await request('/api/report', {
    productIdea,
    country: serializeCountry(country),
  });
  return data.report;
}

export async function checkAiHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}
