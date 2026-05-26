/**
 * 模拟访谈第三步：整场访谈只扣费一次（serverless 多请求共用 batchId）
 */
import { randomUUID } from 'crypto';
import { runDbUpdate } from '../db/engine.js';
import { chargeForOperation, refundOperation } from './billing.js';

const BATCH_TTL_MS = 2 * 60 * 60 * 1000;

function pruneBatches(db) {
  const now = Date.now();
  db.simInterviewBatches = (db.simInterviewBatches || []).filter((b) => b.expiresAt > now);
}

export function createInterviewBatchId() {
  return randomUUID();
}

export async function ensureSimInterviewBatchPaid(userId, batchId) {
  if (!batchId) {
    const id = createInterviewBatchId();
    const charged = await chargeForOperation(userId, 'sim_interview');
    await runDbUpdate((db) => {
      pruneBatches(db);
      db.simInterviewBatches = db.simInterviewBatches || [];
      db.simInterviewBatches.push({
        userId,
        batchId: id,
        expiresAt: Date.now() + BATCH_TTL_MS,
        costCents: charged.costCents,
      });
    });
    return { batchId: id, charged, reused: false };
  }

  const existing = await runDbUpdate((db) => {
    pruneBatches(db);
    return (db.simInterviewBatches || []).find(
      (b) => b.userId === userId && b.batchId === batchId && b.expiresAt > Date.now(),
    );
  });

  if (existing) {
    return { batchId, charged: { costCents: 0, skipped: true }, reused: true };
  }

  const charged = await chargeForOperation(userId, 'sim_interview');
  await runDbUpdate((db) => {
    pruneBatches(db);
    db.simInterviewBatches = db.simInterviewBatches || [];
    db.simInterviewBatches.push({
      userId,
      batchId,
      expiresAt: Date.now() + BATCH_TTL_MS,
      costCents: charged.costCents,
    });
  });
  return { batchId, charged, reused: false };
}

export async function refundSimInterviewBatch(userId, batchId) {
  if (!batchId) return null;
  const row = await runDbUpdate((db) => {
    pruneBatches(db);
    const idx = (db.simInterviewBatches || []).findIndex(
      (b) => b.userId === userId && b.batchId === batchId,
    );
    if (idx < 0) return null;
    const [item] = db.simInterviewBatches.splice(idx, 1);
    return item;
  });
  if (!row?.costCents) return null;
  return refundOperation(userId, row.costCents, 'sim_interview', 'batch_failed');
}
