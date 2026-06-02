/** 用户微信转账备注（账号/手机号） */
export function normalizeTransferRemark(input, fallbackPhone = '') {
  const raw = String(input ?? fallbackPhone ?? '').trim();
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && /^1[3-9]\d{9}$/.test(digits)) return digits;
  if (digits.length === 13 && digits.startsWith('86')) {
    const phone = digits.slice(2);
    if (/^1[3-9]\d{9}$/.test(phone)) return phone;
  }
  if (raw.length >= 3 && raw.length <= 32) return raw;
  throw new Error('请填写转账备注（建议填写注册手机号，便于管理员核对入账）');
}
