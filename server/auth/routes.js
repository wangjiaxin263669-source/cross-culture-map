import { Router } from 'express';
import {
  createUser,
  findUserById,
  findUserByUsername,
  findUserByWechatOpenId,
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
import { hashPassword, verifyPassword, validatePassword, validateUsername } from './password.js';
import { signToken } from './jwt.js';
import { buildWechatLoginUrl, exchangeWechatCode, getWechatConfig } from './wechat.js';
import { requireAuth } from './middleware.js';
import { NEW_USER_BONUS_CENTS } from '../wallet/config.js';
import { tryGrantDailyLoginBonus } from '../wallet/dailyBonus.js';

const router = Router();

async function authResponse(user, extras = {}) {
  const needsLookup = user?.passwordHash != null || !Number.isFinite(user?.balanceCents);
  const safe = needsLookup ? await sanitizeUser(user) : user;
  const token = signToken(safe);
  return { user: safe, token, ...extras };
}

router.post('/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    const uErr = validateUsername(username);
    if (uErr) return res.status(400).json({ error: uErr });
    const pErr = validatePassword(password);
    if (pErr) return res.status(400).json({ error: pErr });

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      username,
      passwordHash,
      displayName: displayName?.trim() || username.trim(),
      initialBalanceCents: NEW_USER_BONUS_CENTS,
      initialBonusNote: '新用户注册赠送 ¥0.50',
    });
    res.json(
      await authResponse(user, {
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

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username?.trim() || !password) {
      return res.status(400).json({ error: '请输入账号和密码' });
    }
    const user = await findUserByUsername(username);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: '账号或密码错误' });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: '账号或密码错误' });
    }
    const dailyBonus = await tryGrantDailyLoginBonus(user.id);
    const fresh = await findUserById(user.id);
    res.json(await authResponse(fresh, { dailyBonus }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const dailyBonus = await tryGrantDailyLoginBonus(req.user.id);
  const user = dailyBonus.granted
    ? await sanitizeUser(await findUserById(req.user.id))
    : req.user;
  res.json({ user, dailyBonus });
});

router.get('/wechat/url', (_req, res) => {
  const cfg = getWechatConfig();
  if (!cfg.configured) {
    return res.status(400).json({
      error: '未配置微信登录。请在 .env 设置 WECHAT_OPEN_APP_ID 与 WECHAT_OPEN_APP_SECRET',
      configured: false,
    });
  }
  const state = Math.random().toString(36).slice(2);
  res.json({ url: buildWechatLoginUrl(state), state });
});

router.get('/wechat/callback', async (req, res) => {
  const frontend =
    process.env.FRONTEND_URL?.trim() || process.env.VITE_APP_URL?.trim() || 'http://localhost:5173';
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect(`${frontend}?auth_error=missing_code`);
    }
    const wx = await exchangeWechatCode(String(code));
    let user = await findUserByWechatOpenId(wx.openid);
    if (!user) {
      const base = `wx_${wx.openid.slice(-8)}`;
      let username = base;
      let n = 0;
      while (await findUserByUsername(username)) {
        n += 1;
        username = `${base}_${n}`;
      }
      user = await createUser({
        username,
        passwordHash: null,
        displayName: wx.nickname,
        wechatOpenId: wx.openid,
        avatar: wx.avatar,
        initialBalanceCents: NEW_USER_BONUS_CENTS,
        initialBonusNote: '新用户注册赠送 ¥0.50',
      });
    }
    const dailyBonus = await tryGrantDailyLoginBonus(user.id);
    const freshUser = dailyBonus.granted
      ? await findUserById(user.id)
      : user;
    const token = signToken(await sanitizeUser(freshUser));
    const bonusQuery = dailyBonus.granted ? '&daily_bonus=1' : '';
    res.redirect(`${frontend}?token=${encodeURIComponent(token)}${bonusQuery}`);
  } catch (err) {
    res.redirect(`${frontend}?auth_error=${encodeURIComponent(err.message)}`);
  }
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
