/** 中国大陆手机号校验与规范化 */

const CN_MOBILE = /^1[3-9]\d{9}$/;

export function normalizePhone(input) {
  const digits = String(input || '').replace(/\D/g, '');
  if (digits.length === 13 && digits.startsWith('86')) {
    return digits.slice(2);
  }
  if (digits.length === 11) return digits;
  return '';
}

export function validatePhone(input) {
  const phone = normalizePhone(input);
  if (!phone) return '请输入有效的 11 位手机号';
  if (!CN_MOBILE.test(phone)) return '手机号格式不正确';
  return null;
}

export function maskPhone(phone) {
  const p = normalizePhone(phone);
  if (p.length !== 11) return '';
  return `${p.slice(0, 3)}****${p.slice(7)}`;
}

export function userHasBoundPhone(user) {
  return Boolean(user?.phone && user?.phoneVerified);
}
