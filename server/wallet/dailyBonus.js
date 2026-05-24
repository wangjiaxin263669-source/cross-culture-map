import { runDbUpdate } from '../db/engine.js';
import { randomUUID } from 'crypto';
import { DAILY_LOGIN_BONUS_CENTS } from './config.js';

/** 上海时区当日 YYYY-MM-DD */
export function getTodayShanghai() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
}

function getExpirableCents(user) {
  return Number.isFinite(user.dailyBonusExpirableCents) ? user.dailyBonusExpirableCents : 0;
}

function appendWalletTx(db, tx) {
  db.walletTransactions.push(tx);
  if (db.walletTransactions.length > 5000) {
    db.walletTransactions = db.walletTransactions.slice(-4000);
  }
}

/**
 * 将昨日及更早未用完的每日登录赠送从余额扣除（上海时区次日零点逻辑）
 * @returns {{ expiredCents: number }}
 */
export function expireDailyLoginBonusOnUser(user, today = getTodayShanghai(), db = null) {
  const expirable = getExpirableCents(user);
  const bonusDay = user.lastDailyBonusDate || null;

  if (expirable <= 0 || !bonusDay || bonusDay >= today) {
    return { expiredCents: 0 };
  }

  const before = Number.isFinite(user.balanceCents) ? user.balanceCents : 0;
  const deduct = Math.min(expirable, before);
  user.balanceCents = before - deduct;
  user.dailyBonusExpirableCents = 0;

  if (deduct > 0 && db) {
    appendWalletTx(db, {
      id: randomUUID(),
      userId: user.id,
      type: 'expiry',
      amountCents: -deduct,
      balanceBefore: before,
      balanceAfter: user.balanceCents,
      operation: null,
      orderId: null,
      note: '每日登录赠送未使用，次日零点已清零',
      createdAt: new Date().toISOString(),
    });
  }

  return { expiredCents: deduct };
}

/** 任意读余额/扣费前，先持久化过期结果 */
export async function ensureDailyBonusExpired(userId) {
  return runDbUpdate((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return { expiredCents: 0 };
    return expireDailyLoginBonusOnUser(user, getTodayShanghai(), db);
  });
}

/** 消费时优先扣减当日可过期的赠送余额 */
export function consumeDailyBonusOnUser(user, amountCents) {
  const expirable = getExpirableCents(user);
  const used = Math.min(amountCents, expirable);
  if (used > 0) {
    user.dailyBonusExpirableCents = expirable - used;
  }
  return used;
}

/**
 * 每日首次登录赠送（默认 ¥0.06）；未使用部分在上海时区次日零点清零
 */
export async function tryGrantDailyLoginBonus(userId) {
  if (DAILY_LOGIN_BONUS_CENTS <= 0) {
    return { granted: false, amountCents: 0 };
  }

  const today = getTodayShanghai();

  return runDbUpdate((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return { granted: false, amountCents: 0 };

    const expired = expireDailyLoginBonusOnUser(user, today, db);

    const createdDay = (user.createdAt || '').slice(0, 10);
    if (createdDay === today) {
      return { granted: false, amountCents: 0, reason: 'new_user_day', expiredCents: expired.expiredCents };
    }
    if (user.lastDailyBonusDate === today) {
      return {
        granted: false,
        amountCents: 0,
        reason: 'already_claimed',
        expiredCents: expired.expiredCents,
      };
    }

    const grantCents = DAILY_LOGIN_BONUS_CENTS;
    const before = Number.isFinite(user.balanceCents) ? user.balanceCents : 0;
    user.balanceCents = before + grantCents;
    user.lastDailyBonusDate = today;
    user.dailyBonusExpirableCents = grantCents;

    appendWalletTx(db, {
      id: randomUUID(),
      userId: user.id,
      type: 'bonus',
      amountCents: grantCents,
      balanceBefore: before,
      balanceAfter: user.balanceCents,
      operation: null,
      orderId: null,
      note: '每日登录赠送（当日有效）',
      createdAt: new Date().toISOString(),
    });

    return {
      granted: true,
      amountCents: grantCents,
      expiredCents: expired.expiredCents,
      expiresAtMidnight: true,
    };
  });
}
