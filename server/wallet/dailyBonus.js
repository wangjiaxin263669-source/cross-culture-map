import { readDb, writeDb } from '../db/engine.js';
import { creditUserBalance } from '../db/store.js';
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

/**
 * 每日首次登录赠送 0.05 元；累计每日登录赠送上限 0.5 元，达上限后不再发放
 */
export async function tryGrantDailyLoginBonus(userId) {
  if (DAILY_LOGIN_BONUS_CENTS <= 0) {
    return { granted: false, amountCents: 0 };
  }

  const db = await readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return { granted: false, amountCents: 0 };

  const today = getTodayShanghai();
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

  user.lastDailyBonusDate = today;
  user.dailyLoginBonusEarnedCents = earned + grantCents;
  await writeDb(db);

  await creditUserBalance(userId, grantCents, {
    type: 'bonus',
    note: '每日登录赠送',
  });

  return {
    granted: true,
    amountCents: grantCents,
    earnedCents: earned + grantCents,
    capCents: DAILY_LOGIN_BONUS_CAP_CENTS,
  };
}
