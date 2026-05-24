/**
 * 微信个人收款码充值：用户扫码付款到您的微信，平台内余额入账（DeepSeek 由您自行充值 API）
 */

function getBaseUrl(req) {
  const fromEnv = process.env.API_PUBLIC_URL?.trim() || process.env.FRONTEND_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3001';
  return `${proto}://${host}`.replace(/\/$/, '');
}

export function getWechatQrConfig() {
  const raw = process.env.WECHAT_PAY_QR_URL?.trim() || '/wechat-pay-qr.png';
  return {
    qrPath: raw,
    configured: Boolean(raw),
    ownerName: process.env.WECHAT_PAY_OWNER_NAME?.trim() || '平台收款',
  };
}

export function resolveQrImageUrl(req) {
  const { qrPath } = getWechatQrConfig();
  if (qrPath.startsWith('http://') || qrPath.startsWith('https://')) {
    return qrPath;
  }
  const base = getBaseUrl(req);
  return `${base}${qrPath.startsWith('/') ? qrPath : `/${qrPath}`}`;
}

/** 转账备注用短码，方便在微信账单里核对 */
export function buildPayRemark(orderId) {
  return orderId.replace(/-/g, '').slice(-8).toUpperCase();
}

export function createWechatQrPayment({ req, order }) {
  const cfg = getWechatQrConfig();
  if (!cfg.configured) {
    throw new Error('未配置 WECHAT_PAY_QR_URL（请上传微信收款码到 public/wechat-pay-qr.png）');
  }
  const amountYuan = (order.amountCents / 100).toFixed(2);
  return {
    mode: 'wechat_qr',
    payUrl: null,
    qrImageUrl: resolveQrImageUrl(req),
    orderId: order.id,
    payRemark: buildPayRemark(order.id),
    amountYuan,
    totalCreditYuan: (order.totalCreditCents / 100).toFixed(2),
    ownerName: cfg.ownerName,
    instructions: [
      `请使用微信扫一扫，支付 ¥${amountYuan}`,
      `转账备注请填写：${buildPayRemark(order.id)}（必填）`,
      '支付完成后点击「我已完成转账」，核实到账后余额将更新',
    ],
  };
}
