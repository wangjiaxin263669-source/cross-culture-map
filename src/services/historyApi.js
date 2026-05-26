import { getAuthHeaders } from './authApi.js';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function api(path, options = {}) {
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

export async function listChatSessions() {
  const data = await api('/api/auth/history/chats');
  return data.sessions || [];
}

export async function getChatSession(id) {
  const data = await api(`/api/auth/history/chats/${id}`);
  return data.session;
}

export async function saveChatSession(payload) {
  const data = await api('/api/auth/history/chats', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.session;
}

export async function listReports() {
  const data = await api('/api/auth/history/reports');
  return data.reports || [];
}

export async function getReport(id) {
  const data = await api(`/api/auth/history/reports/${id}`);
  return data.report;
}

export async function saveReport(payload) {
  const data = await api('/api/auth/history/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.report;
}

export async function listSimResearchSessions() {
  const data = await api('/api/auth/history/sim-sessions');
  return data.sessions || [];
}

export async function getSimResearchSession(id) {
  const data = await api(`/api/auth/history/sim-sessions/${id}`);
  return data.session;
}

export async function saveSimResearchSession(payload) {
  const data = await api('/api/auth/history/sim-sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.session;
}

export async function deleteChatSession(id) {
  await api(`/api/auth/history/chats/${id}`, { method: 'DELETE' });
}

export async function deleteReport(id) {
  await api(`/api/auth/history/reports/${id}`, { method: 'DELETE' });
}

export async function deleteSimResearchSession(id) {
  await api(`/api/auth/history/sim-sessions/${id}`, { method: 'DELETE' });
}
