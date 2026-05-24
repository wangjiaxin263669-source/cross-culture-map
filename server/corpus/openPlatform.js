import { getXhsArkStatus, buildXhsAuthorizeUrl } from './providers/xiaohongshu-ark.js';
import { getWeiboStatus, buildWeiboAuthorizeUrl } from './providers/weibo-official.js';
import { getJustOneStatus } from './providers/justone.js';

export function getOpenPlatformStatus() {
  return {
    xiaohongshu_ark: getXhsArkStatus(),
    justone: getJustOneStatus(),
    weibo: getWeiboStatus(),
    serper: {
      platform: 'serper',
      label: 'Serper 全网搜索',
      configured: Boolean(process.env.SERPER_API_KEY?.trim()),
      connected: Boolean(process.env.SERPER_API_KEY?.trim()),
      docs: 'https://serper.dev',
    },
  };
}

export function getAuthorizeUrls() {
  return {
    xiaohongshu: buildXhsAuthorizeUrl(),
    weibo: buildWeiboAuthorizeUrl(),
  };
}
