import {
  findUserById,
  getUserBalanceCents,
  chargeUserBalance,
  refundUserBalance,
} from '../db/store.js';
import { WALLET_COSTS } from './config.js';

export class InsufficientBalanceError extends Error {
  constructor(balanceCents, costCents) {
    super(`余额不足：当前 ¥${(balanceCents / 100).toFixed(2)}，本次需要 ¥${(costCents / 100).toFixed(2)}`);
    this.name = 'InsufficientBalanceError';
    this.balanceCents = balanceCents;
    this.costCents = costCents;
    this.statusCode = 402;
  }
}

export function getCostCents(operation) {
  const cost = WALLET_COSTS[operation];
  if (cost == null) throw new Error(`未知计费类型: ${operation}`);
  return cost;
}

/** 扣费；失败抛 InsufficientBalanceError */
export function chargeForOperation(userId, operation, meta = {}) {
  const costCents = getCostCents(operation);
  const balanceBefore = getUserBalanceCents(userId);
  if (balanceBefore < costCents) {
    throw new InsufficientBalanceError(balanceBefore, costCents);
  }
  const tx = chargeUserBalance(userId, costCents, {
    type: 'consume',
    operation,
    ...meta,
  });
  return { costCents, balanceCents: tx.balanceAfter, transactionId: tx.id };
}

/** AI 调用失败时退回 */
export function refundOperation(userId, costCents, operation, reason = 'api_failed') {
  if (!costCents || costCents <= 0) return null;
  return refundUserBalance(userId, costCents, {
    type: 'refund',
    operation,
    reason,
  });
}

export function getWalletSnapshot(userId) {
  const user = findUserById(userId);
  if (!user) return null;
  return {
    balanceCents: getUserBalanceCents(userId),
    balanceYuan: (getUserBalanceCents(userId) / 100).toFixed(2),
    costs: WALLET_COSTS,
  };
}
