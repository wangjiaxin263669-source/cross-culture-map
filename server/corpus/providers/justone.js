/**
 * Just One API · 小红书笔记 / 微博关键词 等内容检索（需购买 token）
 * 文档：https://docs.justoneapi.com
 */
const BASE =
  process.env.JUSTONE_API_BASE?.trim() ||
  process.env.XHS_NOTES_API_BASE?.trim() ||
  'https://api.justoneapi.com';

function getToken() {
  return (
    process.env.JUSTONE_API_TOKEN?.trim() ||
    process.env.XHS_NOTES_API_TOKEN?.trim() ||
    process.env.JUSTONE_API_KEY?.trim()
  );
}

export function getJustOneStatus() {
  const token = getToken();
  return {
    platform: 'justone',
    label: 'Just One API（小红书笔记/微博搜索）',
    configured: Boolean(token),
    connected: Boolean(token),
    base: BASE,
    docs: 'https://docs.justoneapi.com/zh/api/xiaohongshu-rednote/note-search-v3',
    note: '非小红书官方，为合规第三方数据接口；适合模拟调研语料抓取',
  };
}

function mapXhsNote(item) {
  const note = item?.note_card || item?.note || item;
  const user = note?.user || item?.user;
  return {
    source: 'xiaohongshu',
    sourceLabel: '小红书·Just One API',
    title: note?.display_title || note?.title || item?.title || '笔记',
    content:
      note?.desc ||
      note?.content ||
      item?.desc ||
      item?.snippet ||
      (note?.interact_info
        ? `互动：赞${note.interact_info.liked_count || 0} 藏${note.interact_info.collected_count || 0}`
        : ''),
    author: user?.nickname || user?.nick_name || item?.author || '小红书用户',
    url: item?.share_url || item?.url || note?.share_info?.link || 'https://www.xiaohongshu.com',
    fromOfficialApi: false,
    provider: 'justone',
  };
}

async function fetchJson(url, timeoutMs = 60000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const data = await res.json();
    return data;
  } finally {
    clearTimeout(timer);
  }
}

/** 小红书笔记搜索 V3 */
export async function searchXhsNotes({ query, page = 1, sort = 'general' }) {
  const token = getToken();
  if (!token) return [];

  const params = new URLSearchParams({
    token,
    keyword: query,
    page: String(page),
    sort,
    noteType: '_0',
  });
  const url = `${BASE}/api/xiaohongshu/search-note/v3?${params}`;
  const data = await fetchJson(url);

  if (data.code !== 0 && data.code !== undefined) {
    throw new Error(data.message || data.msg || `Just One 小红书搜索失败 (code=${data.code})`);
  }

  const list =
    data.data?.items ||
    data.data?.notes ||
    data.data?.data?.items ||
    (Array.isArray(data.data) ? data.data : []);

  return (list || []).slice(0, 8).map(mapXhsNote).filter((s) => s.content || s.title);
}

/** 微博关键词搜索 V2 */
export async function searchWeiboPosts({ query }) {
  const token = getToken();
  if (!token) return [];

  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const fmt = (d) => d.toISOString().slice(0, 10);

  const params = new URLSearchParams({
    token,
    q: query,
    startDay: fmt(weekAgo),
    startHour: '0',
    endDay: fmt(today),
    endHour: '23',
    hotSort: 'true',
  });
  const url = `${BASE}/api/weibo/search-all/v2?${params}`;
  const data = await fetchJson(url);

  if (data.code !== 0 && data.code !== undefined) {
    throw new Error(data.message || `Just One 微博搜索失败 (code=${data.code})`);
  }

  const list = data.data?.list || data.data?.statuses || data.data || [];
  const arr = Array.isArray(list) ? list : [];

  return arr.slice(0, 6).map((item) => ({
    source: 'weibo',
    sourceLabel: '微博·Just One API',
    title: (item.text || item.content || '').slice(0, 60) || '微博',
    content: (item.text || item.content || '').slice(0, 280),
    author: item.user?.screen_name || item.user?.name || '微博用户',
    url: item.id ? `https://weibo.com/detail/${item.id}` : 'https://weibo.com',
    fromOfficialApi: false,
    provider: 'justone',
  }));
}

export async function searchZhihuViaJustOne({ query }) {
  const token = getToken();
  if (!token) return [];
  const params = new URLSearchParams({ token, keyword: query, page: '1' });
  const url = `${BASE}/api/zhihu/search/v1?${params}`;
  try {
    const data = await fetchJson(url);
    if (data.code !== 0 && data.code !== undefined) return [];
    const list = data.data?.items || data.data || [];
    return (Array.isArray(list) ? list : []).slice(0, 5).map((item) => ({
      source: 'zhihu',
      sourceLabel: '知乎·Just One API',
      title: item.title || item.question?.title || '知乎',
      content: (item.excerpt || item.content || '').slice(0, 280),
      author: item.author?.name || '知乎用户',
      url: item.url || 'https://www.zhihu.com',
      provider: 'justone',
    }));
  } catch {
    return [];
  }
}
