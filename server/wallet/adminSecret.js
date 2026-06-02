/**
 * 永久管理员密钥（仅服务端与构建脚本读取，勿提交到公开文档）
 * 本地覆盖：admin-secret.local（gitignore）
 */
import fs from 'fs';
import path from 'path';
import { getServerDir } from '../paths.js';

const PERMANENT_SECRET = 'CcMapProdAdmin_7f3e9a2b';

let cachedSecret = null;
let cacheLoaded = false;

function readSecretFile(name) {
  try {
    const file = path.join(getServerDir(), 'wallet', name);
    if (!fs.existsSync(file)) return '';
    return fs.readFileSync(file, 'utf8').trim();
  } catch {
    return '';
  }
}

/** 供服务端 API 校验使用 */
export function getRechargeAdminSecret() {
  const fromEnv = process.env.RECHARGE_ADMIN_SECRET?.trim();
  if (fromEnv) return fromEnv;

  if (cacheLoaded) return cachedSecret || PERMANENT_SECRET;
  cacheLoaded = true;

  cachedSecret =
    readSecretFile('admin-secret.local') ||
    readSecretFile('admin-secret.prod') ||
    PERMANENT_SECRET;
  return cachedSecret;
}

/** 供构建 admin-credits 页时注入（不写入明文到 HTML） */
export function getAdminSecretCharCodes() {
  return [...getRechargeAdminSecret()].map((c) => c.charCodeAt(0));
}
