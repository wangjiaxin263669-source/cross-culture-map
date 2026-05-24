import React, { useState, useEffect } from 'react';
import { fetchWalletConfig, createRechargeOrder } from '../services/walletApi.js';

export default function RechargeModal({ open, onClose, balanceYuan, onSuccess }) {
  const [config, setConfig] = useState(null);
  const [packageId, setPackageId] = useState('p10');
  const [payType, setPayType] = useState('alipay');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setMessage('');
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

  const handlePay = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await createRechargeOrder(packageId, payType);
      if (result.mock) {
        setMessage(result.message || '充值成功');
        onSuccess?.(result);
        setTimeout(() => onClose(), 1200);
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

        <p className="recharge-hint">
          每次 AI 生成将从余额扣费（对话 ¥{costs.chat || '0.10'}，报告 ¥{costs.report || '0.10'}）。
          充值金额用于支付 DeepSeek API 调用成本。
        </p>

        {mockMode && (
          <p className="recharge-mock-tag">开发模式：点击支付将立即到账（无需真实付款）</p>
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

        {!mockMode && (
          <div className="recharge-pay-types">
            <label>
              <input
                type="radio"
                name="payType"
                checked={payType === 'alipay'}
                onChange={() => setPayType('alipay')}
              />
              支付宝
            </label>
            <label>
              <input
                type="radio"
                name="payType"
                checked={payType === 'wxpay'}
                onChange={() => setPayType('wxpay')}
              />
              微信支付
            </label>
          </div>
        )}

        {error && <div className="recharge-error">{error}</div>}
        {message && <div className="recharge-success">{message}</div>}

        <button
          type="button"
          className="recharge-submit"
          disabled={loading || !packageId}
          onClick={handlePay}
        >
          {loading ? '处理中…' : mockMode ? '确认充值（开发）' : '去支付'}
        </button>
      </div>
    </div>
  );
}
