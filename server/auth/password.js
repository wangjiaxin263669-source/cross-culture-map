import bcrypt from 'bcryptjs';

const ROUNDS = 10;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

export function validatePassword(plain) {
  if (!plain || plain.length < 6) {
    return '密码至少 6 位';
  }
  if (plain.length > 72) {
    return '密码过长';
  }
  return null;
}

export function validateUsername(username) {
  const u = String(username || '').trim();
  if (u.length < 3 || u.length > 20) {
    return '账号长度 3–20 个字符';
  }
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(u)) {
    return '账号仅支持中文、字母、数字、下划线';
  }
  return null;
}
