/**
 * 开放平台 Token 持久化（本地开发 / 自有服务器）
 * Netlify 无状态环境请用环境变量注入 XHS_ARK_ACCESS_TOKEN / WEIBO_ACCESS_TOKEN
 */
import fs from 'fs';
import path from 'path';
import { getServerDir } from '../paths.js';

const STORE_PATH = path.join(getServerDir(), 'data', 'open-platform-tokens.json');

function readStore() {
  if (!fs.existsSync(STORE_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function writeStore(data) {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function getPlatformTokens(platform) {
  const envToken = getEnvToken(platform);
  if (envToken) return envToken;
  return readStore()[platform] || null;
}

function getEnvToken(platform) {
  if (platform === 'xiaohongshu_ark') {
    const t = process.env.XHS_ARK_ACCESS_TOKEN?.trim();
    if (!t) return null;
    return {
      accessToken: t,
      fromEnv: true,
      sellerName: process.env.XHS_ARK_SELLER_NAME || '环境变量授权',
    };
  }
  if (platform === 'weibo') {
    const t = process.env.WEIBO_ACCESS_TOKEN?.trim();
    if (!t) return null;
    return { access_token: t, fromEnv: true };
  }
  return null;
}

export function savePlatformTokens(platform, tokens) {
  const store = readStore();
  store[platform] = { ...tokens, updatedAt: new Date().toISOString() };
  writeStore(store);
  return store[platform];
}

export function clearPlatformTokens(platform) {
  const store = readStore();
  delete store[platform];
  writeStore(store);
}
