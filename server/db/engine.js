/**
 * 持久化引擎：
 * - 本地 npm run dev → JSON 文件
 * - Netlify 线上 → Netlify Blobs（需 connectLambda）
 */
import fs from 'fs';
import path from 'path';
import { getServerDir } from '../paths.js';

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

/** 本地开发一律用文件；仅 Lambda（Netlify Functions）用 Blobs */
export function useNetlifyBlobs() {
  if (process.env.STORAGE_BACKEND === 'file') return false;
  if (!isLambda()) return false;
  if (process.env.STORAGE_BACKEND === 'blobs') return true;
  return Boolean(process.env.NETLIFY || process.env.SITE_ID || process.env.NETLIFY_BLOBS_CONTEXT);
}

export function getStorageBackend() {
  return useNetlifyBlobs() ? 'netlify-blobs' : 'file';
}

export function isDbWritable() {
  if (useNetlifyBlobs()) return true;
  if (process.env.FORCE_FILE_DB === '1') return true;
  return !isLambda();
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
  const { getStore } = await import('@netlify/blobs');

  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
  const token =
    process.env.NETLIFY_AUTH_TOKEN ||
    process.env.NETLIFY_API_TOKEN ||
    process.env.NETLIFY_PAT;

  if (siteID && token) {
    return getStore({ name: BLOB_STORE, siteID, token, consistency: 'strong' });
  }

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
  if (useNetlifyBlobs()) {
    try {
      return await readDbBlobs();
    } catch (err) {
      console.error('[db] Netlify Blobs read failed:', err.message);
      throw new Error(
        '数据存储暂时不可用。若为本机开发请使用 npm run dev；若为线上站点请重新部署后再试。',
      );
    }
  }
  return readDbFile();
}

export async function writeDb(data) {
  const run = async () => {
    if (useNetlifyBlobs()) {
      await writeDbBlobs(data);
    } else {
      writeDbFile(data);
    }
  };
  writeQueue = writeQueue.then(run, run);
  return writeQueue;
}
