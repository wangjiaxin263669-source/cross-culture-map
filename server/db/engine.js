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
  otpRecords: [],
  smsSettings: null,
  simInterviewBatches: [],
  simResearchSessions: [],
  deviceRegistrations: [],
};

const BLOB_STORE = 'cross-culture-platform';
const BLOB_KEY = 'platform-db';
const PHONE_INDEX_PREFIX = 'user-phone:';
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
    otpRecords: raw.otpRecords || [],
    smsSettings: raw.smsSettings || null,
    simInterviewBatches: raw.simInterviewBatches || [],
    simResearchSessions: raw.simResearchSessions || [],
    deviceRegistrations: raw.deviceRegistrations || [],
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** @param {{ strong?: boolean }} [opts] */
async function getBlobStore(opts = {}) {
  await ensureBlobsReady(getLambdaEvent());
  const { getStore } = await import('@netlify/blobs');
  const wantStrong = opts.strong !== false && isLambda();
  try {
    return getStore({
      name: BLOB_STORE,
      consistency: wantStrong ? 'strong' : 'eventual',
    });
  } catch (err) {
    if (wantStrong) {
      console.warn('[db] blobs strong unavailable, fallback eventual:', err.message);
      return getStore({ name: BLOB_STORE, consistency: 'eventual' });
    }
    throw err;
  }
}

/** @param {{ strong?: boolean }} [opts] */
async function readDbBlobs(opts = {}) {
  const store = await getBlobStore(opts);
  const data = await store.get(BLOB_KEY, { type: 'json' });
  return normalizeDb(data);
}

async function writeDbBlobs(data, opts = {}) {
  const store = await getBlobStore(opts);
  await store.setJSON(BLOB_KEY, data);
}

/** 手机号独立索引：跨 Lambda / 最终一致主库下仍可登录 */
export async function writeUserPhoneIndex(user) {
  if (!isLambda() && useFileStorage()) return;
  if (!user?.phone || !user.phoneVerified) return;
  try {
    const store = await getBlobStore({ strong: true });
    await store.setJSON(`${PHONE_INDEX_PREFIX}${user.phone}`, {
      id: user.id,
      username: user.username,
      usernameLower: user.usernameLower,
      displayName: user.displayName,
      phone: user.phone,
      phoneVerified: true,
      passwordHash: user.passwordHash,
      balanceCents: user.balanceCents ?? 0,
      dailyBonusExpirableCents: user.dailyBonusExpirableCents ?? 0,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.warn('[db] phone index write:', err.message);
  }
}

export async function readUserPhoneIndex(phone) {
  if (!phone) return null;
  if (!isLambda() && useFileStorage()) return null;
  try {
    const store = await getBlobStore({ strong: true });
    const row = await store.get(`${PHONE_INDEX_PREFIX}${phone}`, { type: 'json' });
    return row && row.phoneVerified ? row : null;
  } catch {
    return null;
  }
}

/**
 * 读库（auth 等关键路径用 strong + 重试，避免跨设备登录读不到刚注册用户）
 * @param {{ strong?: boolean, retries?: number }} [opts]
 */
export async function readDb(opts = {}) {
  if (useFileStorage()) return readDbFile();

  if (usePostgres() && hasPostgresUrl()) {
    try {
      let data = await readDbPostgres();
      if ((data.users?.length || 0) === 0 && (isLambda() || useNetlifyBlobs())) {
        try {
          const legacy = await readDbBlobs({ strong: true });
          if ((legacy.users?.length || 0) > 0) {
            await writeDbPostgres(legacy);
            data = legacy;
            console.log('[db] migrated netlify-blobs → postgres, users:', legacy.users.length);
          }
        } catch (err) {
          console.warn('[db] blobs→postgres migration skipped:', err.message);
        }
      }
      return data;
    } catch (err) {
      console.warn('[db] postgres unavailable, fallback blobs:', err.message);
    }
  }

  if (useNetlifyBlobs() || isLambda()) {
    const retries = opts.retries ?? (opts.strong ? 5 : 1);
    let lastErr;
    for (let i = 0; i < retries; i += 1) {
      try {
        return await readDbBlobs({ strong: opts.strong !== false });
      } catch (err) {
        lastErr = err;
        if (i < retries - 1) await sleep(80 * (i + 1));
      }
    }
    console.warn('[db] blobs read empty start:', lastErr?.message);
    return structuredClone(EMPTY_DB);
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
  for (let i = 0; i < 5; i += 1) {
    try {
      await ensureBlobsReady(getLambdaEvent());
      await writeDbBlobs(data, { strong: true });
      if (isLambda()) {
        await sleep(60 + i * 80);
        const verify = await readDbBlobs({ strong: true });
        if ((verify.users?.length || 0) >= (data.users?.length || 0)) {
          return;
        }
        throw new Error('blobs write verify mismatch');
      }
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
    const maxAttempts = isLambda() ? 6 : 1;
    let lastErr;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const db = await readDb({ strong: isLambda(), retries: 3 });
        result = await mutator(db);
        await persistDb(db);
        return result;
      } catch (err) {
        lastErr = err;
        if (attempt < maxAttempts - 1 && isLambda()) {
          await sleep(120 * (attempt + 1));
          continue;
        }
        throw err;
      }
    }
    throw lastErr || new Error('数据更新失败');
  };
  writeQueue = writeQueue.then(run, run);
  await writeQueue;
  return result;
}

/** 登录/找回密码：跨 Lambda 实例读取用户，带退避重试 */
export async function waitForUserByPhone(phone, { maxAttempts = 20, intervalMs = 250 } = {}) {
  const key = String(phone).trim();
  for (let i = 0; i < maxAttempts; i += 1) {
    const db = await readDb({ strong: true, retries: 3 });
    const user = db.users.find((u) => u.phone === key && u.phoneVerified) || null;
    if (user) return user;
    const indexed = await readUserPhoneIndex(key);
    if (indexed) return indexed;
    if (i < maxAttempts - 1) await sleep(intervalMs);
  }
  return null;
}

export async function waitForUserById(userId, { maxAttempts = 12, intervalMs = 150 } = {}) {
  const id = String(userId || '').trim();
  if (!id) return null;
  for (let i = 0; i < maxAttempts; i += 1) {
    const db = await readDb({ strong: true, retries: 3 });
    const user = db.users.find((u) => u.id === id) || null;
    if (user) return user;
    if (i < maxAttempts - 1) await sleep(intervalMs);
  }
  return null;
}
