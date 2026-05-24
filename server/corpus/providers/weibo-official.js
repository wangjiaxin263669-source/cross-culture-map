/**
 * 微博开放平台 · OAuth2 官方授权
 * 文档：https://open.weibo.com/wiki/
 */
import { getPlatformTokens, savePlatformTokens } from '../openPlatformStore.js';

export function getWeiboConfig() {
  const clientId = process.env.WEIBO_APP_KEY?.trim() || process.env.WEIBO_CLIENT_ID?.trim();
  const clientSecret =
    process.env.WEIBO_APP_SECRET?.trim() || process.env.WEIBO_CLIENT_SECRET?.trim();
  const redirectUri =
    process.env.WEIBO_REDIRECT_URI?.trim() || 'http://localhost:3001/api/open-platform/weibo/callback';
  return { clientId, clientSecret, redirectUri, configured: Boolean(clientId && clientSecret) };
}

export function buildWeiboAuthorizeUrl(state = 'cross-culture') {
  const { clientId, redirectUri, configured } = getWeiboConfig();
  if (!configured) return null;
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    state,
  });
  return `https://api.weibo.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeWeiboCodeForToken(code) {
  const { clientId, clientSecret, redirectUri } = getWeiboConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(`https://api.weibo.com/oauth2/access_token?${params}`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(data.error_description || data.error || '微博 token 换取失败');
  }
  const saved = {
    access_token: data.access_token,
    uid: data.uid,
    expires_in: data.expires_in,
    obtainedAt: Date.now(),
  };
  savePlatformTokens('weibo', saved);
  return saved;
}

export function getWeiboStatus() {
  const cfg = getWeiboConfig();
  const tokens = getPlatformTokens('weibo');
  return {
    platform: 'weibo',
    label: '微博开放平台（官方 OAuth）',
    configured: cfg.configured,
    connected: Boolean(tokens?.access_token),
    uid: tokens?.uid,
    fromEnv: Boolean(tokens?.fromEnv),
    note: '话题/搜索类高级接口需在 open.weibo.com 申请；内容检索可配 JUSTONE_API_TOKEN',
    docs: 'https://open.weibo.com',
  };
}

/** 调用公开接口示例：搜索需高级权限，此处返回授权态说明 */
export async function fetchWeiboOfficialCorpus({ query }) {
  const tokens = getPlatformTokens('weibo');
  if (!tokens?.access_token) return [];

  return [
    {
      source: 'weibo',
      sourceLabel: '微博·官方开放平台',
      title: `微博 OAuth 已连接 (uid=${tokens.uid || '—'})`,
      content: `检索词「${query}」— 微博官方搜索/话题接口需应用开通高级权限。建议同时配置 JUSTONE_API_TOKEN 获取关键词微博内容，或使用精选语料/Serper。`,
      author: `uid:${tokens.uid || '—'}`,
      url: 'https://open.weibo.com',
      fromOfficialApi: true,
    },
  ];
}
