import crypto from 'crypto';
import { completeRechargeOrder } from '../db/store.js';
import { createWechatQrPayment, getWechatQrConfig } from './wechatQr.js';

function resolveProvider() {
  const explicit = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if (explicit) return explicit;
  if (process.env.WECHAT_PAY_QR_URL?.trim()) return 'wechat_qr';
  return 'mock';
}

const PROVIDER = resolveProvider();

function getBaseUrl(req) {
  const fromEnv = process.env.API_PUBLIC_URL?.trim() || process.env.FRONTEND_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3001';
  return `${proto}://${host}`.replace(/\/$/, '');
}

function md5Sign(params, key) {
  const sorted = Object.keys(params)
    .filter((k) => params[k] !== '' && params[k] != null && k !== 'sign' && k !== 'sign_type')
    .sort();
  const str = `${sorted.map((k) => `${k}=${params[k]}`).join('&')}${key}`;
  return crypto.createHash('md5').update(str, 'utf8').digest('hex');
}

function getZpayConfig() {
  const pid = process.env.ZPAY_PID?.trim();
  const key = process.env.ZPAY_KEY?.trim();
  const apiBase = (process.env.ZPAY_API_BASE?.trim() || '').replace(/\/$/, '');
  return { pid, key, apiBase, configured: Boolean(pid && key && apiBase) };
}

/** 创建支付：返回 { payUrl, mode } */
export async function createPayment({ req, order, payType = 'alipay' }) {
  const base = getBaseUrl(req);
  const notifyUrl = `${base}/api/wallet/recharge/notify`;
  const returnUrl =
    process.env.PAYMENT_RETURN_URL?.trim() ||
    `${process.env.FRONTEND_URL?.trim() || 'http://localhost:5173'}/?recharge=success`;

  if (PROVIDER === 'mock') {
    return { mode: 'mock', payUrl: null, notifyUrl };
  }

  if (PROVIDER === 'wechat_qr') {
    return createWechatQrPayment({ req, order });
  }

  if (PROVIDER === 'zpay') {
    const cfg = getZpayConfig();
    if (!cfg.configured) {
      throw new Error('未配置 ZPAY_PID / ZPAY_KEY / ZPAY_API_BASE（易支付兼容接口）');
    }
    const money = (order.amountCents / 100).toFixed(2);
    const params = {
      pid: cfg.pid,
      type: payType === 'wxpay' ? 'wxpay' : 'alipay',
      out_trade_no: order.id,
      notify_url: notifyUrl,
      return_url: returnUrl,
      name: `跨文化平台充值-${money}元`,
      money,
    };
    params.sign = md5Sign(params, cfg.key);
    params.sign_type = 'MD5';
    const submitUrl = `${cfg.apiBase}/submit.php?${new URLSearchParams(params).toString()}`;
    return { mode: 'redirect', payUrl: submitUrl, notifyUrl };
  }

  throw new Error(`未知支付渠道 PAYMENT_PROVIDER=${PROVIDER}`);
}

/** 支付回调验签并入账 */
export async function handlePaymentNotify(body) {
  if (PROVIDER === 'mock') {
    const orderId = body?.out_trade_no || body?.orderId;
    if (!orderId) throw new Error('缺少订单号');
    return await completeRechargeOrder(orderId, 'mock');
  }

  if (PROVIDER === 'zpay') {
    const cfg = getZpayConfig();
    if (!cfg.configured) throw new Error('支付未配置');
    const params = { ...body };
    const sign = params.sign;
    const expected = md5Sign(params, cfg.key);
    if (!sign || sign !== expected) {
      throw new Error('签名校验失败');
    }
    const status = params.trade_status || params.status;
    if (status !== 'TRADE_SUCCESS' && status !== 'success') {
      return { skipped: true, reason: status };
    }
    const orderId = params.out_trade_no;
    return await completeRechargeOrder(orderId, params.trade_no || params.transaction_id);
  }

  throw new Error('支付未配置');
}

export function getPaymentPublicConfig() {
  const zpay = getZpayConfig();
  const wechatQr = getWechatQrConfig();
  return {
    provider: PROVIDER,
    mockMode: PROVIDER === 'mock',
    wechatQrMode: PROVIDER === 'wechat_qr',
    wechatQrConfigured: wechatQr.configured,
    wechatQrOwnerName: wechatQr.ownerName,
    zpayConfigured: zpay.configured,
    payTypes: PROVIDER === 'wechat_qr' ? ['wxpay'] : ['alipay', 'wxpay'],
  };
}

/** mock 模式：创建订单后立即入账 */
export async function completeMockOrder(orderId) {
  return completeRechargeOrder(orderId, 'mock-auto');
}
