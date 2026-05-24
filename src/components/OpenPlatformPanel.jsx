import React, { useEffect, useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function OpenPlatformPanel({ onStatusChange }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/open-platform/status`);
      const data = await res.json();
      setStatus(data);
      onStatusChange?.(data);
    } catch {
      setMsg('无法加载开放平台状态，请确认 npm run dev 已启动');
    } finally {
      setLoading(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    load();
  }, [load]);

  const connect = (path) => {
    window.open(`${API_BASE}${path}`, '_blank', 'width=600,height=700');
    setMsg('已在浏览器打开授权页，完成后请点「刷新状态」');
  };

  const refreshXhs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/open-platform/xhs/refresh`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg('小红书 token 已刷新');
      load();
    } catch (e) {
      setMsg(e.message);
    }
  };

  const disconnect = async (platform) => {
    await fetch(`${API_BASE}/api/open-platform/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    });
    load();
    setMsg(`已断开 ${platform}`);
  };

  if (loading && !status) {
    return <p className="sim-hint">加载开放平台状态…</p>;
  }

  const platforms = status?.platforms || {};
  const netlifyNote = status?.netlifyNote;

  return (
    <div className="open-platform-panel">
      <h4 className="sim-library-title">开放平台连接（真实 API）</h4>
      <p className="sim-hint">
        笔记/UGC 语料：推荐配置 <strong>JUSTONE_API_TOKEN</strong>；商家官方 ARK / 微博 OAuth 用于合规授权与店铺能力。
      </p>
      {netlifyNote && <p className="sim-hint open-platform-warn">{netlifyNote}</p>}

      {Object.values(platforms).map((p) => (
        <div key={p.platform} className="open-platform-row">
          <div className="open-platform-info">
            <strong>{p.label}</strong>
            <span className={`open-platform-badge ${p.connected ? 'on' : 'off'}`}>
              {p.connected ? '已连接' : p.configured ? '未授权' : '未配置'}
            </span>
            {p.sellerName && <span className="sim-hint"> · {p.sellerName}</span>}
            {p.uid && <span className="sim-hint"> · uid {p.uid}</span>}
            <p className="sim-hint">{p.note}</p>
          </div>
          <div className="open-platform-actions">
            {p.platform === 'xiaohongshu_ark' && p.configured && (
              <>
                <button type="button" className="sim-link-btn" onClick={() => connect('/api/open-platform/xhs/authorize')}>
                  授权连接
                </button>
                {p.connected && (
                  <button type="button" className="sim-link-btn" onClick={refreshXhs}>
                    刷新 Token
                  </button>
                )}
              </>
            )}
            {p.platform === 'weibo' && p.configured && (
              <button type="button" className="sim-link-btn" onClick={() => connect('/api/open-platform/weibo/authorize')}>
                授权连接
              </button>
            )}
            {p.platform === 'justone' && (
              <a className="sim-link-btn" href="https://docs.justoneapi.com" target="_blank" rel="noreferrer">
                获取 Token
              </a>
            )}
            {p.connected && !p.fromEnv && p.platform !== 'justone' && p.platform !== 'serper' && (
              <button type="button" className="sim-link-btn danger" onClick={() => disconnect(p.platform)}>
                断开
              </button>
            )}
            {p.docs && (
              <a className="sim-link-btn" href={p.docs} target="_blank" rel="noreferrer">
                文档
              </a>
            )}
          </div>
        </div>
      ))}

      <button type="button" className="sim-btn-ghost" onClick={load}>
        刷新状态
      </button>
      {msg && <p className="sim-hint open-platform-msg">{msg}</p>}
    </div>
  );
}
