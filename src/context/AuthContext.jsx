import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchMe, setToken, logout as clearToken } from '../services/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authConfig, setAuthConfig] = useState({ dbWritable: true });
  const [authNotice, setAuthNotice] = useState('');

  const refreshUser = useCallback(async () => {
    try {
      const data = await fetchMe();
      setUser(data.user);
      return data;
    } catch {
      setToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const authError = params.get('auth_error');
    if (urlToken) {
      setToken(urlToken);
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (authError) {
      window.history.replaceState({}, '', window.location.pathname);
      setAuthNotice(decodeURIComponent(authError));
    }
    const rechargeOk = params.get('recharge');
    if (rechargeOk === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
      setAuthNotice('充值成功，余额已更新');
    }
    if (params.get('daily_bonus') === '1') {
      window.history.replaceState({}, '', window.location.pathname);
      setAuthNotice('每日登录奖励已到账');
    }

    (async () => {
      try {
        const health = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/health`).then((r) =>
          r.json(),
        );
        if (health.auth) setAuthConfig(health.auth);
      } catch {
        /* ignore */
      }
      const meData = await refreshUser();
      if (meData?.dailyBonus?.granted) {
        setAuthNotice(
          `每日登录已赠送 ¥${(meData.dailyBonus.amountCents / 100).toFixed(2)}`,
        );
      }
      setLoading(false);
    })();
  }, [refreshUser]);

  const loginSuccess = useCallback((data) => {
    setToken(data.token);
    setUser(data.user);
    if (data.dailyBonus?.granted) {
      setAuthNotice(`每日登录已赠送 ¥${(data.dailyBonus.amountCents / 100).toFixed(2)}`);
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, authConfig, authNotice, loginSuccess, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
