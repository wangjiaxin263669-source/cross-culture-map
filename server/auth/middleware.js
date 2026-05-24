import { verifyToken } from './jwt.js';
import { findUserById, sanitizeUser } from '../db/store.js';

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    const payload = verifyToken(token);
    if (payload?.sub) {
      const user = sanitizeUser(findUserById(payload.sub));
      if (user) req.user = user;
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: '请先登录' });
  }
  const payload = verifyToken(token);
  if (!payload?.sub) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
  const user = sanitizeUser(findUserById(payload.sub));
  if (!user) {
    return res.status(401).json({ error: '用户不存在' });
  }
  req.user = user;
  next();
}
