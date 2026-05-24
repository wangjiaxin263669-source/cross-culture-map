/**
 * 人设库 / 调研会话（本地文件存储，开发环境可多端同步）
 */
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { getServerDir } from './paths.js';

const STORE_PATH = path.join(getServerDir(), 'data', 'persona-library.json');

const EMPTY = { personas: [], sessions: [] };

function readStore() {
  if (!fs.existsSync(STORE_PATH)) return { ...EMPTY };
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
  } catch {
    return { ...EMPTY };
  }
}

function writeStore(data) {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function listPersonaLibrary() {
  const store = readStore();
  return {
    personas: (store.personas || []).sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || '')),
    sessions: (store.sessions || []).sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || '')),
  };
}

export function savePersona(entry) {
  const store = readStore();
  const item = {
    id: entry.id || randomUUID(),
    savedAt: new Date().toISOString(),
    ...entry,
  };
  const idx = store.personas.findIndex((p) => p.id === item.id);
  if (idx >= 0) store.personas[idx] = item;
  else store.personas.push(item);
  writeStore(store);
  return item;
}

export function deletePersona(id) {
  const store = readStore();
  store.personas = store.personas.filter((p) => p.id !== id);
  writeStore(store);
}

export function saveSession(entry) {
  const store = readStore();
  const item = {
    id: entry.id || randomUUID(),
    savedAt: new Date().toISOString(),
    ...entry,
  };
  const idx = store.sessions.findIndex((s) => s.id === item.id);
  if (idx >= 0) store.sessions[idx] = item;
  else store.sessions.push(item);
  writeStore(store);
  return item;
}

export function deleteSession(id) {
  const store = readStore();
  store.sessions = store.sessions.filter((s) => s.id !== id);
  writeStore(store);
}
