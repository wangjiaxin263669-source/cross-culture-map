/**
 * 用户 / 历史 / 钱包 — 统一数据层（Netlify Blobs 或本地文件）
 */
import { randomUUID } from 'crypto';
import { readDb, writeDb, runDbUpdate, isDbWritable, getStorageBackend } from './engine.js';

export { isDbWritable, getStorageBackend };

export async function findUserByUsername(username) {
  const db = await readDb();
  const key = String(username).trim().toLowerCase();
  return db.users.find((u) => u.usernameLower === key) || null;
}

export async function findUserById(id) {
  const db = await readDb();
  return db.users.find((u) => u.id === id) || null;
}

export async function findUserByWechatOpenId(openId) {
  const db = await readDb();
  return db.users.find((u) => u.wechatOpenId === openId) || null;
}

export async function findUserByPhone(phone) {
  const db = await readDb();
  const key = String(phone).trim();
  return db.users.find((u) => u.phone === key && u.phoneVerified) || null;
}

function assertPhoneAvailable(db, phone, exceptUserId = null) {
  const taken = db.users.some(
    (u) => u.phone === phone && u.phoneVerified && u.id !== exceptUserId,
  );
  if (taken) throw new Error('该手机号已被其他账号绑定');
}

export async function createUser({
  username,
  passwordHash,
  displayName,
  wechatOpenId,
  avatar,
  phone = null,
  phoneVerified = false,
  initialBalanceCents = 0,
  initialBonusNote = '新用户注册赠送',
}) {
  return runDbUpdate((db) => {
    const usernameLower = username.trim().toLowerCase();
    if (db.users.some((u) => u.usernameLower === usernameLower)) {
      throw new Error('该账号已被注册');
    }
    if (phone && phoneVerified) {
      assertPhoneAvailable(db, phone);
    }
    const user = {
      id: randomUUID(),
      username: username.trim(),
      usernameLower,
      passwordHash: passwordHash || null,
      displayName: displayName || username.trim(),
      wechatOpenId: wechatOpenId || null,
      avatar: avatar || null,
      phone: phoneVerified ? phone : null,
      phoneVerified: Boolean(phone && phoneVerified),
      phoneVerifiedAt: phone && phoneVerified ? new Date().toISOString() : null,
      balanceCents: Math.max(0, initialBalanceCents),
      dailyLoginBonusEarnedCents: 0,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    if (initialBalanceCents > 0) {
      appendWalletTx(db, {
        id: randomUUID(),
        userId: user.id,
        type: 'bonus',
        amountCents: initialBalanceCents,
        balanceBefore: 0,
        balanceAfter: user.balanceCents,
        operation: null,
        orderId: null,
        note: initialBonusNote,
        createdAt: new Date().toISOString(),
      });
    }
    const { passwordHash: _ph, usernameLower: _ul, ...safe } = user;
    safe.balanceYuan = (user.balanceCents / 100).toFixed(2);
    return safe;
  });
}

export async function bindPhoneToUser(userId, phone) {
  return runDbUpdate((db) => {
    assertPhoneAvailable(db, phone, userId);
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error('用户不存在');
    user.phone = phone;
    user.phoneVerified = true;
    user.phoneVerifiedAt = new Date().toISOString();
    const { passwordHash: _ph, usernameLower: _ul, ...safe } = user;
    safe.balanceYuan = ((user.balanceCents || 0) / 100).toFixed(2);
    return safe;
  });
}

export async function createUserByPhone(phone, { initialBalanceCents = 0, initialBonusNote } = {}) {
  const suffix = phone.slice(-4);
  let username = `u${suffix}`;
  let n = 0;
  while (await findUserByUsername(username)) {
    n += 1;
    username = `u${suffix}_${n}`;
  }
  return createUser({
    username,
    passwordHash: null,
    displayName: `用户${suffix}`,
    phone,
    phoneVerified: true,
    initialBalanceCents,
    initialBonusNote: initialBonusNote || '新用户注册赠送',
  });
}

export async function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, usernameLower, phone: rawPhone, ...safe } = user;
  const balanceCents = Number.isFinite(user.balanceCents)
    ? user.balanceCents
    : await getUserBalanceCents(user.id);
  safe.balanceCents = balanceCents;
  safe.balanceYuan = (balanceCents / 100).toFixed(2);
  safe.phoneBound = Boolean(user.phone && user.phoneVerified);
  safe.requiresPhoneBinding = !safe.phoneBound;
  if (user.phone && user.phoneVerified) {
    safe.phoneMasked = `${user.phone.slice(0, 3)}****${user.phone.slice(7)}`;
  } else {
    safe.phoneMasked = null;
  }
  return safe;
}

