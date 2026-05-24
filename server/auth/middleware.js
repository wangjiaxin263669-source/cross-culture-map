import { verifyToken } from './jwt.js';
import { findUserById, sanitizeUser } from '../db/store.js';

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
    next();
  } catch (err) {
    next(err);
  }
}
