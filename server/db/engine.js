/**
 * 持久化：本地文件 / Netlify Blobs（免费，无需 Netlify DB 扩展）/ Postgres（可选）
 */
import fs from 'fs';
import path from 'path';
import { getServerDir } from '../paths.js';
import { ensureBlobsReady, getLambdaEvent } from './blobContext.js';
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

function hasPostgresUrl() {
  return Boolean(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL);
}

function useFileStorage() {
  if (process.env.STORAGE_BACKEND === 'file') return true;
  if (process.env.STORAGE_BACKEND === 'blobs') return false;
  if (process.env.STORAGE_BACKEND === 'postgres') return false;
  return !isLambda();
}

function useNetlifyBlobs() {
  if (useFileStorage()) return false;
  if (process.env.STORAGE_BACKEND === 'file') return false;
  if (!isLambda()) return false;
  if (process.env.STORAGE_BACKEND === 'postgres' && hasPostgresUrl()) return false;
  return true;
}

export function getStorageBackend() {
  if (useFileStorage()) return 'file';
  if (usePostgres() && hasPostgresUrl()) return 'postgres';
  if (useNetlifyBlobs()) return 'netlify-blobs';
  return isLambda() ? 'netlify-blobs' : 'file';
}

/** 线上 Lambda 一律允许读写（自动走 Blobs） */
export function isDbWritable() {
  if (useFileStorage()) return true;
  if (isLambda()) return true;
  if (usePostgres() && hasPostgresUrl()) return true;
  return true;
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

async function getBlobStore() {
  await ensureBlobsReady(getLambdaEvent());
  const { getStore } = await import('@netlify/blobs');
  // eventual：无需 uncachedEdgeURL，适合账号/历史这类键值存储
  return getStore({ name: BLOB_STORE, consistency: 'eventual' });
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

  if (usePostgres() && hasPostgresUrl()) {
    try {
      return await readDbPostgres();
    } catch (err) {
      console.warn('[db] postgres unavailable, fallback blobs:', err.message);
    }
  }

  if (useNetlifyBlobs() || isLambda()) {
    try {
      return await readDbBlobs();
    } catch (err) {
      console.warn('[db] blobs read empty start:', err.message);
      return structuredClone(EMPTY_DB);
    }
  }

  return readDbFile();
}

async function persistDb(data) {
  if (useFileStorage()) {
    writeDbFile(data);
    return;
  }

  if (usePostgres() && hasPostgresUrl()) {
    try {
      await writeDbPostgres(data);
      return;
    } catch (err) {
      console.warn('[db] postgres write failed, try blobs:', err.message);
    }
  }

  let lastErr;
  for (let i = 0; i < 3; i += 1) {
    try {
      await ensureBlobsReady(getLambdaEvent());
      await writeDbBlobs(data);
      return;
    } catch (err) {
      lastErr = err;
      console.warn(`[db] blobs write retry ${i + 1}:`, err.message);
    }
  }

  if (useFileStorage() || !isLambda()) {
    writeDbFile(data);
    return;
  }
  throw lastErr || new Error('数据保存失败，请稍后重试');
}

export async function writeDb(data) {
  const run = () => persistDb(data);
  writeQueue = writeQueue.then(run, run);
  return writeQueue;
}

/** 串行读-改-写，避免 Blobs 下连续两次 write 之间 read 到旧数据 */
export async function runDbUpdate(mutator) {
  let result;
  const run = async () => {
    const db = await readDb();
    result = await mutator(db);
    await persistDb(db);
    return result;
  };
  writeQueue = writeQueue.then(run, run);
  await writeQueue;
  return result;
}
