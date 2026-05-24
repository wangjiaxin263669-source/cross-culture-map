import { runDbUpdate } from '../db/engine.js';
import { randomUUID } from 'crypto';
import {
  DAILY_LOGIN_BONUS_CENTS,
  DAILY_LOGIN_BONUS_CAP_CENTS,
} from './config.js';

/** 上海时区当日 YYYY-MM-DD */
export function getTodayShanghai() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
}

function getDailyLoginEarned(user) {
  return Number.isFinite(user.dailyLoginBonusEarnedCents)
    ? user.dailyLoginBonusEarnedCents
    : 0;
}

function appendWalletTx(db, tx) {
  db.walletTransactions.push(tx);
  if (db.walletTransactions.length > 5000) {
    db.walletTransactions = db.walletTransactions.slice(-4000);
  }
}

/**
 * 每日首次登录赠送 0.05 元；累计每日登录赠送上限 0.5 元，达上限后不再发放
 */
export async function tryGrantDailyLoginBonus(userId) {
  if (DAILY_LOGIN_BONUS_CENTS <= 0) {
    return { granted: false, amountCents: 0 };
  }

  const today = getTodayShanghai();

  return runDbUpdate((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return { granted: false, amountCents: 0 };

    const createdDay = (user.createdAt || '').slice(0, 10);
    const earned = getDailyLoginEarned(user);

    if (createdDay === today) {
      return { granted: false, amountCents: 0, reason: 'new_user_day' };
    }
    if (user.lastDailyBonusDate === today) {
      return { granted: false, amountCents: 0, reason: 'already_claimed' };
    }
    if (earned >= DAILY_LOGIN_BONUS_CAP_CENTS) {
      return {
        granted: false,
        amountCents: 0,
        reason: 'cap_reached',
        capCents: DAILY_LOGIN_BONUS_CAP_CENTS,
        earnedCents: earned,
      };
    }

    const grantCents = Math.min(
      DAILY_LOGIN_BONUS_CENTS,
      DAILY_LOGIN_BONUS_CAP_CENTS - earned,
    );
    if (grantCents <= 0) {
      return { granted: false, amountCents: 0, reason: 'cap_reached' };
    }

    const before = Number.isFinite(user.balanceCents) ? user.balanceCents : 0;
    user.balanceCents = before + grantCents;
    user.lastDailyBonusDate = today;
    user.dailyLoginBonusEarnedCents = earned + grantCents;

    appendWalletTx(db, {
      id: randomUUID(),
      userId: user.id,
      type: 'bonus',
      amountCents: grantCents,
      balanceBefore: before,
      balanceAfter: user.balanceCents,
      operation: null,
      orderId: null,
      note: '每日登录赠送',
      createdAt: new Date().toISOString(),
    });

    return {
      granted: true,
      amountCents: grantCents,
      earnedCents: earned + grantCents,
      capCents: DAILY_LOGIN_BONUS_CAP_CENTS,
    };
  });
}
