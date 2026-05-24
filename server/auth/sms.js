/**
 * 短信发送：mock / 短信宝 smsbao / http webhook / 阿里云
 */
import crypto from 'crypto';

const SMSBAO_ERRORS = {
  '30': '短信宝密码错误',
  '40': '短信宝账号不存在',
  '41': '短信宝余额不足，请充值',
  '42': '短信宝账号已过期',
  '43': '短信宝 IP 受限',
  '50': '短信内容含敏感词',
  '51': '手机号码不正确',
};

export function getSmsConfig() {
  const provider = (process.env.SMS_PROVIDER || 'mock').trim().toLowerCase();
  const exposeDevCode = process.env.SMS_EXPOSE_DEV_CODE === 'true';
  return {
    provider,
    mock: provider === 'mock',
    exposeDevCode,
    devCode: process.env.SMS_DEV_CODE?.trim() || '',
    webhookUrl: process.env.SMS_WEBHOOK_URL?.trim() || '',
    smsbao: {
      user: process.env.SMSBAO_USER?.trim() || '',
      password: process.env.SMSBAO_PASSWORD?.trim() || '',
      sign: process.env.SMSBAO_SIGN?.trim() || '跨文化平台',
    },
    aliyun: {
      accessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID?.trim() || '',
      accessKeySecret: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET?.trim() || '',
      signName: process.env.ALIYUN_SMS_SIGN_NAME?.trim() || '',
      templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE?.trim() || '',
    },
  };
}

export function isSmsSendConfigured() {
  const cfg = getSmsConfig();
  if (cfg.mock) return true;
  if (cfg.provider === 'http' && cfg.webhookUrl) return true;
  if (cfg.provider === 'smsbao') {
    const s = cfg.smsbao;
    return Boolean(s.user && s.password);
  }
  if (cfg.provider === 'aliyun') {
    const a = cfg.aliyun;
    return Boolean(a.accessKeyId && a.accessKeySecret && a.signName && a.templateCode);
  }
  return false;
}

export function shouldExposeDevCodeInApi() {
  const cfg = getSmsConfig();
  if (cfg.mock && (cfg.exposeDevCode || process.env.NODE_ENV !== 'production')) {
    return true;
  }
  return false;
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

async function sendViaSmsBao(phone, code) {
  const cfg = getSmsConfig().smsbao;
  if (!cfg.user || !cfg.password) {
    throw new Error('未配置 SMSBAO_USER / SMSBAO_PASSWORD');
  }
  const p = crypto.createHash('md5').update(cfg.password).digest('hex');
  const content = `【${cfg.sign}】您的验证码是${code}，5分钟内有效。`;
  const url = `https://api.smsbao.com/sms?u=${encodeURIComponent(cfg.user)}&p=${p}&m=${phone}&c=${encodeURIComponent(content)}`;
  const res = await fetch(url);
  const body = (await res.text()).trim();
  if (body !== '0') {
    throw new Error(SMSBAO_ERRORS[body] || `短信发送失败（错误码 ${body}）`);
  }
}

async function sendViaAliyun(phone, code) {
  const cfg = getSmsConfig().aliyun;
  const params = {
    AccessKeyId: cfg.accessKeyId,
    Action: 'SendSms',
    Format: 'JSON',
    PhoneNumbers: phone,
    RegionId: 'cn-hangzhou',
    SignName: cfg.signName,
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: crypto.randomBytes(16).toString('hex'),
    SignatureVersion: '1.0',
    TemplateCode: cfg.templateCode,
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
    .createHmac('sha1', `${cfg.accessKeySecret}&`)
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
  const cfg = getSmsConfig();

  if (cfg.mock) {
    console.log(`[SMS mock] ${phone} 验证码: ${code}`);
    const mockCode = cfg.devCode || code;
    return shouldExposeDevCodeInApi() ? { mockCode } : {};
  }

  if (cfg.provider === 'smsbao') {
    await sendViaSmsBao(phone, code);
    return {};
  }

  if (cfg.provider === 'http') {
    if (!cfg.webhookUrl) throw new Error('未配置 SMS_WEBHOOK_URL');
    await sendViaWebhook(cfg.webhookUrl, phone, code);
    return {};
  }

  if (cfg.provider === 'aliyun') {
    await sendViaAliyun(phone, code);
    return {};
  }

  throw new Error('未配置短信服务，请设置 SMS_PROVIDER');
}
