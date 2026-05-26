import React, { useState } from 'react';
import { register, login, resetPassword } from '../services/authApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getDeviceFingerprint } from '../utils/deviceFingerprint.js';

export default function AuthPage() {
  const { loginSuccess, authNotice } = useAuth();
  const [mode, setMode] = useState('login');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setSuccess('');
    if (next === 'login') {
      setPassword('');
      setConfirmPassword('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'reset') {
        await resetPassword({ phone, password, confirmPassword });
        setSuccess('密码已重置，请使用新密码登录');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => switchMode('login'), 1500);
        return;
      }

      const data =
        mode === 'login'
          ? await login({ phone, password })
          : await register({ nickname, phone, password, confirmPassword });

      if (mode === 'register') {
        const bonus = data.newUserBonus?.granted
          ? `，已赠送 ¥${data.newUserBonus.amountYuan} 体验额度`
          : '';
        setSuccess(`注册成功${bonus}，正在进入平台…`);
        setTimeout(() => loginSuccess(data), 600);
      } else {
        loginSuccess(data);
      }
    } catch (err) {
      setError(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const isReset = mode === 'reset';
  const submitLabel =
    loading ? '处理中…' : isReset ? '重置密码' : mode === 'login' ? '登录' : '注册';

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>跨文化研究设计平台</h1>
          <p className="auth-brand-en">CROSS-CULTURE</p>
          <p>面向产品 / UX 团队的 AI 跨文化决策助手</p>
        </div>

        {!isReset ? (
          <div className="auth-tabs">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => switchMode('login')}
            >
              登录
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => switchMode('register')}
            >
              注册
            </button>
          </div>
        ) : (
          <div className="auth-reset-head">
            <h2>找回密码</h2>
            <p>输入注册时使用的手机号，设置新密码后即可登录</p>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label>
              <span>昵称</span>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="1–20 个字符"
                autoComplete="nickname"
                required
              />
            </label>
          )}

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

          <label>
            <span>{isReset ? '新密码' : '密码'}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </label>

          {(mode === 'register' || isReset) && (
            <label>
              <span>确认密码</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                autoComplete="new-password"
                required
              />
            </label>
          )}

          {mode === 'login' && (
            <button
              type="button"
              className="auth-forgot-link"
              onClick={() => switchMode('reset')}
            >
              忘记密码？
            </button>
          )}

          {success && <div className="auth-success">{success}</div>}
          {!success && authNotice && !error && mode !== 'reset' && (
            <div className="auth-hint-msg">{authNotice}</div>
          )}
          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading || Boolean(success)}>
            {submitLabel}
          </button>
        </form>

        {isReset && (
          <button type="button" className="auth-link-btn" onClick={() => switchMode('login')}>
            返回登录
          </button>
        )}

        <p className="auth-footer-hint">
          {isReset
            ? '仅需已注册的手机号即可重置密码，请妥善保管新密码。'
            : '一个手机号、一台设备各仅可注册一个账号（通过浏览器设备特征识别，无需营业执照）。'}
        </p>
      </div>
    </div>
  );
}
