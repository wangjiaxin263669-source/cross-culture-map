import React, { useState, useEffect } from 'react';
import { register, login, resetPassword } from '../services/authApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getDeviceFingerprint } from '../utils/deviceFingerprint.js';
import BrandLogo from './BrandLogo.jsx';
import AuthBackground from './AuthBackground.jsx';

function AuthField({ label, children }) {
  return (
    <label className="auth-field">
      <span className="auth-field-label">{label}</span>
      <div className="auth-field-control">
        {children}
        <span className="auth-field-line" aria-hidden="true" />
      </div>
    </label>
  );
}

export default function AuthPage({ initialMode = 'login', onBack, onGuestModeChange }) {
  const { loginSuccess, authNotice } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [deviceReady, setDeviceReady] = useState(true);
  const [deviceError, setDeviceError] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
    if (initialMode === 'login') setNickname('');
  }, [initialMode]);

  useEffect(() => {
    let cancelled = false;
    getDeviceFingerprint()
      .then(() => {
        if (!cancelled) {
          setDeviceReady(true);
          setDeviceError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setDeviceReady(false);
          setDeviceError(err.message || '无法生成设备标识');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setSuccess('');
    if (next === 'login') {
      setPassword('');
      setConfirmPassword('');
    }
    if (next === 'login' || next === 'register') {
      onGuestModeChange?.(next);
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

      if (mode === 'register') {
        if (!deviceReady) {
          setError(deviceError || '无法识别当前设备，请刷新页面或使用 Chrome / Edge / Safari 最新版');
          return;
        }
      }

      const data =
        mode === 'login'
          ? await login({ phone, password })
          : await register({
              nickname,
              phone,
              password,
              confirmPassword,
              deviceFingerprint: await getDeviceFingerprint(),
            });

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
      <AuthBackground />

      <div className="auth-shell">
        <div className="auth-card">
          <header className="auth-header auth-reveal auth-reveal--1">
            {onBack && (
              <button type="button" className="auth-back-btn" onClick={onBack}>
                <span aria-hidden="true">←</span> 返回首页
              </button>
            )}
            <BrandLogo variant="auth-compact" />
          </header>

          {!isReset ? (
            <div className="auth-tabs auth-reveal auth-reveal--2">
              <div
                className="auth-tabs-inner"
                data-active={mode === 'register' ? 'register' : 'login'}
              >
                <span className="auth-tabs-glider" aria-hidden="true" />
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
            </div>
          ) : (
            <div className="auth-reset-head auth-reveal auth-reveal--2">
              <h2>找回密码</h2>
              <p>输入注册时使用的手机号，设置新密码后即可登录</p>
            </div>
          )}

          <form className="auth-form-layout auth-reveal auth-reveal--3" onSubmit={handleSubmit} key={mode}>
            <div className="auth-card-scroll">
              <div className="auth-form">
                {mode === 'register' && (
                  <AuthField label="昵称">
                    <input
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="1–20 个字符"
                      autoComplete="nickname"
                      required
                    />
                  </AuthField>
                )}

                <AuthField label="手机号">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="11 位中国大陆手机号"
                    autoComplete="tel"
                    required
                  />
                </AuthField>

                <AuthField label={isReset ? '新密码' : '密码'}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="至少 6 位"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                  />
                </AuthField>

                {(mode === 'register' || isReset) && (
                  <AuthField label="确认密码">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次输入密码"
                      autoComplete="new-password"
                      required
                    />
                  </AuthField>
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
              </div>

              {isReset && (
                <button type="button" className="auth-link-btn" onClick={() => switchMode('login')}>
                  返回登录
                </button>
              )}

              {isReset && (
                <p className="auth-footer-hint">仅需已注册的手机号即可重置密码，请妥善保管新密码。</p>
              )}
            </div>

            <div className="auth-card-footer">
              <button
                type="submit"
                className={`auth-submit${loading ? ' is-loading' : ''}`}
                disabled={loading || Boolean(success)}
              >
                <span className="auth-submit-text">{submitLabel}</span>
                <span className="auth-submit-shimmer" aria-hidden="true" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
