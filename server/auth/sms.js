/**
 * 短信发送：mock / 短信宝 / UniSMS / http / 阿里云
 * 支持环境变量 + 平台数据库 smsSettings（管理员 API 写入，无需重新部署）
 */
import crypto from 'crypto';
import { getSmsPlatformSettings } from '../db/store.js';

const SMSBAO_ERRORS = {
  '30': '短信宝密码错误',
  '40': '短信宝账号不存在',
  '41': '短信宝余额不足，请充值',
  '42': '短信宝账号已过期',
  '43': '短信宝 IP 受限',
  '50': '短信内容含敏感词',
  '51': '手机号码不正确',
};

function envSms() {
  return {
    provider: (process.env.SMS_PROVIDER || 'auto').trim().toLowerCase(),
    exposeDevCode: process.env.SMS_EXPOSE_DEV_CODE === 'true',
    devCode: process.env.SMS_DEV_CODE?.trim() || '',
    webhookUrl: process.env.SMS_WEBHOOK_URL?.trim() || '',
    smsbao: {
      user: process.env.SMSBAO_USER?.trim() || '',
      password: process.env.SMSBAO_PASSWORD?.trim() || '',
      sign: process.env.SMSBAO_SIGN?.trim() || '跨文化平台',
    },
    unisms: {
      accessKeyId: process.env.UNISMS_ACCESS_KEY_ID?.trim() || '',
      signature: process.env.UNISMS_SIGNATURE?.trim() || '跨文化平台',
      templateId: process.env.UNISMS_TEMPLATE_ID?.trim() || '',
    },
    aliyun: {
      accessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID?.trim() || '',
      accessKeySecret: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET?.trim() || '',
      signName: process.env.ALIYUN_SMS_SIGN_NAME?.trim() || '',
      templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE?.trim() || '',
    },
  };
}

export async function resolveSmsRuntime() {
  const env = envSms();
  const db = (await getSmsPlatformSettings()) || {};
  const merged = {
    provider: db.provider || env.provider,
    exposeDevCode: db.exposeDevCode ?? env.exposeDevCode,
    devCode: db.devCode || env.devCode,
    webhookUrl: db.webhookUrl || env.webhookUrl,
    smsbao: { ...env.smsbao, ...(db.smsbao || {}) },
    unisms: { ...env.unisms, ...(db.unisms || {}) },
    aliyun: { ...env.aliyun, ...(db.aliyun || {}) },
  };

  let provider = merged.provider;
  if (provider === 'auto') {
    if (merged.unisms.accessKeyId) provider = 'unisms';
    else if (merged.smsbao.user && merged.smsbao.password) provider = 'smsbao';
    else provider = 'mock';
  }

  return {
    ...merged,
    provider,
    mock: provider === 'mock',
  };
}

export async function isSmsSendConfigured() {
  const cfg = await resolveSmsRuntime();
  if (cfg.mock) return true;
  if (cfg.provider === 'http' && cfg.webhookUrl) return true;
  if (cfg.provider === 'smsbao') {
    return Boolean(cfg.smsbao.user && cfg.smsbao.password);
  }
  if (cfg.provider === 'unisms') {
    return Boolean(cfg.unisms.accessKeyId);
  }
  if (cfg.provider === 'aliyun') {
    const a = cfg.aliyun;
    return Boolean(a.accessKeyId && a.accessKeySecret && a.signName && a.templateCode);
  }
  return false;
}

export async function shouldExposeDevCodeInApi() {
  const cfg = await resolveSmsRuntime();
  if (cfg.mock && (cfg.exposeDevCode || process.env.NODE_ENV !== 'production')) {
    return true;
  }
  return false;
}

export function getSmsConfig() {
  return envSms();
}

async function sendViaWebhook(url, phone, code) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code, template: 'login' }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`短信网关失败 (${res.status})${text ? `: ${text.slice(0, 120)}` : ''}`);
  }
}