export async function getUserBalanceCents(userId) {
  const user = await findUserById(userId);
  if (!user) return 0;
  return Number.isFinite(user.balanceCents) ? user.balanceCents : 0;
}

function appendWalletTx(db, tx) {
  db.walletTransactions.push(tx);
  if (db.walletTransactions.length > 5000) {
    db.walletTransactions = db.walletTransactions.slice(-4000);
  }
}

export async function chargeUserBalance(userId, amountCents, meta = {}) {
  if (amountCents <= 0) throw new Error('扣费金额无效');
  return runDbUpdate((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error('用户不存在');
    const before = Number.isFinite(user.balanceCents) ? user.balanceCents : 0;
    if (before < amountCents) {
      const err = new Error('余额不足');
      err.code = 'INSUFFICIENT_BALANCE';
      err.balanceCents = before;
      err.costCents = amountCents;
      throw err;
    }
    user.balanceCents = before - amountCents;
    const tx = {
      id: randomUUID(),
      userId,
      type: meta.type || 'consume',
      amountCents: -amountCents,
      balanceBefore: before,
      balanceAfter: user.balanceCents,
      operation: meta.operation || null,
      orderId: meta.orderId || null,
      note: meta.note || '',
      createdAt: new Date().toISOString(),
    };
    appendWalletTx(db, tx);
    return tx;
  });
}

export async function creditUserBalance(userId, amountCents, meta = {}) {
  if (amountCents <= 0) throw new Error('充值金额无效');
  return runDbUpdate((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error('用户不存在');
    const before = Number.isFinite(user.balanceCents) ? user.balanceCents : 0;
    user.balanceCents = before + amountCents;
    const tx = {
      id: randomUUID(),
      userId,
      type: meta.type || 'recharge',
      amountCents,
      balanceBefore: before,
      balanceAfter: user.balanceCents,
      operation: meta.operation || null,
      orderId: meta.orderId || null,
      note: meta.note || '',
      createdAt: new Date().toISOString(),
    };
    appendWalletTx(db, tx);
    return tx;
  });
}

export async function refundUserBalance(userId, amountCents, meta = {}) {
  return creditUserBalance(userId, amountCents, { ...meta, type: meta.type || 'refund' });
}

export async function listWalletTransactions(userId, limit = 30) {
  const db = await readDb();
  return db.walletTransactions
    .filter((t) => t.userId === userId)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, limit);
}

export async function createRechargeOrder({ userId, packageId, amountCents, bonusCents, payChannel }) {
  const db = await readDb();
  const order = {
    id: randomUUID(),
    userId,
    packageId,
    amountCents,
    bonusCents: bonusCents || 0,
    totalCreditCents: amountCents + (bonusCents || 0),
    payChannel: payChannel || 'unknown',
    status: 'pending',
    providerTradeNo: null,
    createdAt: new Date().toISOString(),
    paidAt: null,
  };
  db.rechargeOrders.push(order);
  await writeDb(db);
  return order;
}

export async function findRechargeOrder(orderId) {
  const db = await readDb();
  return db.rechargeOrders.find((o) => o.id === orderId) || null;
}

