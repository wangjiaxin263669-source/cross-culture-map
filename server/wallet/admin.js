/** 充值入账管理员密钥校验 */
import { getRechargeAdminSecret } from './adminSecret.js';

export function requireRechargeAdmin(req, res, next) {
  const secret = getRechargeAdminSecret();
  if (!secret) {
    return res.status(503).json({ error: '未配置 RECHARGE_ADMIN_SECRET，无法操作入账' });
  }
  const got = req.headers['x-admin-secret'] || req.query.secret;
  if (got !== secret) {
    return res.status(403).json({ error: '管理员密钥错误' });
  }
  next();
}
