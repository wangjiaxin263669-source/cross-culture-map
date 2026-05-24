import React, { useState } from 'react';
import { getWechatLoginUrl, login, devLogin } from '../services/authApi.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage() {
  const { loginSuccess, authConfig, authNotice } = useAuth();
  const [wechatLoading, setWechatLoading] = useState(false);
  const [legacyOpen, setLegacyOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleDevLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await devLogin();
      loginSuccess(data);
    } catch (err) {
      setError(err.message || '开发登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLegacyLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login({ username, password });
      loginSuccess(data);
    } catch (err) {
      setError(err.message || '登录失败');
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

        {authConfig.wechatLogin ? (
          <>
            <button
              type="button"
              className="auth-wechat-btn auth-wechat-primary"
              onClick={handleWechat}
              disabled={wechatLoading}
            >
              {wechatLoading ? '跳转微信中…' : '微信扫码登录 / 注册'}
            </button>
            <p className="auth-footer-hint">
              使用微信扫码即可登录；新用户自动创建账号并赠送体验额度。一个微信对应一个账号。
            </p>
          </>
        ) : (
          <div className="auth-hint-msg">
            <p>微信登录尚未配置。请在服务器环境变量中设置：</p>
            <p className="auth-env-hint">WECHAT_OPEN_APP_ID、WECHAT_OPEN_APP_SECRET</p>
            <p className="auth-inline-hint">
              开放平台申请：https://open.weixin.qq.com （网站应用 · 微信登录）
            </p>
          </div>
        )}

        {authConfig.devLogin && (
          <button
            type="button"
            className="auth-submit auth-dev-login-btn"
            onClick={handleDevLogin}
            disabled={loading}
          >
            {loading ? '登录中…' : '开发模式：一键进入（无需微信）'}
          </button>
        )}

        <div className="auth-divider">
          <span>老用户</span>
        </div>
        <button
          type="button"
          className="auth-link-btn"
          onClick={() => {
            setLegacyOpen((v) => !v);
            setError('');
          }}
        >
          {legacyOpen ? '收起账号密码登录' : '使用原账号密码登录'}
        </button>

        {legacyOpen && (
          <form className="auth-form" onSubmit={handleLegacyLogin}>
            <label>
              <span>账号</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="注册时的账号名"
                autoComplete="username"
                required
              />
            </label>
            <label>
              <span>密码</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                autoComplete="current-password"
                required
              />
            </label>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? '登录中…' : '登录'}
            </button>
          </form>
        )}

        {authNotice && !error && <div className="auth-hint-msg">{authNotice}</div>}
        {error && <div className="auth-error">{error}</div>}
      </div>
    </div>
  );
}
