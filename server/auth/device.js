import { createHash } from 'crypto';

const FP_RE = /^[a-f0-9]{64}$/i;

/** 校验并规范化客户端提交的设备指纹（SHA-256 十六进制） */
export function normalizeDeviceFingerprint(raw) {
  const fp = String(raw || '').trim().toLowerCase();
  if (!FP_RE.test(fp)) return null;
  return fp;
}

/** 服务端根据请求头生成辅助指纹（仅作日志/风控参考，不单独用于拦截） */
export function hashRequestDeviceHints(req) {
  const parts = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.ip || req.socket?.remoteAddress || '',
  ].join('|');
  return createHash('sha256').update(parts).digest('hex');
}

export function isDeviceLimitEnabled() {
  const flag = process.env.DEVICE_ONE_ACCOUNT;
  if (flag === '0' || flag === 'false') return false;
  return true;
}
