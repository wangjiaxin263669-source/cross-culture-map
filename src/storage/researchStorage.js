const STORAGE_KEY = 'cross-culture-research-v1';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { personas: [], sessions: [] };
  } catch {
    return { personas: [], sessions: [] };
  }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function uid() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function listPersonas() {
  return load().personas.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
}

export function listSessions() {
  return load().sessions.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
}

export function savePersonaToLibrary({ persona, marketId, marketTitle, researchTopic, corpusSnippets }) {
  const data = load();
  const item = {
    id: uid(),
    savedAt: new Date().toISOString(),
    persona,
    marketId,
    marketTitle,
    researchTopic,
    corpusSnippets: corpusSnippets || [],
  };
  data.personas.unshift(item);
  if (data.personas.length > 50) data.personas.length = 50;
  save(data);
  return item;
}

export function saveSessionToLibrary(session) {
  const data = load();
  const item = {
    id: session.id || uid(),
    savedAt: new Date().toISOString(),
    ...session,
  };
  const idx = data.sessions.findIndex((s) => s.id === item.id);
  if (idx >= 0) data.sessions[idx] = item;
  else data.sessions.unshift(item);
  if (data.sessions.length > 30) data.sessions.length = 30;
  save(data);
  return item;
}

export function deletePersonaFromLibrary(id) {
  const data = load();
  data.personas = data.personas.filter((p) => p.id !== id);
  save(data);
}

export function deleteSessionFromLibrary(id) {
  const data = load();
  data.sessions = data.sessions.filter((s) => s.id !== id);
  save(data);
}

export function getSessionById(id) {
  return load().sessions.find((s) => s.id === id) || null;
}
