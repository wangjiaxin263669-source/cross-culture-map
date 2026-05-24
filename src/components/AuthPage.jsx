import React, { useState, useEffect, useCallback } from 'react';
import { smsLogin, legacyBindPhone, sendSmsCode, getWechatLoginUrl } from '../services/authApi.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage() {
  const { loginSuccess, authConfig, authNotice } = useAuth();
  const [mode, setMode] = useState('login');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devHint, setDevHint] = useState('');
  const [wechatLoading, setWechatLoading] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const smsPurpose = mode === 'legacy' ? 'bind' : 'login';

  const handleSendCode = useCallback(async () => {
    setError('');
    setDevHint('');
    if (!phone.trim()) {
      setError('请输入手机号');
      return;
    }
    setSending(true);
    try {
      const data = await sendSmsCode({ phone, purpose: smsPurpose });
      setCountdown(60);
      if (data.devCode) {
        setCode(String(data.devCode));
        setDevHint(data.devHint || `验证码：${data.devCode}`);
      } else {
        setDevHint('验证码已发送至您的手机，请查收短信');
      }
    } catch (err) {
      setError(err.message || '发送失败');
    } finally {
      setSending(false);
    }
  }, [phone, smsPurpose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data =
        mode === 'legacy'
          ? await legacyBindPhone({ username, password, phone, code })
          : await smsLogin({ phone, code });

      const bonus = data.newUserBonus?.granted
        ? `，已赠送 ¥${data.newUserBonus.amountYuan} 体验额度`
        : '';
      const msg =
        mode === 'legacy'
          ? '绑定成功，正在进入平台…'
          : data.newUserBonus?.granted
            ? `注册成功${bonus}，正在进入平台…`
            : '登录成功，正在进入平台…';
      setSuccess(msg);
      setTimeout(() => loginSuccess(data), 600);
    } catch (err) {
      setError(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleWechat = async () => {
    setError('');
    setWechatLoading(true);
    try {
      const { url } = await getWechatLoginUrl();
      window.location.href = url;
    } catch (err) {
      setError(err.message || '微信登录暂不可用');
      setWechatLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>CROSS-CULTURE</h1>
          <p>跨文化研究设计决策平台</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => {
              setMode('login');
              setError('');
              setSuccess('');
              setDevHint('');
            }}
          >
            验证码登录
          </button>
          <button
            type="button"
            className={mode === 'legacy' ? 'active' : ''}
            onClick={() => {
              setMode('legacy');
              setError('');
              setSuccess('');
              setDevHint('');
            }}
          >
            绑定已有账号
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'legacy' && (
            <>
              <label>
                <span>原账号</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="注册时使用的账号名"
                  autoComplete="username"
                  required
                />
              </label>
              <label>
                <span>原密码</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入原密码"
                  autoComplete="current-password"
                  required
                />
              </label>
            </>
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

          {mode === 'legacy' && (
            <p className="auth-inline-hint">
              老用户需验证原账号密码并绑定手机，绑定后仅能用该手机号登录。
            </p>
          )}

          {devHint && (
            <div className={`auth-hint-msg ${authConfig.smsMock ? '' : 'auth-hint-ok'}`}>{devHint}</div>
          )}
          {success && <div className="auth-success">{success}</div>}
          {!success && authNotice && !error && <div className="auth-hint-msg">{authNotice}</div>}
          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading || Boolean(success)}>
            {loading ? '处理中…' : mode === 'legacy' ? '绑定并登录' : '登录 / 注册'}
          </button>
        </form>

        {authConfig.wechatLogin && (
          <>
            <div className="auth-divider">
              <span>或</span>
            </div>
            <button
              type="button"
              className="auth-wechat-btn"
              onClick={handleWechat}
              disabled={wechatLoading}
            >
              {wechatLoading ? '跳转中…' : '微信扫码登录'}
            </button>
            <p className="auth-inline-hint">微信登录后仍需绑定手机号方可使用。</p>
          </>
        )}

        <p className="auth-footer-hint">
          未注册的手机号验证通过后将自动创建账号。一机一号，防止重复注册。
        </p>
      </div>
    </div>
  );
}
