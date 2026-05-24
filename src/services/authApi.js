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

export async function sendSmsCode({ phone, purpose = 'login' }) {
  return authFetch('/api/auth/sms/send', {
    method: 'POST',
    body: JSON.stringify({ phone, purpose }),
  });
}

export async function smsLogin({ phone, code }) {
  const data = await authFetch('/api/auth/sms/login', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
  setToken(data.token);
  return data;
}

export async function legacyBindPhone({ username, password, phone, code }) {
  const data = await authFetch('/api/auth/legacy/bind-phone', {
    method: 'POST',
    body: JSON.stringify({ username, password, phone, code }),
  });
  setToken(data.token);
  return data;
}

export async function bindPhone({ phone, code }) {
  const data = await authFetch('/api/auth/bind-phone', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
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
