import fs from 'fs';
import path from 'path';
import { getServerDir } from '../paths.js';

let cachedSecret = null;
let cacheLoaded = false;

/** Netlify Functions 有时读不到 RECHARGE_ADMIN_SECRET 环境变量，回退读打包文件 */
export function getRechargeAdminSecret() {
  const fromEnv = process.env.RECHARGE_ADMIN_SECRET?.trim();
  if (fromEnv) return fromEnv;

  if (cacheLoaded) return cachedSecret || '';
  cacheLoaded = true;

  const candidates = [
    path.join(getServerDir(), 'wallet', 'admin-secret.prod'),
    path.join(getServerDir(), 'wallet', 'admin-secret.local'),
  ];
  for (const file of candidates) {
    try {
      if (fs.existsSync(file)) {
        const v = fs.readFileSync(file, 'utf8').trim();
        if (v) {
          cachedSecret = v;
          return v;
        }
      }
    } catch {
      /* try next */
    }
  }
  cachedSecret = '';
  return '';
}
