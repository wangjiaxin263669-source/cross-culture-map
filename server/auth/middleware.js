import { verifyToken } from './jwt.js';
import { findUserById, sanitizeUser } from '../db/store.js';
import { userHasBoundPhone } from './phone.js';

export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    const payload = verifyToken(token);
    if (payload?.sub) {
      const raw = await findUserById(payload.sub);
      const user = await sanitizeUser(raw);
      if (user) req.user = user;
    }
  }
  next();
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: '请先登录' });
    }
    const payload = verifyToken(token);
    if (!payload?.sub) {
      return res.status(401).json({ error: '登录已过期，请重新登录' });
    }
    const raw = await findUserById(payload.sub);
    const user = await sanitizeUser(raw);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    req.user = user;
    req.rawUser = raw;
    next();
  } catch (err) {
    next(err);
  }
}

/** 未绑定手机号的账号禁止使用平台功能 */
export async function requirePhoneBound(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: '请先登录' });
  }
  const raw = req.rawUser || (await findUserById(req.user.id));
  if (!userHasBoundPhone(raw)) {
    return res.status(403).json({
      error: '请先绑定手机号后再使用',
      code: 'PHONE_BINDING_REQUIRED',
      requiresPhoneBinding: true,
    });
  }
  next();
}
