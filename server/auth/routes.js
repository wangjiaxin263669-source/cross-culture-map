import { Router } from 'express';
import {
  createUser,
  findUserById,
  findUserByUsername,
  findUserByPhone,
  updateUserPasswordByPhone,
  sanitizeUser,
  listChatSessions,
  getChatSession,
  saveChatSession,
  deleteChatSession,
  listReports,
  getReport,
  saveReport,
  deleteReport,
} from '../db/store.js';
import { signToken } from './jwt.js';
import { requireAuth } from './middleware.js';
import { hashPassword, verifyPassword, validatePassword } from './password.js';
import { NEW_USER_BONUS_CENTS } from '../wallet/config.js';
import { tryGrantDailyLoginBonus } from '../wallet/dailyBonus.js';
import { normalizePhone, validatePhone } from './phone.js';

const router = Router();

async function authResponse(user, extras = {}) {
  const safe = await sanitizeUser(user);
  const token = signToken(safe);
  return { user: safe, token, ...extras };
}

async function loginUserRecord(user) {
  const dailyBonus = await tryGrantDailyLoginBonus(user.id);
  const fresh = await findUserById(user.id);
  return authResponse(fresh, { dailyBonus });
}

function validateNickname(name) {
  const n = String(name || '').trim();
  if (n.length < 1 || n.length > 20) {
    return '昵称长度为 1–20 个字符';
  }
  return null;
}

function uniqueUsernameForPhone(phone) {
  return `m${phone}`;
}

/** 注册：昵称 + 手机号 + 密码 */
router.post('/register', async (req, res) => {
  try {
    const displayName = (req.body.displayName || req.body.nickname || '').trim();
    const phone = normalizePhone(req.body.phone);
    const { password, confirmPassword } = req.body;

    const nickErr = validateNickname(displayName);
    if (nickErr) return res.status(400).json({ error: nickErr });
    const phoneErr = validatePhone(phone);
    if (phoneErr) return res.status(400).json({ error: phoneErr });
    const passErr = validatePassword(password);
    if (passErr) return res.status(400).json({ error: passErr });
    if (password !== confirmPassword) {
      return res.status(400).json({ error: '两次输入的密码不一致' });
    }

    if (await findUserByPhone(phone)) {
      return res.status(400).json({ error: '该手机号已被注册' });
    }

    let username = uniqueUsernameForPhone(phone);
    if (await findUserByUsername(username)) {
      username = `${username}_${Date.now().toString(36).slice(-4)}`;
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      username,
      passwordHash,
      displayName,
      phone,
      phoneVerified: true,
      initialBalanceCents: NEW_USER_BONUS_CENTS,
      initialBonusNote: '新用户注册赠送 ¥0.50',
    });

    // Netlify Blobs 写入后短暂延迟才可读；轮询确保注册即可登录
    let persisted = user;
    for (let i = 0; i < 8; i += 1) {
      const found = await findUserById(user.id);
      if (found) {
        persisted = found;
        break;
      }
      await new Promise((r) => setTimeout(r, 120));
    }

    res.json(
      await authResponse(persisted, {
        newUserBonus:
          NEW_USER_BONUS_CENTS > 0
            ? { granted: true, amountYuan: (NEW_USER_BONUS_CENTS / 100).toFixed(2) }
            : null,
      }),
    );
  } catch (err) {
    res.status(400).json({ error: err.message || '注册失败' });
  }
});

/** 登录：手机号 + 密码 */
router.post('/login', async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const { password } = req.body;
    const phoneErr = validatePhone(phone);
    if (phoneErr) return res.status(400).json({ error: phoneErr });
    if (!password) return res.status(400).json({ error: '请输入密码' });

    let user = await findUserByPhone(phone);
    for (let i = 0; i < 6 && !user; i += 1) {
      await new Promise((r) => setTimeout(r, 120));
      user = await findUserByPhone(phone);
    }
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }

    res.json(await loginUserRecord(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** 忘记密码：凭注册手机号设置新密码 */
router.post('/reset-password', async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const { password, confirmPassword } = req.body;

    const phoneErr = validatePhone(phone);
    if (phoneErr) return res.status(400).json({ error: phoneErr });
    const passErr = validatePassword(password);
    if (passErr) return res.status(400).json({ error: passErr });
    if (password !== confirmPassword) {
      return res.status(400).json({ error: '两次输入的密码不一致' });
    }

    const existing = await findUserByPhone(phone);
    if (!existing) {
      return res.status(404).json({ error: '该手机号未注册' });
    }

    const passwordHash = await hashPassword(password);
    await updateUserPasswordByPhone(phone, passwordHash);
    res.json({ ok: true, message: '密码已重置，请使用新密码登录' });
  } catch (err) {
    res.status(400).json({ error: err.message || '重置失败' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const dailyBonus = await tryGrantDailyLoginBonus(req.user.id);
  const raw = await findUserById(req.user.id);
  const user = await sanitizeUser(raw);
  res.json({ user, dailyBonus });
});

router.get('/history/chats', requireAuth, async (req, res) => {
  res.json({ sessions: await listChatSessions(req.user.id) });
});

router.get('/history/chats/:id', requireAuth, async (req, res) => {
  const session = await getChatSession(req.user.id, req.params.id);
  if (!session) return res.status(404).json({ error: '对话不存在' });
  res.json({ session });
});

router.post('/history/chats', requireAuth, async (req, res) => {
  try {
    const session = await saveChatSession(req.user.id, req.body);
    res.json({ session });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/history/chats/:id', requireAuth, async (req, res) => {
  await deleteChatSession(req.user.id, req.params.id);
  res.json({ ok: true });
});

router.get('/history/reports', requireAuth, async (req, res) => {
  res.json({ reports: await listReports(req.user.id) });
});

router.get('/history/reports/:id', requireAuth, async (req, res) => {
  const report = await getReport(req.user.id, req.params.id);
  if (!report) return res.status(404).json({ error: '报告不存在' });
  res.json({ report });
});

router.post('/history/reports', requireAuth, async (req, res) => {
  try {
    const report = await saveReport(req.user.id, req.body);
    res.json({ report });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/history/reports/:id', requireAuth, async (req, res) => {
  await deleteReport(req.user.id, req.params.id);
  res.json({ ok: true });
});

export default router;
