import { requireAuth } from '../auth/middleware.js';
import { chargeForOperation, refundOperation, InsufficientBalanceError } from './billing.js';

/**
 * 包装 AI 路由：登录 + 预扣费，失败自动退款
 * @param {string} operation - WALLET_COSTS 的 key
 */
export function withWalletCharge(operation, handler) {
  return [
    requireAuth,
    async (req, res) => {
      let charged = null;
      const maybeRefund = () => {
        if (charged?.costCents) {
          try {
            refundOperation(req.user.id, charged.costCents, operation, 'request_failed');
          } catch {
            /* ignore */
          }
          charged = null;
        }
      };
      res.on('finish', () => {
        if (charged && res.statusCode >= 400) maybeRefund();
      });
      try {
        charged = chargeForOperation(req.user.id, operation);
        req.walletCharge = charged;
        await handler(req, res);
      } catch (err) {
        maybeRefund();
        if (err instanceof InsufficientBalanceError || err.statusCode === 402) {
          return res.status(402).json({
            error: err.message,
            balanceCents: err.balanceCents,
            costCents: err.costCents,
            code: 'INSUFFICIENT_BALANCE',
          });
        }
        if (err.code === 'INSUFFICIENT_BALANCE') {
          return res.status(402).json({
            error: err.message,
            balanceCents: err.balanceCents,
            costCents: err.costCents,
            code: 'INSUFFICIENT_BALANCE',
          });
        }
        if (!res.headersSent) {
          console.error(`[${operation}]`, err.message);
          res.status(500).json({ error: err.message || '请求失败' });
        }
      }
    },
  ];
}
