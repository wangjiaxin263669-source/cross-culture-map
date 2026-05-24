import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

/** 登录后顶部钱包提示（独立组件，避免 App 内 Hooks 顺序问题） */
export default function WalletNotice() {
  const { user, authNotice, clearAuthNotice } = useAuth();

  useEffect(() => {
    if (!user || !authNotice) return undefined;
    const timer = setTimeout(() => clearAuthNotice(), 12000);
    return () => clearTimeout(timer);
  }, [user, authNotice, clearAuthNotice]);

  if (!user || !authNotice) return null;

  return (
    <div className="app-wallet-notice" role="status">
      <span>{authNotice}</span>
      <button
        type="button"
        className="app-wallet-notice-close"
        aria-label="关闭"
        onClick={clearAuthNotice}
      >
        ×
      </button>
    </div>
  );
}
