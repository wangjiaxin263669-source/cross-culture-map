import { Router } from 'express';
import {
  createUser,
  findUserById,
  findUserByUsername,
  findUserByPhone,
  findUserByWechatOpenId,
  bindPhoneToUser,
  createUserByPhone,
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
import { verifyPassword, validatePassword, validateUsername } from './password.js';
import { signToken } from './jwt.js';
import { buildWechatLoginUrl, exchangeWechatCode, getWechatConfig } from './wechat.js';
import { requireAuth, requirePhoneBound } from './middleware.js';
import { NEW_USER_BONUS_CENTS } from '../wallet/config.js';
import { tryGrantDailyLoginBonus } from '../wallet/dailyBonus.js';
import { normalizePhone, validatePhone, userHasBoundPhone } from './phone.js';
import { sendOtp, verifyOtp } from './otp.js';
import { resolveSmsRuntime, isSmsSendConfigured, shouldExposeDevCodeInApi } from './sms.js';

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

/** 发送短信验证码 */
router.post('/sms/send', async (req, res) => {
  try {
    if (!isSmsSendConfigured()) {
      return res.status(503).json({ error: '短信服务未配置，请联系管理员' });
    }
    const phone = normalizePhone(req.body?.phone);
    const purpose = req.body?.purpose === 'bind' ? 'bind' : 'login';
    const err = validatePhone(phone);
    if (err) return res.status(400).json({ error: err });

    const result = await sendOtp({ phone, purpose });
    const payload = {
      ok: true,
      message: '验证码已发送',
      expiresInSec: result.expiresInSec,
    };
    if (result.mockCode && (await shouldExposeDevCodeInApi())) {
      payload.devHint = `验证码：${result.mockCode}`;
      payload.devCode = result.mockCode;
    }
    res.json(payload);
  } catch (err) {
    res.status(400).json({ error: err.message || '发送失败' });
  }
});

/** 手机号 + 验证码登录（未注册则自动创建账号） */
router.post('/sms/login', async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    const code = String(req.body?.code || '').trim();
    const err = validatePhone(phone);
    if (err) return res.status(400).json({ error: err });
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: '请输入 6 位验证码' });
    }

    await verifyOtp({ phone, purpose: 'login', code });

    let user = await findUserByPhone(phone);
    let newUserBonus = null;
    if (!user) {
      const created = await createUserByPhone(phone, {
        initialBalanceCents: NEW_USER_BONUS_CENTS,
        initialBonusNote: '新用户注册赠送 ¥0.50',
      });
      user = await findUserById(created.id);
      if (NEW_USER_BONUS_CENTS > 0) {
        newUserBonus = {
          granted: true,
          amountYuan: (NEW_USER_BONUS_CENTS / 100).toFixed(2),
        };
      }
    }

    if (!userHasBoundPhone(user)) {
      return res.status(403).json({ error: '账号未绑定手机号，请先完成绑定' });
    }

    const data = await loginUserRecord(user);
    res.json({ ...data, newUserBonus });
  } catch (err) {
    res.status(400).json({ error: err.message || '登录失败' });
  }
});

/** 老账号：用户名密码验证后绑定手机（一次性迁移） */
router.post('/legacy/bind-phone', async (req, res) => {
  try {
    const { username, password } = req.body;
    const phone = normalizePhone(req.body?.phone);
    const code = String(req.body?.code || '').trim();

    if (!username?.trim() || !password) {
      return res.status(400).json({ error: '请输入原账号和密码' });
    }
    const pErr = validatePhone(phone);
    if (pErr) return res.status(400).json({ error: pErr });
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: '请输入 6 位验证码' });
    }

    const user = await findUserByUsername(username);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: '账号或密码错误' });
    }
    if (userHasBoundPhone(user)) {
      return res.status(400).json({ error: '该账号已绑定手机，请直接用手机号登录' });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: '账号或密码错误' });
    }

    const taken = await findUserByPhone(phone);
    if (taken && taken.id !== user.id) {
      return res.status(400).json({ error: '该手机号已被其他账号绑定' });
    }

    await verifyOtp({ phone, purpose: 'bind', code });
    await bindPhoneToUser(user.id, phone);
    const data = await loginUserRecord(await findUserById(user.id));
    res.json({ ...data, message: '手机号绑定成功' });
  } catch (err) {
    res.status(400).json({ error: err.message || '绑定失败' });
  }
});

