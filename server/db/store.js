/**
 * 用户与历史记录存储（JSON 文件，适合 VPS/本地；上线请用持久化磁盘或后续接 Postgres）
 */
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { getServerDir } from '../paths.js';

const DB_PATH = path.join(getServerDir(), 'data', 'platform-db.json');

const EMPTY = {
  users: [],
  chatSessions: [],
  reports: [],
  rechargeOrders: [],
  walletTransactions: [],
};

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    return structuredClone(EMPTY);
  }
  try {
    const raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    return {
      users: raw.users || [],
      chatSessions: raw.chatSessions || [],
      reports: raw.reports || [],
      rechargeOrders: raw.rechargeOrders || [],
      walletTransactions: raw.walletTransactions || [],
    };
  } catch {
    return structuredClone(EMPTY);
  }
}

function writeDb(data) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function isDbWritable() {
  return !process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FORCE_FILE_DB === '1';
}

// —— Users ——

export function findUserByUsername(username) {
  const db = readDb();
  const key = String(username).trim().toLowerCase();
  return db.users.find((u) => u.usernameLower === key) || null;
}

export function findUserById(id) {
  return readDb().users.find((u) => u.id === id) || null;
}

export function findUserByWechatOpenId(openId) {
  return readDb().users.find((u) => u.wechatOpenId === openId) || null;
}

export function createUser({ username, passwordHash, displayName, wechatOpenId, avatar }) {
  const db = readDb();
  const usernameLower = username.trim().toLowerCase();
  if (db.users.some((u) => u.usernameLower === usernameLower)) {
    throw new Error('该账号已被注册');
  }
  const user = {
    id: randomUUID(),
    username: username.trim(),
    usernameLower,
    passwordHash: passwordHash || null,
    displayName: displayName || username.trim(),
    wechatOpenId: wechatOpenId || null,
    avatar: avatar || null,
    balanceCents: 0,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  writeDb(db);
  return sanitizeUser(user);
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, usernameLower, ...safe } = user;
  safe.balanceCents = getUserBalanceCents(user.id);
  safe.balanceYuan = (safe.balanceCents / 100).toFixed(2);
  return safe;
}

// —— 钱包余额 ——

export function getUserBalanceCents(userId) {
  const user = findUserById(userId);
  if (!user) return 0;
  return Number.isFinite(user.balanceCents) ? user.balanceCents : 0;
}

function appendWalletTx(db, tx) {
  db.walletTransactions.push(tx);
  if (db.walletTransactions.length > 5000) {
    db.walletTransactions = db.walletTransactions.slice(-4000);
  }
}

export function chargeUserBalance(userId, amountCents, meta = {}) {
  if (amountCents <= 0) throw new Error('扣费金额无效');
  const db = readDb();
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
  writeDb(db);
  return tx;
}

export function creditUserBalance(userId, amountCents, meta = {}) {
  if (amountCents <= 0) throw new Error('充值金额无效');
  const db = readDb();
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
  writeDb(db);
  return tx;
}

export function refundUserBalance(userId, amountCents, meta = {}) {
  return creditUserBalance(userId, amountCents, { ...meta, type: meta.type || 'refund' });
}

export function listWalletTransactions(userId, limit = 30) {
  return readDb()
    .walletTransactions.filter((t) => t.userId === userId)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, limit);
}

// —— 充值订单 ——

export function createRechargeOrder({ userId, packageId, amountCents, bonusCents, payChannel }) {
  const db = readDb();
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
  writeDb(db);
  return order;
}

export function findRechargeOrder(orderId) {
  return readDb().rechargeOrders.find((o) => o.id === orderId) || null;
}

export function completeRechargeOrder(orderId, providerTradeNo = null) {
  const db = readDb();
  const order = db.rechargeOrders.find((o) => o.id === orderId);
  if (!order) throw new Error('订单不存在');
  if (order.status === 'paid') {
    return { order, alreadyPaid: true };
  }
  order.status = 'paid';
  order.paidAt = new Date().toISOString();
  if (providerTradeNo) order.providerTradeNo = providerTradeNo;
  writeDb(db);
  const tx = creditUserBalance(order.userId, order.totalCreditCents, {
    type: 'recharge',
    orderId: order.id,
    note: `充值 ${order.packageId || ''}`,
  });
  return { order, transaction: tx, alreadyPaid: false };
}

// —— Chat sessions ——

export function listChatSessions(userId, limit = 50) {
  return readDb()
    .chatSessions.filter((s) => s.userId === userId)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    .slice(0, limit)
    .map(({ messages, ...meta }) => meta);
}

export function getChatSession(userId, sessionId) {
  const s = readDb().chatSessions.find((x) => x.id === sessionId && x.userId === userId);
  return s || null;
}

export function saveChatSession(userId, payload) {
  const db = readDb();
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
  writeDb(db);
  return session;
}

export function deleteChatSession(userId, sessionId) {
  const db = readDb();
  db.chatSessions = db.chatSessions.filter((s) => !(s.id === sessionId && s.userId === userId));
  writeDb(db);
}

// —— Reports ——

export function listReports(userId, limit = 50) {
  return readDb()
    .reports.filter((r) => r.userId === userId)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, limit)
    .map(({ content, ...meta }) => meta);
}

export function getReport(userId, reportId) {
  return readDb().reports.find((r) => r.id === reportId && r.userId === userId) || null;
}

export function saveReport(userId, payload) {
  const db = readDb();
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
  writeDb(db);
  return report;
}

export function deleteReport(userId, reportId) {
  const db = readDb();
  db.reports = db.reports.filter((r) => !(r.id === reportId && r.userId === userId));
  writeDb(db);
}
