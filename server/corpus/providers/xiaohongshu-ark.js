/**
 * 小红书官方开放平台（ARK）· OAuth2 + 签名
 * 文档：https://open.xiaohongshu.com · https://xiaohongshu.apifox.cn/
 * 说明：ARK 主要为商家/ERP 类目；内容笔记检索请配合 JUSTONE_API_TOKEN
 */
import crypto from 'crypto';
import { getPlatformTokens, savePlatformTokens } from '../openPlatformStore.js';

const API_BASE =
  process.env.XHS_ARK_API_BASE?.trim() || 'https://ark.xiaohongshu.com/ark/open_api/v3/common_controller';
const VERSION = '2.0';

export function getXhsArkConfig() {
  const appId = process.env.XHS_ARK_APP_ID?.trim();
  const appSecret = process.env.XHS_ARK_APP_SECRET?.trim();
  const redirectUri =
    process.env.XHS_ARK_REDIRECT_URI?.trim() || 'http://localhost:3001/api/open-platform/xhs/callback';
  return { appId, appSecret, redirectUri, configured: Boolean(appId && appSecret) };
}

export function buildXhsAuthorizeUrl(state = 'cross-culture') {
  const { appId, redirectUri, configured } = getXhsArkConfig();
  if (!configured) return null;
  const params = new URLSearchParams({
    appId,
    redirectUri,
    state,
  });
  return `https://ark.xiaohongshu.com/ark/authorization?${params.toString()}`;
}

/** 签名：method?appId=xx&timestamp=xx&version=2.0 + appSecret → MD5 */
export function signXhsRequest({ appId, appSecret, timestamp, method }) {
  const raw = `${method}?appId=${appId}&timestamp=${timestamp}&version=${VERSION}${appSecret}`;
  return crypto.createHash('md5').update(raw, 'utf8').digest('hex');
}

async function callXhsArk(method, methodParams = {}, { accessToken } = {}) {
  const { appId, appSecret, configured } = getXhsArkConfig();
  if (!configured) {
    throw new Error('未配置 XHS_ARK_APP_ID / XHS_ARK_APP_SECRET');
  }
  const timestamp = String(Date.now());
  const sign = signXhsRequest({ appId, appSecret, timestamp, method });
  const body = {
    sign,
    appId,
    timestamp,
    version: VERSION,
    method,
    ...methodParams,
  };
  if (accessToken) body.accessToken = accessToken;

  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false || data.error_code) {
    throw new Error(data.error_msg || data.message || `小红书 ARK 调用失败 (${method})`);
  }
  return data.data ?? data;
}

export async function exchangeXhsCodeForToken(code) {
  const data = await callXhsArk('oauth.getAccessToken', { code });
  savePlatformTokens('xiaohongshu_ark', data);
  return data;
}

export async function refreshXhsToken() {
  const stored = getPlatformTokens('xiaohongshu_ark');
  if (!stored?.refreshToken) {
    throw new Error('无 refreshToken，请重新授权');
  }
  const data = await callXhsArk('oauth.refreshToken', { refreshToken: stored.refreshToken });
  savePlatformTokens('xiaohongshu_ark', data);
  return data;
}

export function getXhsArkStatus() {
  const cfg = getXhsArkConfig();
  const tokens = getPlatformTokens('xiaohongshu_ark');
  const expires = tokens?.accessTokenExpiresAt;
  const connected = Boolean(tokens?.accessToken);
  return {
    platform: 'xiaohongshu_ark',
    label: '小红书开放平台（ARK 官方）',
    configured: cfg.configured,
    connected,
    sellerName: tokens?.sellerName,
    expiresAt: expires ? new Date(expires).toISOString() : null,
    fromEnv: Boolean(tokens?.fromEnv),
    note: '官方类目以商家 ERP/商品订单为主；用户笔记语料请配置 JUSTONE_API_TOKEN',
    docs: 'https://open.xiaohongshu.com',
  };
}

/** 若应用开通了素材/商品相关接口，可在此扩展；默认返回连接状态说明 */
export async function fetchXhsArkCorpus({ query }) {
  const tokens = getPlatformTokens('xiaohongshu_ark');
  if (!tokens?.accessToken) return [];

  return [
    {
      source: 'xiaohongshu_ark',
      sourceLabel: '小红书·官方开放平台',
      title: `已连接商家：${tokens.sellerName || '已授权'}`,
      content: `ARK 官方 API 已授权（accessToken 有效）。当前检索词「${query}」— 官方开放能力以商品/订单/素材中心为主，笔记 UGC 检索请使用「Just One API」或精选语料。可在 ARK 控制台查看已开通的 method 权限。`,
      author: tokens.sellerName || 'ARK',
      url: 'https://open.xiaohongshu.com',
      fromOfficialApi: true,
    },
  ];
}
