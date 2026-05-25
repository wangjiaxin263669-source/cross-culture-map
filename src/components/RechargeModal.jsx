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
          <div>
            <h3>账户充值</h3>
            <p className="recharge-balance-inline">
              余额 <strong>¥{balanceYuan ?? '0.00'}</strong>
              {payStep === 'pay' && payInfo && (
                <>
                  {' '}
                  · 应付 <strong className="recharge-pay-amount">¥{payInfo.amountYuan}</strong>
                </>
              )}
            </p>
          </div>
          <button type="button" className="recharge-close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className="recharge-body">
          {payStep === 'select' && (
            <>
              <p className="recharge-hint">
                对话约 ¥{costs.chat || '0.02'}/次，三步报告约 ¥{costs.report || '0.10'}/次，模拟 AI 访谈完整流程约 ¥
                {costs.sim_personas || '0.35'}/次。
                {wechatQrMode ? ' 微信扫码付款。' : ''}
              </p>
              {mockMode && (
                <p className="recharge-mock-tag">开发模式：点击充值将立即到账</p>
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
                    {p.bonusCents > 0 && <small>到账 ¥{p.totalYuan}</small>}
                  </button>
                ))}
              </div>
            </>
          )}

          {payStep === 'pay' && payInfo && (
            <div className="recharge-wechat-step">
              <div className="recharge-qr-card">
                <p className="recharge-qr-title">扫码支付</p>
                <div className="recharge-qr-wrap">
                  <img src={payInfo.qrImageUrl} alt="支付二维码" className="recharge-qr-img" />
                </div>
              </div>
              <p className="recharge-remark">
                转账备注：
                <button type="button" className="recharge-remark-code" onClick={copyRemark}>
                  {payInfo.payRemark}
                </button>
                <small> 复制</small>
              </p>
              <p className="recharge-pay-tip">付款后点击下方按钮，核实到账后余额更新</p>
            </div>
          )}

          {payStep === 'done' && (
            <p className="recharge-success-block">
              已提交付款申请，核实到账后余额将更新，请稍后刷新查看。
            </p>
          )}

          {error && <div className="recharge-error">{error}</div>}
          {message && <div className="recharge-success">{message}</div>}
        </div>

        <div className="recharge-footer">
          {payStep === 'select' && (
            <>
              <button
                type="button"
                className="recharge-submit"
                disabled={loading || !packageId}
                onClick={handleCreateOrder}
              >
                {loading ? '处理中…' : mockMode ? '确认充值' : wechatQrMode ? '下一步' : '去支付'}
              </button>
              <button type="button" className="recharge-cancel" onClick={onClose}>
                取消
              </button>
            </>
          )}

          {payStep === 'pay' && (
            <>
              <button
                type="button"
                className="recharge-submit"
                disabled={loading}
                onClick={handleSubmitPaid}
              >
                {loading ? '提交中…' : '我已完成转账'}
              </button>
              <button type="button" className="recharge-cancel" onClick={() => setPayStep('select')}>
                返回重选
              </button>
              <button type="button" className="recharge-cancel ghost" onClick={onClose}>
                取消
              </button>
            </>
          )}

          {payStep === 'done' && (
            <button type="button" className="recharge-submit" onClick={onClose}>
              关闭
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
