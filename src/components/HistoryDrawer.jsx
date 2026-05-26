import React, { useState, useEffect, useCallback } from 'react';
import {
  listChatSessions,
  getChatSession,
  listReports,
  getReport,
  listSimResearchSessions,
  getSimResearchSession,
} from '../services/historyApi.js';
import { getSimStepLabel } from '../utils/simResearchDraft';

export default function HistoryDrawer({
  open,
  refreshKey = 0,
  onClose,
  onLoadChat,
  onLoadReport,
  onLoadSimSession,
}) {
  const [tab, setTab] = useState('chats');
  const [chats, setChats] = useState([]);
  const [reports, setReports] = useState([]);
  const [simSessions, setSimSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setError('');
    try {
      const [c, r, sim] = await Promise.all([
        listChatSessions(),
        listReports(),
        listSimResearchSessions(),
      ]);
      setChats(c);
      setReports(r);
      setSimSessions(sim);
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [open, refreshKey]);

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

  const handleOpenSim = async (id) => {
    try {
      const session = await getSimResearchSession(id);
      onLoadSimSession?.(session);
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
            className={tab === 'sim' ? 'active' : ''}
            onClick={() => setTab('sim')}
          >
            模拟调研 ({simSessions.length})
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

          {tab === 'sim' &&
            (simSessions.length === 0 && !loading ? (
              <p className="history-empty">暂无模拟调研记录。退出国家面板时可选择「保存到历史」。</p>
            ) : (
              simSessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="history-item"
                  onClick={() => handleOpenSim(s.id)}
                >
                  <strong>{s.title}</strong>
                  <small>
                    {s.market?.title ? `${s.market.title} · ` : ''}
                    {getSimStepLabel(s.step)}
                    {s.personaCount ? ` · ${s.personaCount} 人设` : ''}
                    {s.interviewCount ? ` · ${s.interviewCount} 场访谈` : ''}
                    {' · '}
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
