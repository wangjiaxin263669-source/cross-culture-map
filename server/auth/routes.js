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
  listSimResearchSessions,
  getSimResearchSession,
  saveSimResearchSession,
  deleteSimResearchSession,
} from '../db/store.js';
import { signToken } from './jwt.js';
import { requireAuth } from './middleware.js';
import { hashPassword, verifyPassword, validatePassword } from './password.js';
import { NEW_USER_BONUS_CENTS } from '../wallet/config.js';
import { tryGrantDailyLoginBonus } from '../wallet/dailyBonus.js';
import { normalizePhone, validatePhone } from './phone.js';
import {
  normalizeDeviceFingerprint,
  isDeviceLimitEnabled,
} from './device.js';
import { findDeviceRegistration, bindDeviceToUser } from '../db/store.js';
import { waitForUserByPhone, waitForUserById, writeUserPhoneIndex } from '../db/engine.js';

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

    const deviceFingerprint = normalizeDeviceFingerprint(req.body.deviceFingerprint);
    if (isDeviceLimitEnabled()) {
      if (!deviceFingerprint) {
        return res.status(400).json({
          error: '无法识别当前设备，请刷新页面后重试，或使用最新版浏览器',
        });
      }
      const deviceTaken = await findDeviceRegistration(deviceFingerprint);
      if (deviceTaken) {
        return res.status(403).json({
          error: '本设备已注册过账号，请直接登录。每个设备仅可注册一个账号。',
          code: 'DEVICE_ALREADY_REGISTERED',
        });
      }
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

    if (isDeviceLimitEnabled() && deviceFingerprint) {
      await bindDeviceToUser(deviceFingerprint, user.id);
    }

    let fullRecord = await findUserById(user.id);
    for (let i = 0; i < 10 && !fullRecord?.passwordHash; i += 1) {
      await new Promise((r) => setTimeout(r, 100));
      fullRecord = await findUserById(user.id);
    }
    if (fullRecord?.passwordHash) {
      await writeUserPhoneIndex(fullRecord);
    }

    // 写入后强一致读回，确保其他设备/浏览器可登录
    let persisted = await waitForUserById(user.id, { maxAttempts: 16, intervalMs: 200 });
    if (!persisted) {
      persisted = await waitForUserByPhone(phone, { maxAttempts: 8, intervalMs: 200 });
    }
    if (!persisted) {
      return res.status(503).json({
        error: '账号已创建但云端同步较慢，请等待 10 秒后使用同一手机号登录',
        code: 'AUTH_SYNC_PENDING',
      });
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

    const user = await waitForUserByPhone(phone, { maxAttempts: 24, intervalMs: 250 });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }

    await writeUserPhoneIndex(user);

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

    const existing = await waitForUserByPhone(phone, { maxAttempts: 12, intervalMs: 200 });
    if (!existing) {
      return res.status(404).json({ error: '该手机号未注册' });
    }

    const passwordHash = await hashPassword(password);
    await updateUserPasswordByPhone(phone, passwordHash);
    const updated = await findUserById(
      (await waitForUserByPhone(phone, { maxAttempts: 8, intervalMs: 150 }))?.id,
    );
    if (updated?.passwordHash) await writeUserPhoneIndex(updated);
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

router.get('/history/sim-sessions', requireAuth, async (req, res) => {
  res.json({ sessions: await listSimResearchSessions(req.user.id) });
});

router.get('/history/sim-sessions/:id', requireAuth, async (req, res) => {
  const session = await getSimResearchSession(req.user.id, req.params.id);
  if (!session) return res.status(404).json({ error: '模拟调研记录不存在' });
  res.json({ session });
});

router.post('/history/sim-sessions', requireAuth, async (req, res) => {
  try {
    const session = await saveSimResearchSession(req.user.id, req.body);
    res.json({ session });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/history/sim-sessions/:id', requireAuth, async (req, res) => {
  await deleteSimResearchSession(req.user.id, req.params.id);
  res.json({ ok: true });
});

export default router;
