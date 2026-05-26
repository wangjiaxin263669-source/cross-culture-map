import React, { useState, useEffect, useCallback } from 'react';
import {
  listChatSessions,
  getChatSession,
  listReports,
  getReport,
  listSimResearchSessions,
  getSimResearchSession,
  deleteChatSession,
  deleteReport,
  deleteSimResearchSession,
} from '../services/historyApi.js';
import { getSimStepLabel } from '../utils/simResearchDraft';

function HistoryRow({ title, meta, onOpen, onDelete, deleting }) {
  return (
    <div className="history-item-row">
      <button type="button" className="history-item" onClick={onOpen} disabled={deleting}>
        <strong>{title}</strong>
        <small>{meta}</small>
      </button>
      <button
        type="button"
        className="history-item-delete"
        disabled={deleting}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label="删除"
      >
        删除
      </button>
    </div>
  );
}

export default function HistoryDrawer({
  open,
  refreshKey = 0,
  onClose,
  onLoadChat,
  onLoadReport,
  onLoadSimSession,
  onHistoryMutated,
}) {
  const [tab, setTab] = useState('chats');
  const [chats, setChats] = useState([]);
  const [reports, setReports] = useState([]);
  const [simSessions, setSimSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

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

  const confirmDelete = (label) =>
    window.confirm(`确定删除这条${label}？删除后无法恢复。`);

  const handleDelete = async (kind, id) => {
    const labels = { chat: '对话', report: '报告', sim: '模拟调研' };
    if (!confirmDelete(labels[kind] || '记录')) return;
    setDeletingId(id);
    setError('');
    try {
      if (kind === 'chat') await deleteChatSession(id);
      else if (kind === 'report') await deleteReport(id);
      else await deleteSimResearchSession(id);
      await refresh();
      onHistoryMutated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

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
                <HistoryRow
                  key={s.id}
                  title={s.title}
                  meta={`${s.market?.title ? `${s.market.title} · ` : ''}${new Date(s.updatedAt).toLocaleString('zh-CN')}`}
                  deleting={deletingId === s.id}
                  onOpen={() => handleOpenChat(s.id)}
                  onDelete={() => handleDelete('chat', s.id)}
                />
              ))
            ))}

          {tab === 'sim' &&
            (simSessions.length === 0 && !loading ? (
              <p className="history-empty">
                暂无模拟调研记录。关闭国家侧栏时可选择「保存到历史」。
              </p>
            ) : (
              simSessions.map((s) => (
                <HistoryRow
                  key={s.id}
                  title={s.title}
                  meta={`${s.market?.title ? `${s.market.title} · ` : ''}${getSimStepLabel(s.step)}${s.personaCount ? ` · ${s.personaCount} 人设` : ''}${s.interviewCount ? ` · ${s.interviewCount} 场访谈` : ''} · ${new Date(s.updatedAt).toLocaleString('zh-CN')}`}
                  deleting={deletingId === s.id}
                  onOpen={() => handleOpenSim(s.id)}
                  onDelete={() => handleDelete('sim', s.id)}
                />
              ))
            ))}

          {tab === 'reports' &&
            (reports.length === 0 && !loading ? (
              <p className="history-empty">暂无三步分析报告。完整模拟调研流程请见「模拟调研」标签。</p>
            ) : (
              reports.map((r) => (
                <HistoryRow
                  key={r.id}
                  title={r.title}
                  meta={`${r.type === 'sim_research' ? '（旧）模拟调研 · ' : '三步分析 · '}${new Date(r.createdAt).toLocaleString('zh-CN')}`}
                  deleting={deletingId === r.id}
                  onOpen={() => handleOpenReport(r.id)}
                  onDelete={() => handleDelete('report', r.id)}
                />
              ))
            ))}
        </div>
      </div>
    </div>
  );
}
