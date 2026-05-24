import { readDb, writeDb, creditUserBalance } from '../db/store.js';
import { DAILY_LOGIN_BONUS_CENTS } from './config.js';

/** 上海时区当日 YYYY-MM-DD */
export function getTodayShanghai() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
}

/**
 * 每日首次登录赠送（注册当天不重复发放，因已有新用户礼包）
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

  if (createdDay === today) {
    return { granted: false, amountCents: 0, reason: 'new_user_day' };
  }
  if (user.lastDailyBonusDate === today) {
    return { granted: false, amountCents: 0, reason: 'already_claimed' };
  }

  user.lastDailyBonusDate = today;
  await writeDb(db);

  await creditUserBalance(userId, DAILY_LOGIN_BONUS_CENTS, {
    type: 'bonus',
    note: '每日登录赠送',
  });

  return { granted: true, amountCents: DAILY_LOGIN_BONUS_CENTS };
}
