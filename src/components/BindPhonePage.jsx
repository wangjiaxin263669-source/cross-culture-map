import React, { useState, useEffect, useCallback } from 'react';
import { bindPhone, sendSmsCode } from '../services/authApi.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function BindPhonePage() {
  const { user, loginSuccess, logout, authConfig } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devHint, setDevHint] = useState('');

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendCode = useCallback(async () => {
    setError('');
    setDevHint('');
    if (!phone.trim()) {
      setError('请输入手机号');
      return;
    }
    setSending(true);
    try {
      const data = await sendSmsCode({ phone, purpose: 'bind' });
      setCountdown(60);
      if (data.devHint) setDevHint(data.devHint);
      else if (data.devCode) setDevHint(`开发模式验证码：${data.devCode}`);
    } catch (err) {
      setError(err.message || '发送失败');
    } finally {
      setSending(false);
    }
  }, [phone]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data = await bindPhone({ phone, code });
      setSuccess('绑定成功，正在进入平台…');
      setTimeout(() => loginSuccess(data), 500);
    } catch (err) {
      setError(err.message || '绑定失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>绑定手机号</h1>
          <p>
            {user?.displayName || user?.username
              ? `账号「${user.displayName || user.username}」需绑定手机后才能使用平台`
              : '绑定手机后才能使用平台功能'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>手机号</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="11 位中国大陆手机号"
              autoComplete="tel"
              required
            />
          </label>
          <label className="auth-code-row">
            <span>验证码</span>
            <div className="auth-code-inputs">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6 位数字"
                autoComplete="one-time-code"
                required
              />
              <button
                type="button"
                className="auth-code-btn"
                onClick={handleSendCode}
                disabled={sending || countdown > 0 || !phone.trim()}
              >
                {countdown > 0 ? `${countdown}s` : sending ? '发送中…' : '获取验证码'}
              </button>
            </div>
          </label>

          {devHint && (authConfig.smsMock || authConfig.smsExposeDevCode) && (
            <div className="auth-hint-msg">{devHint}</div>
          )}
          {success && <div className="auth-success">{success}</div>}
          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading || Boolean(success)}>
            {loading ? '绑定中…' : '确认绑定'}
          </button>
        </form>

        <button type="button" className="auth-link-btn" onClick={logout}>
          退出并换账号
        </button>
      </div>
    </div>
  );
}
