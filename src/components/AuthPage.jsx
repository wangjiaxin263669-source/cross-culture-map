import React, { useState } from 'react';
import { register, login } from '../services/authApi.js';
import { useAuth } from '../context/AuthContext.jsx';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
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
            }}
          >
            登录
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => {
              setMode('register');
              setError('');
              setSuccess('');
            }}
          >
            注册
          </button>
        </div>

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
            <span>密码</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </label>

          {mode === 'register' && (
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

          {success && <div className="auth-success">{success}</div>}
          {!success && authNotice && !error && <div className="auth-hint-msg">{authNotice}</div>}
          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading || Boolean(success)}>
            {loading ? '处理中…' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <p className="auth-footer-hint">一个手机号仅可注册一个账号。</p>
      </div>
    </div>
  );
}
