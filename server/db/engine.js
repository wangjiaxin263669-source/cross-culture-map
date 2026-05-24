/**
 * 持久化引擎（按优先级）：
 * 1. 本地文件 — npm run dev
 * 2. PostgreSQL — Netlify DB / Neon（DATABASE_URL，线上推荐）
 * 3. Netlify Blobs — 备用
 */
import fs from 'fs';
import path from 'path';
import { getServerDir } from '../paths.js';
import { usePostgres, readDbPostgres, writeDbPostgres } from './postgres.js';

export const EMPTY_DB = {
  users: [],
  chatSessions: [],
  reports: [],
  rechargeOrders: [],
  walletTransactions: [],
};

const BLOB_STORE = 'cross-culture-platform';
const BLOB_KEY = 'platform-db';
const FILE_NAME = 'platform-db.json';

let writeQueue = Promise.resolve();

function normalizeDb(raw) {
  if (!raw || typeof raw !== 'object') return structuredClone(EMPTY_DB);
  return {
    users: raw.users || [],
    chatSessions: raw.chatSessions || [],
    reports: raw.reports || [],
    rechargeOrders: raw.rechargeOrders || [],
    walletTransactions: raw.walletTransactions || [],
  };
}

function isLambda() {
  return Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function useFileStorage() {
  if (process.env.STORAGE_BACKEND === 'postgres') return false;
  if (process.env.STORAGE_BACKEND === 'blobs') return false;
  if (process.env.STORAGE_BACKEND === 'file') return true;
  if (!isLambda()) return true;
  if (process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL) return false;
  return false;
}

function useNetlifyBlobs() {
  if (useFileStorage() || usePostgres()) return false;
  if (process.env.STORAGE_BACKEND === 'blobs') return isLambda();
  if (!isLambda()) return false;
  return Boolean(process.env.NETLIFY || process.env.SITE_ID || process.env.NETLIFY_BLOBS_CONTEXT);
}

export function getStorageBackend() {
  if (useFileStorage()) return 'file';
  if (usePostgres()) return 'postgres';
  if (useNetlifyBlobs()) return 'netlify-blobs';
  return 'none';
}

export function isDbWritable() {
  const backend = getStorageBackend();
  return backend !== 'none';
}

function filePath() {
  return path.join(getServerDir(), 'data', FILE_NAME);
}

function readDbFile() {
  const p = filePath();
  if (!fs.existsSync(p)) return structuredClone(EMPTY_DB);
  try {
    return normalizeDb(JSON.parse(fs.readFileSync(p, 'utf-8')));
  } catch {
    return structuredClone(EMPTY_DB);
  }
}

function writeDbFile(data) {
  const p = filePath();
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
}

async function configureBlobContext() {
  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
  const token =
    process.env.NETLIFY_AUTH_TOKEN ||
    process.env.NETLIFY_API_TOKEN ||
    process.env.NETLIFY_PAT;
  if (!siteID || !token) return;
  const { setEnvironmentContext } = await import('@netlify/blobs');
  setEnvironmentContext({
    siteID,
    token,
    edgeURL: 'https://api.netlify.com',
    deployID: process.env.DEPLOY_ID || process.env.CONTEXT || 'production',
  });
}

async function getBlobStore() {
  await configureBlobContext();
  const { getStore } = await import('@netlify/blobs');
  return getStore({ name: BLOB_STORE, consistency: 'strong' });
}

async function readDbBlobs() {
  const store = await getBlobStore();
  const data = await store.get(BLOB_KEY, { type: 'json' });
  return normalizeDb(data);
}

async function writeDbBlobs(data) {
  const store = await getBlobStore();
  await store.setJSON(BLOB_KEY, data);
}

export async function readDb() {
  if (useFileStorage()) return readDbFile();
  if (usePostgres()) {
    try {
      return await readDbPostgres();
    } catch (err) {
      console.error('[db] postgres read failed:', err.message);
      throw new Error('数据库连接失败，请在 Netlify 启用 Netlify DB 扩展');
    }
  }
  if (useNetlifyBlobs()) {
    try {
      return await readDbBlobs();
    } catch (err) {
      console.error('[db] blobs read failed:', err.message);
      throw new Error(
        '数据存储未配置。请在 Netlify 控制台启用 Extensions → Netlify DB（免费），或本地使用 npm run dev',
      );
    }
  }
  throw new Error('未配置数据存储');
}

export async function writeDb(data) {
  const run = async () => {
    if (useFileStorage()) {
      writeDbFile(data);
      return;
    }
    if (usePostgres()) {
      await writeDbPostgres(data);
      return;
    }
    if (useNetlifyBlobs()) {
      await writeDbBlobs(data);
      return;
    }
    throw new Error('未配置数据存储');
  };
  writeQueue = writeQueue.then(run, run);
  return writeQueue;
}