export async function markRechargeOrderAwaitingConfirm(orderId, userId) {
  const db = await readDb();
  const order = db.rechargeOrders.find((o) => o.id === orderId && o.userId === userId);
  if (!order) throw new Error('订单不存在');
  if (order.status === 'paid') throw new Error('订单已完成');
  if (order.status !== 'awaiting_confirm') {
    order.status = 'awaiting_confirm';
    order.submittedAt = new Date().toISOString();
    await writeDb(db);
  }
  return order;
}

export async function listRechargeOrdersForAdmin(status = 'awaiting_confirm') {
  const db = await readDb();
  const list = db.rechargeOrders.filter((o) => {
    if (status === 'all_pending') {
      return o.status === 'pending' || o.status === 'awaiting_confirm';
    }
    return o.status === status;
  });
  return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function completeRechargeOrder(orderId, providerTradeNo = null) {
  const db = await readDb();
  const order = db.rechargeOrders.find((o) => o.id === orderId);
  if (!order) throw new Error('订单不存在');
  if (order.status === 'paid') {
    return { order, alreadyPaid: true };
  }
  order.status = 'paid';
  order.paidAt = new Date().toISOString();
  if (providerTradeNo) order.providerTradeNo = providerTradeNo;
  await writeDb(db);
  const tx = await creditUserBalance(order.userId, order.totalCreditCents, {
    type: 'recharge',
    orderId: order.id,
    note: `充值 ${order.packageId || ''}`,
  });
  return { order, transaction: tx, alreadyPaid: false };
}

export async function listChatSessions(userId, limit = 50) {
  const db = await readDb();
  return db.chatSessions
    .filter((s) => s.userId === userId)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    .slice(0, limit)
    .map(({ messages, ...meta }) => meta);
}

export async function getChatSession(userId, sessionId) {
  const db = await readDb();
  return db.chatSessions.find((x) => x.id === sessionId && x.userId === userId) || null;
}

export async function saveChatSession(userId, payload) {
  return runDbUpdate((db) => {
    const now = new Date().toISOString();
    let session = payload.id
      ? db.chatSessions.find((s) => s.id === payload.id && s.userId === userId)
      : null;

    if (session) {
      session.title = payload.title || session.title;
      session.messages = payload.messages || session.messages;
      session.market = payload.market ?? session.market;
      session.updatedAt = now;
    } else {
      session = {
        id: randomUUID(),
        userId,
        title: payload.title || '跨文化对话',
        messages: payload.messages || [],
        market: payload.market || null,
        createdAt: now,
        updatedAt: now,
      };
      db.chatSessions.push(session);
    }

    if (db.chatSessions.length > 200) {
      db.chatSessions = db.chatSessions
        .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
        .slice(0, 200);
    }

    return session;
  });
}

export async function deleteChatSession(userId, sessionId) {
  return runDbUpdate((db) => {
    db.chatSessions = db.chatSessions.filter(
      (s) => !(s.id === sessionId && s.userId === userId),
    );
  });
}

export async function listReports(userId, limit = 50) {
  const db = await readDb();
  return db.reports
    .filter((r) => r.userId === userId)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, limit)
    .map(({ content, ...meta }) => meta);
}

export async function getReport(userId, reportId) {
  const db = await readDb();
  return db.reports.find((r) => r.id === reportId && r.userId === userId) || null;
}

export async function saveReport(userId, payload) {
  return runDbUpdate((db) => {
    const report = {
      id: payload.id || randomUUID(),
      userId,
      type: payload.type || 'analysis',
      title: payload.title || '跨文化报告',
      content: payload.content || '',
      market: payload.market || null,
      productIdea: payload.productIdea || '',
      createdAt: payload.createdAt || new Date().toISOString(),
    };
    const idx = db.reports.findIndex((r) => r.id === report.id && r.userId === userId);
    if (idx >= 0) db.reports[idx] = report;
    else db.reports.push(report);

    if (db.reports.length > 200) {
      db.reports = db.reports
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        .slice(0, 200);
    }

    return report;
  });
}

export async function deleteReport(userId, reportId) {
  return runDbUpdate((db) => {
    db.reports = db.reports.filter((r) => !(r.id === reportId && r.userId === userId));
  });
}
