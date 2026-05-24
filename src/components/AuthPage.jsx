import React, { useState } from 'react';
import { register, login, getWechatLoginUrl } from '../services/authApi.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage() {
  const { loginSuccess, authConfig, authNotice } = useAuth();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [wechatLoading, setWechatLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data =
        mode === 'login'
          ? await login({ username, password })
          : await register({ username, password, displayName });
      loginSuccess(data);
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
            onClick={() => setMode('login')}
          >
            登录
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            注册
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label>
              <span>昵称（可选）</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="显示名称"
                autoComplete="nickname"
              />
            </label>
          )}
          <label>
            <span>账号</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="3–32 位字母、数字或下划线"
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
              placeholder={mode === 'register' ? '至少 6 位' : '请输入密码'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </label>

          {authNotice && !error && <div className="auth-error">{authNotice}</div>}
          {error && <div className="auth-error">{error}</div>}

          {!authConfig.dbWritable && mode === 'register' && (
            <div className="auth-hint warn">
              当前为无持久化存储的部署环境，注册可能不可用。请使用 VPS 部署或联系管理员。
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? '处理中…' : mode === 'login' ? '登录' : '创建账号'}
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
          </>
        )}

        <p className="auth-footer-hint">
          登录后，AI 对话与三步分析报告将自动保存到您的账号历史记录。
        </p>
      </div>
    </div>
  );
}
