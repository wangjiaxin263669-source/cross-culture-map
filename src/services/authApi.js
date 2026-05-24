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
    throw new Error(data.error || `请求失败 (${res.status})`);
  }
  return data;
}

export async function register({ nickname, phone, password, confirmPassword }) {
  const data = await authFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      nickname,
      displayName: nickname,
      phone,
      password,
      confirmPassword,
    }),
  });
  setToken(data.token);
  return data;
}

export async function login({ phone, password }) {
  const data = await authFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  });
  setToken(data.token);
  return data;
}

export async function fetchMe() {
  return authFetch('/api/auth/me');
}

export function logout() {
  setToken(null);
}
