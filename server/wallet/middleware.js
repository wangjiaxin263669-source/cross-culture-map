import { requireAuth } from '../auth/middleware.js';
import {
  chargeForOperation,
  refundOperation,
  InsufficientBalanceError,
  getUserBalanceCents,
} from './billing.js';
import { HttpError } from './httpError.js';

async function walletPayloadAfterRefund(userId, refundedCents) {
  const balanceCents = await getUserBalanceCents(userId);
  return {
    balanceCents,
    balanceYuan: (balanceCents / 100).toFixed(2),
    ...(refundedCents > 0
      ? {
          refunded: true,
          refundedCents,
          refundedYuan: (refundedCents / 100).toFixed(2),
        }
      : {}),
  };
}

/**
 * 包装 AI 路由：登录 + 预扣费；失败、4xx、客户端断开时自动退款
 * @param {string} operation - WALLET_COSTS 的 key
 * @param {(req, res) => Promise<void>} handler
 * @param {{ beforeCharge?: (req) => Promise<void>|void }} [options]
 */
export function withWalletCharge(operation, handler, options = {}) {
  const { beforeCharge } = options;

  return [
    requireAuth,
    async (req, res) => {
      let charged = null;
      let refundedCents = 0;
      let settled = false;

      const performRefund = async (reason) => {
        if (!charged?.costCents || refundedCents > 0) return 0;
        try {
          await refundOperation(req.user.id, charged.costCents, operation, reason);
          refundedCents = charged.costCents;
          charged = null;
          return refundedCents;
        } catch (err) {
          console.error(`[wallet refund ${operation}]`, err.message);
          return 0;
        }
      };

      const finalizeError = async (status, message, extra = {}) => {
        if (!settled && charged) await performRefund('request_failed');
        settled = true;
        const wallet = await walletPayloadAfterRefund(req.user.id, refundedCents);
        if (!res.headersSent) {
          res.status(status).json({
            error: message,
            ...wallet,
            ...extra,
          });
        }
      };

      res.on('finish', () => {
        if (settled) return;
        if (charged && res.statusCode >= 400) {
          settled = true;
          void performRefund('http_error').then(async () => {
            /* 响应已发出，仅记账；客户端应 refresh 余额 */
          });
        } else if (charged && res.statusCode < 400) {
          charged = null;
          settled = true;
        }
      });

      req.on('close', () => {
        if (settled || !charged) return;
        if (!res.writableEnded) {
          settled = true;
          void performRefund('client_aborted');
        }
      });

      try {
        if (beforeCharge) await beforeCharge(req);

        charged = await chargeForOperation(req.user.id, operation);
        req.walletCharge = charged;

        await handler(req, res);

        if (!res.headersSent) {
          throw new Error('处理器未返回响应');
        }
        if (res.statusCode < 400) {
          settled = true;
          charged = null;
        }
      } catch (err) {
        if (err instanceof HttpError) {
          return finalizeError(err.statusCode, err.message);
        }
        if (err instanceof InsufficientBalanceError || err.statusCode === 402) {
          settled = true;
          return res.status(402).json({
            error: err.message,
            balanceCents: err.balanceCents,
            costCents: err.costCents,
            code: 'INSUFFICIENT_BALANCE',
          });
        }
        if (err.code === 'INSUFFICIENT_BALANCE') {
          settled = true;
          return res.status(402).json({
            error: err.message,
            balanceCents: err.balanceCents,
            costCents: err.costCents,
            code: 'INSUFFICIENT_BALANCE',
          });
        }

        const refunded = await performRefund('request_failed');
        settled = true;
        const wallet = await walletPayloadAfterRefund(req.user.id, refunded);
        const msg = err.message || '请求失败';
        console.error(`[${operation}]`, msg);
        if (!res.headersSent) {
          res.status(500).json({
            error: msg,
            ...wallet,
          });
        }
      }
    },
  ];
}

/** 模拟访谈：batch 扣费 + 失败/断开退款（与 withWalletCharge 行为对齐） */
export function createSimInterviewRefundGuard(req, res) {
  let batchMeta = null;
  let settled = false;

  const attachBatch = (meta) => {
    batchMeta = meta;
  };

  const performRefund = async () => {
    if (!batchMeta || batchMeta.reused || !batchMeta.charged?.costCents) return 0;
    const { refundSimInterviewBatch } = await import('./simInterviewBilling.js');
    try {
      await refundSimInterviewBatch(req.user.id, batchMeta.batchId);
      const cents = batchMeta.charged.costCents;
      batchMeta = { ...batchMeta, charged: { costCents: 0 } };
      return cents;
    } catch (err) {
      console.error('[sim_interview refund]', err.message);
      return 0;
    }
  };

  req.on('close', () => {
    if (settled || !batchMeta?.charged?.costCents || batchMeta.reused) return;
    if (!res.writableEnded) {
      settled = true;
      void performRefund();
    }
  });

  return {
    attachBatch,
    async fail(status, message, extra = {}) {
      const refundedCents = settled ? 0 : await performRefund();
      settled = true;
      const wallet = await walletPayloadAfterRefund(req.user.id, refundedCents);
      if (!res.headersSent) {
        res.status(status).json({ error: message, ...wallet, ...extra });
      }
    },
    success() {
      settled = true;
    },
  };
}
