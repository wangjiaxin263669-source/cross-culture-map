const API_BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'cc_auth_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function authFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const err = new Error(data.error || `请求失败 (${res.status})`);
    err.code = data.code;
    err.requiresPhoneBinding = data.requiresPhoneBinding;
    throw err;
  }
  return data;
}

export async function login({ username, password }) {
  const data = await authFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  return data;
}

/** 本地开发：未配置微信时一键登录 */
export async function devLogin() {
  const data = await authFetch('/api/auth/dev/login', { method: 'POST', body: '{}' });
  setToken(data.token);
  return data;
}

export async function fetchMe() {
  return authFetch('/api/auth/me');
}

export async function getWechatLoginUrl() {
  return authFetch('/api/auth/wechat/url');
}

export function logout() {
  setToken(null);
}