async function sendViaSmsBao(phone, code, smsbao) {
  if (!smsbao.user || !smsbao.password) {
    throw new Error('短信服务未配置');
  }
  const p = crypto.createHash('md5').update(smsbao.password).digest('hex');
  const content = `【${smsbao.sign || '跨文化平台'}】您的验证码是${code}，5分钟内有效。`;
  const url = `https://api.smsbao.com/sms?u=${encodeURIComponent(smsbao.user)}&p=${p}&m=${phone}&c=${encodeURIComponent(content)}`;
  const res = await fetch(url);
  const body = (await res.text()).trim();
  if (body !== '0') {
    throw new Error(SMSBAO_ERRORS[body] || `短信发送失败（错误码 ${body}）`);
  }
}

const UNISMS_ERRORS = {
  InsufficientFunds: 'UniSMS 余额不足，请登录控制台充值',
  InvalidSignature: '短信签名未审核或填写错误，请检查 UNISMS_SIGNATURE',
  InvalidCredentials: 'AccessKey 无效，请检查 UNISMS_ACCESS_KEY_ID',
};

async function sendViaUniSms(phone, code, unisms) {
  if (!unisms.accessKeyId) throw new Error('未配置 UNISMS_ACCESS_KEY_ID');
  if (!unisms.signature) throw new Error('未配置 UNISMS_SIGNATURE');

  const url = `https://uni.apistd.com/?action=sms.message.send&accessKeyId=${encodeURIComponent(unisms.accessKeyId)}`;
  const body = {
    to: phone,
    signature: unisms.signature,
  };
  if (unisms.templateId) {
    body.templateId = unisms.templateId;
    body.templateData = { code, ttl: '5' };
  } else {
    body.content = `您的验证码是${code}，5分钟内有效。`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  const ok = data.code === '0' || data.code === 0;
  if (!ok) {
    const msg = UNISMS_ERRORS[data.message] || data.message || 'UniSMS 短信发送失败';
    throw new Error(msg);
  }
  console.log('[UniSMS] sent', phone, data.data?.messages?.[0]?.id || '');
}

async function sendViaAliyun(phone, code, aliyun) {
  const params = {
    AccessKeyId: aliyun.accessKeyId,
    Action: 'SendSms',
    Format: 'JSON',
    PhoneNumbers: phone,
    RegionId: 'cn-hangzhou',
    SignName: aliyun.signName,
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: crypto.randomBytes(16).toString('hex'),
    SignatureVersion: '1.0',
    TemplateCode: aliyun.templateCode,
    TemplateParam: JSON.stringify({ code }),
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    Version: '2017-05-25',
  };
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');
  const stringToSign = `GET&${encodeURIComponent('/')}&${encodeURIComponent(sorted)}`;
  const signature = crypto
    .createHmac('sha1', `${aliyun.accessKeySecret}&`)
    .update(stringToSign)
    .digest('base64');
  const query = `${sorted}&Signature=${encodeURIComponent(signature)}`;
  const res = await fetch(`https://dysmsapi.aliyuncs.com/?${query}`);
  const data = await res.json().catch(() => ({}));
  if (data.Code !== 'OK') {
    throw new Error(data.Message || '阿里云短信发送失败');
  }
}

/** @returns {{ mockCode?: string }} */
export async function sendVerificationSms(phone, code) {
  const cfg = await resolveSmsRuntime();

  if (cfg.mock) {
    console.log(`[SMS mock] ${phone} 验证码: ${code}`);
    const mockCode = cfg.devCode || code;
    return (await shouldExposeDevCodeInApi()) ? { mockCode } : {};
  }

  if (cfg.provider === 'smsbao') {
    await sendViaSmsBao(phone, code, cfg.smsbao);
    return {};
  }

  if (cfg.provider === 'unisms') {
    await sendViaUniSms(phone, code, cfg.unisms);
    return {};
  }

  if (cfg.provider === 'http') {
    if (!cfg.webhookUrl) throw new Error('未配置 SMS_WEBHOOK_URL');
    await sendViaWebhook(cfg.webhookUrl, phone, code);
    return {};
  }

  if (cfg.provider === 'aliyun') {
    await sendViaAliyun(phone, code, cfg.aliyun);
    return {};
  }

  throw new Error('未配置短信服务');
}
