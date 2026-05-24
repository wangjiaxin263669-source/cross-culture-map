/** 充值入账管理员密钥校验 */
export function requireRechargeAdmin(req, res, next) {
  const secret = process.env.RECHARGE_ADMIN_SECRET?.trim();
  if (!secret) {
    return res.status(503).json({ error: '未配置 RECHARGE_ADMIN_SECRET，无法操作入账' });
  }
  const got = req.headers['x-admin-secret'] || req.query.secret;
  if (got !== secret) {
    return res.status(403).json({ error: '管理员密钥错误' });
  }
  next();
}
