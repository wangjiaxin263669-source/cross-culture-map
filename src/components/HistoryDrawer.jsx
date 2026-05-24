import React, { useState, useEffect, useCallback } from 'react';
import {
  listChatSessions,
  getChatSession,
  listReports,
  getReport,
} from '../services/historyApi.js';

export default function HistoryDrawer({
  open,
  onClose,
  onLoadChat,
  onLoadReport,
}) {
  const [tab, setTab] = useState('chats');
  const [chats, setChats] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setError('');
    try {
      const [c, r] = await Promise.all([listChatSessions(), listReports()]);
      setChats(c);
      setReports(r);
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleOpenChat = async (id) => {
    try {
      const session = await getChatSession(id);
      onLoadChat?.(session);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenReport = async (id) => {
    try {
      const report = await getReport(id);
      onLoadReport?.(report);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!open) return null;

  return (
    <div className="history-drawer-overlay" onClick={onClose}>
      <div className="history-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="history-drawer-header">
          <h3>我的历史</h3>
          <button type="button" className="history-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="history-tabs">
          <button
            type="button"
            className={tab === 'chats' ? 'active' : ''}
            onClick={() => setTab('chats')}
          >
            对话 ({chats.length})
          </button>
          <button
            type="button"
            className={tab === 'reports' ? 'active' : ''}
            onClick={() => setTab('reports')}
          >
            报告 ({reports.length})
          </button>
        </div>

        {error && <div className="history-error">{error}</div>}
        {loading && <div className="history-loading">加载中…</div>}

        <div className="history-list">
          {tab === 'chats' &&
            (chats.length === 0 && !loading ? (
              <p className="history-empty">暂无对话记录</p>
            ) : (
              chats.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="history-item"
                  onClick={() => handleOpenChat(s.id)}
                >
                  <strong>{s.title}</strong>
                  <small>
                    {s.market?.title ? `${s.market.title} · ` : ''}
                    {new Date(s.updatedAt).toLocaleString('zh-CN')}
                  </small>
                </button>
              ))
            ))}

          {tab === 'reports' &&
            (reports.length === 0 && !loading ? (
              <p className="history-empty">暂无报告记录</p>
            ) : (
              reports.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="history-item"
                  onClick={() => handleOpenReport(r.id)}
                >
                  <strong>{r.title}</strong>
                  <small>
                    {r.type === 'sim_research' ? '模拟调研 · ' : ''}
                    {new Date(r.createdAt).toLocaleString('zh-CN')}
                  </small>
                </button>
              ))
            ))}
        </div>
      </div>
    </div>
  );
}
