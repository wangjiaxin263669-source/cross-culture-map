import { Router } from 'express';
import {
  listWalletTransactions,
  findRechargeOrder,
  createRechargeOrder,
} from '../db/store.js';
import { requireAuth } from '../auth/middleware.js';
import { getWalletPublicConfig, RECHARGE_PACKAGES } from './config.js';
import { getWalletSnapshot } from './billing.js';
import {
  createPayment,
  handlePaymentNotify,
  completeMockOrder,
  getPaymentPublicConfig,
} from '../payment/index.js';

const router = Router();

router.get('/config', requireAuth, (_req, res) => {
  res.json({
    wallet: getWalletPublicConfig(),
    payment: getPaymentPublicConfig(),
  });
});

router.get('/balance', requireAuth, async (req, res) => {
  res.json(await getWalletSnapshot(req.user.id));
});

router.get('/transactions', requireAuth, async (req, res) => {
  res.json({ transactions: await listWalletTransactions(req.user.id) });
});

router.post('/recharge/create', requireAuth, async (req, res) => {
  try {
    const { packageId, payType = 'alipay' } = req.body;
    const pkg = RECHARGE_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return res.status(400).json({ error: '无效的充值档位' });
    }

    const order = await createRechargeOrder({
      userId: req.user.id,
      packageId: pkg.id,
      amountCents: pkg.amountCents,
      bonusCents: pkg.bonusCents,
      payChannel: payType,
    });

    const payment = await createPayment({ req, order, payType });

    if (payment.mode === 'mock') {
      const result = await completeMockOrder(order.id);
      const snapshot = await getWalletSnapshot(req.user.id);
      return res.json({
        order: result.order,
        mock: true,
        balanceCents: snapshot.balanceCents,
        balanceYuan: snapshot.balanceYuan,
        message: '开发模式：已模拟支付成功并入账',
      });
    }

    res.json({
      orderId: order.id,
      payUrl: payment.payUrl,
      mode: payment.mode,
      amountYuan: (order.amountCents / 100).toFixed(2),
      totalCreditYuan: (order.totalCreditCents / 100).toFixed(2),
    });
  } catch (err) {
    res.status(400).json({ error: err.message || '创建订单失败' });
  }
});

router.get('/recharge/status/:orderId', requireAuth, async (req, res) => {
  const order = await findRechargeOrder(req.params.orderId);
  if (!order || order.userId !== req.user.id) {
    return res.status(404).json({ error: '订单不存在' });
  }
  res.json({ order });
});

router.post('/recharge/notify', async (req, res) => {
  try {
    const payload = { ...req.query, ...req.body };
    const result = await handlePaymentNotify(payload);
    if (result?.skipped) {
      return res.send('success');
    }
    res.send('success');
  } catch (err) {
    console.error('[wallet notify]', err.message);
    res.status(400).send('fail');
  }
});

router.get('/recharge/notify', async (req, res) => {
  try {
    await handlePaymentNotify(req.query);
    res.send('success');
  } catch (err) {
    console.error('[wallet notify GET]', err.message);
    res.status(400).send('fail');
  }
});

export default router;
