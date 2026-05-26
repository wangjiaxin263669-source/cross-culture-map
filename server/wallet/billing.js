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

export async function chargeForOperation(userId, operation, meta = {}) {
  const costCents = getCostCents(operation);
  const balanceBefore = await getUserBalanceCents(userId);

  /** 0 元计费项跳过扣款 */
  if (costCents <= 0) {
    return {
      costCents: 0,
      balanceCents: balanceBefore,
      transactionId: null,
      skipped: true,
    };
  }

  if (balanceBefore < costCents) {
    throw new InsufficientBalanceError(balanceBefore, costCents);
  }
  const tx = await chargeUserBalance(userId, costCents, {
    type: 'consume',
    operation,
    ...meta,
  });
  return { costCents, balanceCents: tx.balanceAfter, transactionId: tx.id };
}

export async function refundOperation(userId, costCents, operation, reason = 'api_failed') {
  if (!costCents || costCents <= 0) return null;
  return refundUserBalance(userId, costCents, {
    type: 'refund',
    operation,
    reason,
  });
}

export async function getWalletSnapshot(userId) {
  const user = await findUserById(userId);
  if (!user) return null;
  const balanceCents = await getUserBalanceCents(userId);
  return {
    balanceCents,
    balanceYuan: (balanceCents / 100).toFixed(2),
    costs: WALLET_COSTS,
  };
}
