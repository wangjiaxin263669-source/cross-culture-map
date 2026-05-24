import React, { useState, useEffect } from 'react';
import {
  fetchWalletConfig,
  createRechargeOrder,
  submitRechargePaid,
} from '../services/walletApi.js';

export default function RechargeModal({ open, onClose, balanceYuan, onSuccess }) {
  const [config, setConfig] = useState(null);
  const [packageId, setPackageId] = useState('p10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [payStep, setPayStep] = useState('select');
  const [payInfo, setPayInfo] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError('');
    setMessage('');
    setPayStep('select');
    setPayInfo(null);
    fetchWalletConfig()
      .then((data) => {
        setConfig(data);
        if (data.wallet?.packages?.[0]) {
          setPackageId(data.wallet.packages[0].id);
        }
      })
      .catch((err) => setError(err.message));
  }, [open]);

  if (!open) return null;

  const packages = config?.wallet?.packages || [];
  const costs = config?.wallet?.costsYuan || {};
  const mockMode = config?.payment?.mockMode;
  const wechatQrMode = config?.payment?.wechatQrMode;

  const handleCreateOrder = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await createRechargeOrder(packageId, 'wxpay');
      if (result.mock) {
        setMessage(result.message || '充值成功');
        onSuccess?.(result);
        setTimeout(() => onClose(), 1200);
        return;
      }
      if (result.mode === 'wechat_qr') {
        setPayInfo(result);
        setPayStep('pay');
        return;
      }
      if (result.payUrl) {
        window.location.href = result.payUrl;
        return;
      }
      setMessage('订单已创建');
      onSuccess?.(result);
    } catch (err) {
      setError(err.message || '充值失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPaid = async () => {
    if (!payInfo?.orderId) return;
    setLoading(true);
    setError('');
    try {
      const result = await submitRechargePaid(payInfo.orderId);
      setMessage(result.message || '已提交，等待核实入账');
      setPayStep('done');
    } catch (err) {
      setError(err.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  const copyRemark = () => {
    if (payInfo?.payRemark) {
      navigator.clipboard?.writeText(payInfo.payRemark);
      setMessage('备注码已复制');
    }
  };

  return (
    <div className="recharge-overlay" onClick={onClose}>
      <div className="recharge-modal" onClick={(e) => e.stopPropagation()}>
        <div className="recharge-header">
          <h3>账户充值</h3>
          <button type="button" className="recharge-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="recharge-balance">
          当前余额：<strong>¥{balanceYuan ?? '0.00'}</strong>
        </p>

        {payStep === 'select' && (
          <>
            <p className="recharge-hint">
              充值进入您的平台余额，用于 AI 对话与报告（每次约 ¥{costs.chat || '0.10'}）。
              {wechatQrMode
                ? ' 请用微信扫码付款至平台收款码，款项由平台运营方收取；DeepSeek API 费用由平台自行承担。'
                : ' 开发模式下可模拟到账。'}
            </p>

            {mockMode && (
              <p className="recharge-mock-tag">开发模式：点击充值将立即到账（无需真实付款）</p>
            )}

            <div className="recharge-packages">
              {packages.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`recharge-pkg ${packageId === p.id ? 'active' : ''}`}
                  onClick={() => setPackageId(p.id)}
                >
                  <span className="recharge-pkg-label">{p.label}</span>
                  {p.bonusCents > 0 && (
                    <small>到账 ¥{p.totalYuan}（含赠送）</small>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {payStep === 'pay' && payInfo && (
          <div className="recharge-wechat-step">
            <p className="recharge-wechat-amount">
              请支付 <strong>¥{payInfo.amountYuan}</strong>
              {payInfo.totalCreditYuan !== payInfo.amountYuan && (
                <span>（到账 ¥{payInfo.totalCreditYuan}）</span>
              )}
            </p>
            <div className="recharge-qr-card">
              <p className="recharge-qr-title">扫码支付</p>
              <div className="recharge-qr-wrap">
                <img
                  src={payInfo.qrImageUrl}
                  alt="支付二维码"
                  className="recharge-qr-img"
                />
                <span className="recharge-qr-mask" aria-hidden="true" />
              </div>
              <p className="recharge-qr-sub">请使用微信扫一扫完成付款</p>
            </div>
            <p className="recharge-remark">
              转账备注（必填）：
              <button type="button" className="recharge-remark-code" onClick={copyRemark}>
                {payInfo.payRemark}
              </button>
              <small> 点击复制</small>
            </p>
            <ul className="recharge-instructions">
              {(payInfo.instructions || []).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        {payStep === 'done' && (
          <p className="recharge-success-block">
            已收到您的付款申请。管理员核对微信到账后，余额将自动更新，请稍后刷新页面查看。
          </p>
        )}

        {error && <div className="recharge-error">{error}</div>}
        {message && <div className="recharge-success">{message}</div>}

        {payStep === 'select' && (
          <button
            type="button"
            className="recharge-submit"
            disabled={loading || !packageId}
            onClick={handleCreateOrder}
          >
            {loading ? '处理中…' : mockMode ? '确认充值（开发）' : wechatQrMode ? '下一步 · 微信扫码' : '去支付'}
          </button>
        )}

        {payStep === 'pay' && (
          <div className="recharge-pay-actions">
            <button
              type="button"
              className="recharge-submit"
              disabled={loading}
              onClick={handleSubmitPaid}
            >
              {loading ? '提交中…' : '我已完成转账'}
            </button>
            <button type="button" className="recharge-back" onClick={() => setPayStep('select')}>
              返回重选
            </button>
          </div>
        )}

        {payStep === 'done' && (
          <button type="button" className="recharge-submit" onClick={onClose}>
            关闭
          </button>
        )}
      </div>
    </div>
  );
}