/** 已登录但未绑手机（如微信）— 绑定后继续 */
router.post('/bind-phone', requireAuth, async (req, res) => {
  try {
    if (userHasBoundPhone(req.user)) {
      return res.status(400).json({ error: '已绑定手机号' });
    }
    const phone = normalizePhone(req.body?.phone);
    const code = String(req.body?.code || '').trim();
    const pErr = validatePhone(phone);
    if (pErr) return res.status(400).json({ error: pErr });
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: '请输入 6 位验证码' });
    }

    const taken = await findUserByPhone(phone);
    if (taken && taken.id !== req.user.id) {
      return res.status(400).json({ error: '该手机号已被其他账号绑定' });
    }

    await verifyOtp({ phone, purpose: 'bind', code });
    await bindPhoneToUser(req.user.id, phone);
    const data = await loginUserRecord(await findUserById(req.user.id));
    res.json({ ...data, message: '手机号绑定成功' });
  } catch (err) {
    res.status(400).json({ error: err.message || '绑定失败' });
  }
});

/** @deprecated 已停用账号密码注册 */
router.post('/register', (_req, res) => {
  res.status(410).json({
    error: '已改为手机号验证码登录，请使用验证码注册/登录',
    code: 'AUTH_METHOD_DEPRECATED',
  });
});

/** @deprecated 已停用账号密码登录 */
router.post('/login', (_req, res) => {
  res.status(410).json({
    error: '已改为手机号验证码登录。老用户请使用「绑定已有账号」',
    code: 'AUTH_METHOD_DEPRECATED',
  });
});

router.get('/me', requireAuth, async (req, res) => {
  const dailyBonus = await tryGrantDailyLoginBonus(req.user.id);
  const raw = await findUserById(req.user.id);
  const user = await sanitizeUser(raw);
  res.json({
    user,
    dailyBonus,
    requiresPhoneBinding: user.requiresPhoneBinding,
  });
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
      user = await findUserById(user.id);
    }

    const token = signToken(await sanitizeUser(user));
    if (!userHasBoundPhone(user)) {
      return res.redirect(
        `${frontend}?token=${encodeURIComponent(token)}&bind_phone=1`,
      );
    }

    const dailyBonus = await tryGrantDailyLoginBonus(user.id);
    const bonusQuery = dailyBonus.granted ? '&daily_bonus=1' : '';
    res.redirect(`${frontend}?token=${encodeURIComponent(token)}${bonusQuery}`);
  } catch (err) {
    res.redirect(`${frontend}?auth_error=${encodeURIComponent(err.message)}`);
  }
});

router.get('/history/chats', requireAuth, requirePhoneBound, async (req, res) => {
  res.json({ sessions: await listChatSessions(req.user.id) });
});

router.get('/history/chats/:id', requireAuth, requirePhoneBound, async (req, res) => {
  const session = await getChatSession(req.user.id, req.params.id);
  if (!session) return res.status(404).json({ error: '对话不存在' });
  res.json({ session });
});

router.post('/history/chats', requireAuth, requirePhoneBound, async (req, res) => {
  try {
    const session = await saveChatSession(req.user.id, req.body);
    res.json({ session });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/history/chats/:id', requireAuth, requirePhoneBound, async (req, res) => {
  await deleteChatSession(req.user.id, req.params.id);
  res.json({ ok: true });
});

router.get('/history/reports', requireAuth, requirePhoneBound, async (req, res) => {
  res.json({ reports: await listReports(req.user.id) });
});

router.get('/history/reports/:id', requireAuth, requirePhoneBound, async (req, res) => {
  const report = await getReport(req.user.id, req.params.id);
  if (!report) return res.status(404).json({ error: '报告不存在' });
  res.json({ report });
});

router.post('/history/reports', requireAuth, requirePhoneBound, async (req, res) => {
  try {
    const report = await saveReport(req.user.id, req.body);
    res.json({ report });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/history/reports/:id', requireAuth, requirePhoneBound, async (req, res) => {
  await deleteReport(req.user.id, req.params.id);
  res.json({ ok: true });
});

export default router;
