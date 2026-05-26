import { neon } from '@neondatabase/serverless';

const EMPTY_DB = {
  users: [],
  chatSessions: [],
  reports: [],
  rechargeOrders: [],
  walletTransactions: [],
  simResearchSessions: [],
  simInterviewBatches: [],
};

let sqlClient = null;

export function usePostgres() {
  if (process.env.STORAGE_BACKEND === 'file') return false;
  if (process.env.STORAGE_BACKEND === 'postgres') return true;
  return Boolean(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL);
}

function getSql() {
  const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  if (!url) return null;
  if (!sqlClient) sqlClient = neon(url);
  return sqlClient;
}

function normalizeDb(raw) {
  if (!raw || typeof raw !== 'object') return structuredClone(EMPTY_DB);
  return {
    users: raw.users || [],
    chatSessions: raw.chatSessions || [],
    reports: raw.reports || [],
    rechargeOrders: raw.rechargeOrders || [],
    walletTransactions: raw.walletTransactions || [],
    simResearchSessions: raw.simResearchSessions || [],
    simInterviewBatches: raw.simInterviewBatches || [],
  };
}

async function ensureTable() {
  const sql = getSql();
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS platform_kv (
      id INTEGER PRIMARY KEY DEFAULT 1,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    INSERT INTO platform_kv (id, data)
    VALUES (1, ${JSON.stringify(EMPTY_DB)}::jsonb)
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function readDbPostgres() {
  const sql = getSql();
  if (!sql) throw new Error('未配置 DATABASE_URL');
  await ensureTable();
  const rows = await sql`SELECT data FROM platform_kv WHERE id = 1`;
  if (!rows?.[0]?.data) return structuredClone(EMPTY_DB);
  const data = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
  return normalizeDb(data);
}

export async function writeDbPostgres(data) {
  const sql = getSql();
  if (!sql) throw new Error('未配置 DATABASE_URL');
  await ensureTable();
  const json = JSON.stringify(data);
  await sql`
    INSERT INTO platform_kv (id, data, updated_at)
    VALUES (1, ${json}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
  `;
}
