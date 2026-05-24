/**
 * 微信开放平台 · 网站应用扫码登录
 * 文档：https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html
 */
import { randomBytes } from 'crypto';

export function getWechatConfig() {
  const appId = process.env.WECHAT_OPEN_APP_ID?.trim();
  const appSecret = process.env.WECHAT_OPEN_APP_SECRET?.trim();
  const redirectUri =
    process.env.WECHAT_REDIRECT_URI?.trim() ||
    'http://localhost:3001/api/auth/wechat/callback';
  return {
    appId,
    appSecret,
    redirectUri,
    configured: Boolean(appId && appSecret),
  };
}

export function buildWechatLoginUrl(state) {
  const { appId, redirectUri, configured } = getWechatConfig();
  if (!configured) return null;
  const params = new URLSearchParams({
    appid: appId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'snsapi_login',
    state: state || randomBytes(8).toString('hex'),
  });
  return `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`;
}

export async function exchangeWechatCode(code) {
  const { appId, appSecret, configured } = getWechatConfig();
  if (!configured) {
    throw new Error('未配置 WECHAT_OPEN_APP_ID / WECHAT_OPEN_APP_SECRET');
  }
  const tokenUrl = new URL('https://api.weixin.qq.com/sns/oauth2/access_token');
  tokenUrl.searchParams.set('appid', appId);
  tokenUrl.searchParams.set('secret', appSecret);
  tokenUrl.searchParams.set('code', code);
  tokenUrl.searchParams.set('grant_type', 'authorization_code');

  const tokenRes = await fetch(tokenUrl);
  const tokenData = await tokenRes.json();
  if (tokenData.errcode) {
    throw new Error(tokenData.errmsg || '微信授权失败');
  }

  const { access_token, openid, unionid } = tokenData;

  let nickname = '微信用户';
  let avatar = null;
  try {
    const infoUrl = new URL('https://api.weixin.qq.com/sns/userinfo');
    infoUrl.searchParams.set('access_token', access_token);
    infoUrl.searchParams.set('openid', openid);
    const infoRes = await fetch(infoUrl);
    const info = await infoRes.json();
    if (!info.errcode) {
      nickname = info.nickname || nickname;
      avatar = info.headimgurl || null;
    }
  } catch {
    /* optional */
  }

  return { openid, unionid, nickname, avatar };
}
