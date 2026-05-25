import { Router } from 'express';
import {
  listWalletTransactions,
  findRechargeOrder,
  findUserByPhone,
  creditUserBalance,
  sanitizeUser,
  createRechargeOrder,
  markRechargeOrderAwaitingConfirm,
  listRechargeOrdersForAdmin,
  completeRechargeOrder,
  getSmsPlatformSettings,
  saveSmsPlatformSettings,
} from '../db/store.js';
import { requireRechargeAdmin } from './admin.js';
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

    if (payment.mode === 'wechat_qr') {
      return res.json({
        orderId: order.id,
        mode: 'wechat_qr',
        qrImageUrl: payment.qrImageUrl,
        payRemark: payment.payRemark,
        amountYuan: payment.amountYuan,
        totalCreditYuan: payment.totalCreditYuan,
        ownerName: payment.ownerName,
        instructions: payment.instructions,
        status: 'pending',
      });
    }

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

/** 用户扫码付款后提交，等待管理员核实入账 */
router.post('/recharge/submit-paid', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: '缺少订单号' });
    const order = await markRechargeOrderAwaitingConfirm(orderId, req.user.id);
    res.json({
      order,
      message: '已提交，请等待管理员核实微信到账后入账（通常几分钟内）',
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** 管理员：配置真实短信（写入 Netlify Blobs，立即生效） */
router.get('/admin/sms', requireRechargeAdmin, async (_req, res) => {
  const settings = await getSmsPlatformSettings();
  const safe = settings
    ? {
        ...settings,
        smsbao: settings.smsbao
          ? { user: settings.smsbao.user, sign: settings.smsbao.sign, passwordSet: Boolean(settings.smsbao.password) }
          : null,
      }
    : null;
  res.json({ settings: safe });
});

router.post('/admin/sms', requireRechargeAdmin, async (req, res) => {
  try {
    const { provider, smsbao, unisms, exposeDevCode } = req.body || {};
    const next = {
      provider: provider || 'smsbao',
      exposeDevCode: exposeDevCode === true,
    };
    if (smsbao?.user) {
      next.smsbao = {
        user: String(smsbao.user).trim(),
        password: String(smsbao.password || '').trim(),
        sign: String(smsbao.sign || '跨文化平台').trim(),
      };
      if (!next.smsbao.password) {
        const prev = await getSmsPlatformSettings();
        next.smsbao.password = prev?.smsbao?.password || '';
      }
      if (!next.smsbao.password) {
        return res.status(400).json({ error: '请提供短信宝密码' });
      }
    }
    if (unisms?.accessKeyId) {
      next.unisms = {
        accessKeyId: String(unisms.accessKeyId).trim(),
        signature: String(unisms.signature || '跨文化平台').trim(),
      };
    }
    await saveSmsPlatformSettings(next);
    res.json({ ok: true, message: '短信配置已保存并生效', provider: next.provider });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** 管理员：按手机号赠送余额（分或元） */
router.post('/admin/grant', requireRechargeAdmin, async (req, res) => {
  try {
    const phone = String(req.body?.phone || '').trim();
    const note = String(req.body?.note || '管理员赠送').trim() || '管理员赠送';
    let amountCents = Number(req.body?.amountCents);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      const yuan = Number(req.body?.amountYuan);
      if (!Number.isFinite(yuan) || yuan <= 0) {
        return res.status(400).json({ error: '请提供 amountYuan 或 amountCents' });
      }
      amountCents = Math.round(yuan * 100);
    }
    if (!/^1\d{10}$/.test(phone)) {
      return res.status(400).json({ error: '请提供有效手机号' });
    }
    const user = await findUserByPhone(phone);
    if (!user) {
      return res.status(404).json({ error: '该手机号未注册或未验证' });
    }
    const tx = await creditUserBalance(user.id, amountCents, {
      type: 'bonus',
      note,
    });
    const safe = await sanitizeUser(await findUserByPhone(phone));
    res.json({
      ok: true,
      phone,
      amountCents,
      amountYuan: (amountCents / 100).toFixed(2),
      balanceCents: tx.balanceAfter,
      balanceYuan: (tx.balanceAfter / 100).toFixed(2),
      displayName: safe?.displayName,
      transactionId: tx.id,
      message: `已向 ${phone} 赠送 ¥${(amountCents / 100).toFixed(2)}，当前余额 ¥${(tx.balanceAfter / 100).toFixed(2)}`,
    });
  } catch (err) {
    res.status(400).json({ error: err.message || '赠送失败' });
  }
});

/** 管理员：待核实充值列表 */
router.get('/recharge/admin/pending', requireRechargeAdmin, async (_req, res) => {
  const orders = await listRechargeOrdersForAdmin('all_pending');
  res.json({ orders });
});

/** 管理员：确认入账（核对微信收款后调用） */
router.post('/recharge/admin/confirm/:orderId', requireRechargeAdmin, async (req, res) => {
  try {
    const result = await completeRechargeOrder(req.params.orderId, 'wechat-qr-manual');
    res.json({
      ok: true,
      order: result.order,
      alreadyPaid: result.alreadyPaid,
      message: result.alreadyPaid ? '订单此前已入账' : '已入账',
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
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
