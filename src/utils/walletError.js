/** 将 API 错误与退款信息合并为展示文案 */
export function formatWalletApiError(data, fallback = '请求失败') {
  const base = data?.error || fallback;
  if (data?.refunded && data?.refundedYuan) {
    return `${base}（本次 ¥${data.refundedYuan} 已退回账户余额）`;
  }
  return base;
}
