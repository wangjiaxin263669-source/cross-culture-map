import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import ReportMarkdown from './components/ReportMarkdown';
import CulturalStoryPanel from './components/CulturalStoryPanel';
import RegionPicker from './components/RegionPicker';
import AuthPage from './components/AuthPage';
import { useAuth } from './context/AuthContext';
import { useAiModel } from './context/AiModelContext';
import AiModelSelector from './components/AiModelSelector';
import {
  globeLabelsData,
  normalizeMarket,
  getMarketDisplayTitle,
  getRegionsByParentId,
  getCountryById,
} from './data/markets';
import { sendChatMessage, generateReport, checkAiHealth } from './services/aiApi';
import { saveChatSession, saveReport, saveSimResearchSession } from './services/historyApi';
import { shouldPersistSimDraft } from './utils/simResearchDraft';
import SimExitConfirmModal from './components/SimExitConfirmModal';
import './App.css';

const GlobeScene = lazy(() => import('./components/GlobeScene.jsx'));
const MarketRadarChart = lazy(() => import('./components/MarketRadarChart.jsx'));
const SimulatedResearchPanel = lazy(() => import('./components/SimulatedResearchPanel.jsx'));
const HistoryDrawer = lazy(() => import('./components/HistoryDrawer.jsx'));
const RechargeModal = lazy(() => import('./components/RechargeModal.jsx'));

function ChunkFallback({ label = '加载中…' }) {
  return (
    <div className="chunk-loading" aria-busy="true">
      {label}
    </div>
  );
}

const DEFAULT_CHAT_GREETING = {
  role: 'ai',
  text: '您好！我是面向中国产品/UX 团队的跨文化顾问。请选定国家/地区，说明产品、用户、场景与目标。我会从用户真实感受（非上帝视角）出发，结合项目/B计划、数据、商业与全局思维，用产品语言给出三步分析与全链路落地建议。',
};

function App() {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const { modelId, current: currentModel } = useAiModel();
  const globeEl = useRef();
  const threeStepSectionRef = useRef(null);
  const simSectionRef = useRef(null);
  const simPanelRef = useRef(null);
  const simSnapshotRef = useRef(null);
  const pendingSimSessionRef = useRef(null);
  const [simExit, setSimExit] = useState(null);
  const [simExitSaving, setSimExitSaving] = useState(false);
  const [simExitError, setSimExitError] = useState('');
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [threeStepHighlight, setThreeStepHighlight] = useState(false);

  const [userIdea, setUserIdea] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiError, setAiError] = useState('');

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const chatEndRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([DEFAULT_CHAT_GREETING]);
  const [chatSessionId, setChatSessionId] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [aiHealth, setAiHealth] = useState(null);

  const displayTitle = useMemo(
    () => getMarketDisplayTitle(selectedMarket),
    [selectedMarket],
  );

  /** 有下属地区的国家：展示全国概览 + 地区切换 */
  const regionContext = useMemo(() => {
    if (!selectedMarket) return null;
    let parentId;
    if (selectedMarket.marketType === 'country' && selectedMarket.hasRegions) {
      parentId = selectedMarket.id;
    } else if (selectedMarket.marketType === 'region' && selectedMarket.parentId) {
      parentId = selectedMarket.parentId;
    } else {
      return null;
    }
    const parentCountry = getCountryById(parentId);
    const regions = getRegionsByParentId(parentId);
    if (!parentCountry || !regions.length) return null;
    return { parentCountry, regions };
  }, [selectedMarket]);

  /** 地球挂载后再启用自转（登录后才会渲染 Globe，不能用空依赖的 useEffect） */
  const handleGlobeReady = useCallback(() => {
    const apply = () => {
      const globe = globeEl.current;
      if (!globe?.controls) return false;
      const controls = globe.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4;
      globe.pointOfView({ lat: 22, lng: 105, altitude: 1.75 });
      return true;
    };
    if (!apply()) requestAnimationFrame(apply);
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    const run = () => {
      checkAiHealth()
        .then(setAiHealth)
        .catch(() => setAiHealth({ aiConfigured: false }));
    };
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(run, { timeout: 2500 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(run, 400);
    return () => clearTimeout(t);
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  const bumpHistory = useCallback(() => {
    setHistoryRefreshKey((k) => k + 1);
  }, []);

  const handleSimSnapshotChange = useCallback((snapshot) => {
    simSnapshotRef.current = snapshot;
  }, []);

  const readSimSnapshot = useCallback(() => {
    return simPanelRef.current?.getSnapshot?.() || simSnapshotRef.current || null;
  }, []);

  const promptSimExitSave = useCallback(() => {
    const snap = readSimSnapshot();
    if (!snap || !shouldPersistSimDraft(snap)) {
      return Promise.resolve('discard');
    }
    return new Promise((resolve) => {
      setSimExitError('');
      setSimExit({ snap, resolve });
    });
  }, [readSimSnapshot]);

  const dismissPanel = useCallback(() => {
    setSelectedMarket(null);
    setAiError('');
    simSnapshotRef.current = null;
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 22, lng: 105, altitude: 1.75 }, 1000);
    }
  }, []);

  const finishClosePanel = useCallback(() => {
    dismissPanel();
  }, [dismissPanel]);

  const closeSimExitModal = useCallback((choice) => {
    setSimExit((prev) => {
      prev?.resolve?.(choice);
      return null;
    });
    setSimExitSaving(false);
    setSimExitError('');
  }, []);

  const handleSimExitSave = useCallback(async () => {
    if (!user) {
      setSimExitError('请先登录后再保存到「我的历史」');
      return;
    }
    const snap = simExit?.snap;
    if (!snap) return;
    setSimExitSaving(true);
    setSimExitError('');
    try {
      const title =
        snap.researchTopic?.trim().slice(0, 48) ||
        `${snap.marketTitle || '跨文化'} · 模拟调研`;
      const session = await saveSimResearchSession({
        id: snap.historySessionId || undefined,
        title,
        market: snap.marketId ? { id: snap.marketId, title: snap.marketTitle } : null,
        step: snap.step,
        researchTopic: snap.researchTopic,
        audienceCriteria: snap.audienceCriteria,
        guideQuestions: snap.guideQuestions,
        corpusSources: snap.corpusSources,
        corpusSnippets: snap.corpusSnippets,
        researchMaterials: snap.researchMaterials,
        personas: snap.personas,
        interviews: snap.interviews,
        report: snap.report,
        interviewBatchId: snap.interviewBatchId,
        personaCount: snap.personaCount,
        modelId: snap.modelId,
        materialsStarted: snap.materialsStarted,
      });
      simPanelRef.current?.notifyHistorySaved?.(session.id);
      bumpHistory();
      closeSimExitModal('save');
    } catch (err) {
      setSimExitError(err.message || '保存失败，请稍后重试');
      setSimExitSaving(false);
    }
  }, [user, simExit, bumpHistory, closeSimExitModal]);

  const hasUnloadDraft = useCallback(() => {
    const snap = readSimSnapshot();
    if (snap && shouldPersistSimDraft(snap)) return true;
    if (userIdea?.trim() && !aiResult) return true;
    if (chatInput.trim()) return true;
    return false;
  }, [readSimSnapshot, userIdea, aiResult, chatInput]);

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!hasUnloadDraft()) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnloadDraft]);

  const handleLabelClick = async (raw) => {
    const market = normalizeMarket(raw);
    const isDifferentMarket =
      selectedMarket && market?.id && market.id !== selectedMarket.id;
    if (isDifferentMarket) {
      const choice = await promptSimExitSave();
      if (choice === 'cancel') return;
    }
    setSelectedMarket(market);
    if (isDifferentMarket) {
      setAiError('');
    }
    if (globeEl.current && market?.lat != null && market?.lng != null) {
      globeEl.current.pointOfView(
        { lat: market.lat, lng: market.lng, altitude: market.marketType === 'region' ? 1.6 : 1.9 },
        800,
      );
    }
  };

  const closePanel = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const choice = await promptSimExitSave();
    if (choice === 'cancel') return;
    finishClosePanel();
  };

  const handleExploreMap = async () => {
    if (selectedMarket) {
      const choice = await promptSimExitSave();
      if (choice === 'cancel') return;
      dismissPanel();
    }
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 22, lng: 105, altitude: 1.75 }, 1000);
    }
  };

  const focusParentCountry = (parentId, lat, lng, altitude = 1.7) => {
    const country = getCountryById(parentId);
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat, lng, altitude }, 1000);
    }
    if (country) {
      handleLabelClick(country);
    }
  };

  const persistChat = useCallback(
    async (messages, sessionId = chatSessionId) => {
      if (!user) return sessionId;
      const hasUserMsg = messages?.some((m) => m.role === 'user' && m.text?.trim());
      if (!hasUserMsg) return sessionId;
      const firstUser = messages.find((m) => m.role === 'user');
      const title = firstUser?.text?.slice(0, 48) || '跨文化对话';
      try {
        const session = await saveChatSession({
          id: sessionId || undefined,
          title,
          messages,
          market: selectedMarket
            ? { id: selectedMarket.id, title: displayTitle }
            : null,
        });
        if (!sessionId) setChatSessionId(session.id);
        bumpHistory();
        return session.id;
      } catch (err) {
        console.warn('[history] 对话保存失败:', err.message);
        return sessionId;
      }
    },
    [user, chatSessionId, selectedMarket, displayTitle, bumpHistory],
  );

  const persistAnalysisReport = useCallback(
    async (content, productIdea, type = 'three_step', titleSuffix = '三步分析') => {
      if (!user || !content?.trim()) return;
      try {
        await saveReport({
          type,
          title: `${displayTitle || '跨文化'} · ${titleSuffix}`,
          content,
          productIdea: productIdea || '',
          market: selectedMarket
            ? { id: selectedMarket.id, title: displayTitle }
            : null,
        });
        bumpHistory();
      } catch (err) {
        console.warn('[history] 报告保存失败:', err.message);
      }
    },
    [user, selectedMarket, displayTitle, bumpHistory],
  );

  const restoreMarketFromMeta = (marketMeta) => {
    if (!marketMeta?.id) return;
    const found =
      getCountryById(marketMeta.id) ||
      globeLabelsData.find((d) => d.id === marketMeta.id);
    if (found) setSelectedMarket(normalizeMarket(found));
  };

  const handleNewChat = () => {
    setChatSessionId(null);
    setChatMessages([DEFAULT_CHAT_GREETING]);
    setChatError('');
  };

  const handleLoadChatFromHistory = (session) => {
    setChatSessionId(session.id);
    setChatMessages(session.messages?.length ? session.messages : [DEFAULT_CHAT_GREETING]);
    restoreMarketFromMeta(session.market);
    setIsChatOpen(true);
  };

  const handleLoadReportFromHistory = (report) => {
    restoreMarketFromMeta(report.market);
    if (report.productIdea) setUserIdea(report.productIdea);
    setAiResult(report.content || '');
    setAiError('');
    threeStepSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLoadSimFromHistory = (session) => {
    pendingSimSessionRef.current = session;
    restoreMarketFromMeta(session.market);
  };

  useEffect(() => {
    if (!selectedMarket || !pendingSimSessionRef.current) return;
    const session = pendingSimSessionRef.current;
    const tryLoad = () => {
      if (!simPanelRef.current) return false;
      simPanelRef.current.loadFromHistory(session);
      pendingSimSessionRef.current = null;
      return true;
    };
    if (!tryLoad()) {
      const id = requestAnimationFrame(() => tryLoad());
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [selectedMarket]);

  const handleSyncFromSimResearch = async (productIdea, { autoGenerate = false } = {}) => {
    setUserIdea(productIdea);
    setAiError('');
    setThreeStepHighlight(true);
    setTimeout(() => setThreeStepHighlight(false), 4000);
    threeStepSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (autoGenerate && productIdea?.trim() && selectedMarket) {
      setIsGenerating(true);
      setAiResult('');
      try {
        const report = await generateReport({
          productIdea,
          country: selectedMarket,
          model: modelId,
        });
        setAiResult(report);
        await persistAnalysisReport(report, productIdea);
      } catch (err) {
        setAiError(err.message || '报告生成失败');
      } finally {
        setIsGenerating(false);
        refreshUser();
      }
    }
  };

  const handleAiAnalysis = async () => {
    if (!userIdea?.trim() || !selectedMarket) return;
    setIsGenerating(true);
    setAiError('');
    setAiResult('');
    try {
      const report = await generateReport({
        productIdea: userIdea,
        country: selectedMarket,
        model: modelId,
      });
      setAiResult(report);
      await persistAnalysisReport(report, userIdea);
    } catch (err) {
      setAiError(err.message || '报告生成失败，请确认后端已启动且已配置 DEEPSEEK_API_KEY');
      if (err.code === 'INSUFFICIENT_BALANCE') setRechargeOpen(true);
    } finally {
      setIsGenerating(false);
      refreshUser();
    }
  };

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userText = chatInput.trim();
    const newMsg = { role: 'user', text: userText };
    const nextMessages = [...chatMessages, newMsg];
    setChatMessages(nextMessages);
    setChatInput('');
    setChatError('');
    setIsChatLoading(true);

    try {
      const history = nextMessages
        .slice(0, -1)
        .filter((m) => m.role === 'user' || m.role === 'ai')
        .filter((m, i, arr) => !(i === 0 && m.role === 'ai' && arr.length === 1))
        .map((m) => ({ role: m.role, text: m.text }));

      const reply = await sendChatMessage({
        message: userText,
        history,
        country: selectedMarket,
        model: modelId,
      });
      const withReply = [...nextMessages, { role: 'ai', text: reply }];
      setChatMessages(withReply);
      await persistChat(withReply);
    } catch (err) {
      const msg = err.message || '对话失败';
      setChatError(msg);
      if (err.code === 'INSUFFICIENT_BALANCE') setRechargeOpen(true);
      setChatMessages((prev) => [
        ...prev,
        { role: 'ai', text: `请求失败：${msg}` },
      ]);
      await persistChat(nextMessages);
    } finally {
      setIsChatLoading(false);
      refreshUser();
    }
  };

  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-loading">加载中…</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const avatarLetter = (user.displayName || user.username || '?').charAt(0).toUpperCase();

  return (
    <div className="app-container">
      <div className="bg-gradient-mask"></div>

      <div className="top-bar">
        <div className="brand-logo">
          <div className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <div className="brand-text">
            <h2>CROSS-CULTURE</h2>
            <p>跨文化研究设计平台</p>
          </div>
        </div>

        <div className="center-nav">
          <span className="nav-item active">地区地图</span>
          <AiModelSelector compact />
        </div>

        <div className="right-profile-wrap">
          <div
            className="right-profile"
            role="button"
            tabIndex={0}
            onClick={() => setProfileMenuOpen((open) => !open)}
            onKeyDown={(e) => e.key === 'Enter' && setProfileMenuOpen((open) => !open)}
          >
            <div className="avatar">
              {user.avatar ? (
                <img className="avatar-photo" src={user.avatar} alt="" />
              ) : (
                avatarLetter
              )}
            </div>
            <div className="user-info">
              <span>{user.displayName || user.username}</span>
              <small>余额 ¥{user.balanceYuan ?? '0.00'}</small>
            </div>
          </div>
          {profileMenuOpen && (
            <>
              <button
                type="button"
                className="profile-menu-backdrop"
                aria-label="关闭菜单"
                onClick={() => setProfileMenuOpen(false)}
              />
              <div className="profile-menu">
                <button
                  type="button"
                  onClick={() => {
                    setRechargeOpen(true);
                    setProfileMenuOpen(false);
                  }}
                >
                  充值余额
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHistoryOpen(true);
                    setProfileMenuOpen(false);
                  }}
                >
                  历史记录
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm('是否确认退出？')) return;
                    logout();
                    setProfileMenuOpen(false);
                  }}
                >
                  退出登录
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="hero-section">
        <div className="live-tag">
          <span className="dot"></span> 地区视图 &nbsp;&nbsp;
          <span className="dot" style={{ background: '#fff', boxShadow: 'none' }}></span> 在线
        </div>
        <h1>跨文化<br/><span className="highlight">研究设计</span></h1>
        <p>白色标签为国家整体介绍；青色标签为省/州/县等地方故事。两者并存，可先看全国再看地区。</p>
        <div className="action-buttons">
          <div className="action-buttons-row">
            <button type="button" className="btn-outline" onClick={handleExploreMap}>探索地图 ➔</button>
            <button type="button" className="btn-outline" onClick={() => focusParentCountry('china', 35, 105)}>中国 ➔</button>
            <button type="button" className="btn-outline" onClick={() => focusParentCountry('usa', 37, -95)}>美国 ➔</button>
            <button type="button" className="btn-outline" onClick={() => focusParentCountry('japan', 36, 138, 1.6)}>日本 ➔</button>
          </div>
          <button type="button" className="btn-outline btn-outline-secondary" onClick={handleToggleChat}>与 AI 对话 ➔</button>
        </div>
      </div>

      {isChatOpen && (
        <div className="global-chat-modal">
          <div className="chat-header">
            <div className="chat-header-title">
              <h3>✨ 跨文化研究专家 · DeepSeek</h3>
              {aiHealth?.wallet?.costsYuan?.chat && (
                <span className="chat-cost-hint">¥{aiHealth.wallet.costsYuan.chat}/次</span>
              )}
            </div>
            <div className="chat-header-actions">
              <button type="button" className="new-chat-btn" onClick={handleNewChat}>
                新对话
              </button>
              <button className="close-chat-btn" onClick={handleToggleChat}>✕ 隐藏</button>
            </div>
          </div>
          <div className="chat-messages">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            {isChatLoading && <div className="chat-bubble ai typing">思考中…</div>}
            <div ref={chatEndRef} />
          </div>
          {chatError && <div className="chat-error-banner">{chatError}</div>}
          {selectedMarket && (
            <div className="chat-context-hint">
              已关联目标市场：{displayTitle}
            </div>
          )}
          <div className="chat-input-area">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="输入地区、文化维度或设计构想..."
            />
            <button onClick={handleSendMessage} disabled={isChatLoading || !chatInput.trim()}>
              发送
            </button>
          </div>
        </div>
      )}

      <div className="globe-wrapper globe-layer">
        <Suspense fallback={<ChunkFallback label="地球加载中…" />}>
          <GlobeScene
            ref={globeEl}
            onGlobeReady={handleGlobeReady}
            labelsData={globeLabelsData}
            onLabelClick={handleLabelClick}
          />
        </Suspense>
      </div>

      {selectedMarket && (
        <div className="info-panel">
          <header className="info-panel-header">
            <button
              type="button"
              className="info-panel-close"
              onClick={closePanel}
              aria-label="关闭面板"
            >
              ×
            </button>

            {selectedMarket.marketType === 'region' && selectedMarket.parentTitle && (
              <div className="market-breadcrumb">
                <span className="market-breadcrumb-parent">{selectedMarket.parentTitle}</span>
                <span className="market-breadcrumb-sep">/</span>
                <span className="market-breadcrumb-region">{selectedMarket.title}</span>
              </div>
            )}
            {selectedMarket.marketType === 'country' && selectedMarket.hasRegions && (
              <p className="info-panel-eyebrow">全国整体 · 国家级文化介绍</p>
            )}

            <h2 className="info-panel-title">{displayTitle}</h2>
            {selectedMarket.tagline && (
              <p className="country-tagline">{selectedMarket.tagline}</p>
            )}

            <nav className="panel-jump-strip" aria-label="跳转到功能区">
              <button
                type="button"
                className="panel-jump-item panel-jump-item--sim"
                onClick={() =>
                  simSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              >
                <span className="panel-jump-label">模拟调研</span>
                <span className="panel-jump-desc">人设 · 访谈 · 报告</span>
              </button>
              <button
                type="button"
                className="panel-jump-item panel-jump-item--analysis"
                onClick={() =>
                  threeStepSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              >
                <span className="panel-jump-label">三步分析</span>
                <span className="panel-jump-desc">跨文化智能报告</span>
              </button>
            </nav>
          </header>

          <p className="country-overview">{selectedMarket.overview}</p>

          {regionContext && (
            <RegionPicker
              parentCountry={regionContext.parentCountry}
              regions={regionContext.regions}
              activeId={selectedMarket.id}
              onSelectCountry={(c) => handleLabelClick(c)}
              onSelectRegion={(r) => handleLabelClick(r)}
            />
          )}

          <div className="panel-radar-chart">
            <Suspense fallback={<ChunkFallback label="图表加载中…" />}>
              <MarketRadarChart data={selectedMarket.radarData} />
            </Suspense>
          </div>

          <div className="panel-density-block">
            <h3 className="panel-subheading section-heading-plain">本地化排版偏好</h3>
            <div className="panel-density-label">
              <span>界面信息密度</span>
              <span>{selectedMarket.density}%</span>
            </div>
            <div className="density-track">
              <div className="density-fill" style={{ width: `${selectedMarket.density}%` }}></div>
            </div>
          </div>

          <CulturalStoryPanel country={selectedMarket} />

          <div ref={simSectionRef}>
            <Suspense fallback={<ChunkFallback label="模拟调研加载中…" />}>
              <SimulatedResearchPanel
                key={selectedMarket.id}
                ref={simPanelRef}
                market={selectedMarket}
                marketTitle={displayTitle}
                aiConfigured={Boolean(aiHealth?.aiConfigured ?? aiHealth?.geminiConfigured)}
                walletCostsYuan={aiHealth?.wallet?.costsYuan}
                onSnapshotChange={handleSimSnapshotChange}
                onSyncToThreeStepReport={handleSyncFromSimResearch}
                onSavedToHistory={() => bumpHistory()}
                onInsufficientBalance={() => setRechargeOpen(true)}
              />
            </Suspense>
          </div>

          <div
            ref={threeStepSectionRef}
            className={`three-step-section ${threeStepHighlight ? 'three-step-highlight' : ''}`}
          >
            <h3 className="three-step-heading section-heading-plain">DeepSeek 跨文化智能分析</h3>
            {aiHealth && (
              <div className={`ai-status-banner ${(aiHealth.aiConfigured ?? aiHealth.geminiConfigured) ? 'ok' : ''}`}>
                {(aiHealth.aiConfigured ?? aiHealth.geminiConfigured)
                  ? `智能体已就绪 · 当前模型 ${currentModel?.label || modelId} · 知识库 ${aiHealth.knowledge?.chunkCount ?? 0} 段（可在顶部切换 Flash / Pro）`
                  : '请在项目根目录 .env 中设置 DEEPSEEK_API_KEY（见 .env.example）'}
              </div>
            )}
            <textarea
              className="three-step-textarea"
              value={userIdea}
              onChange={(e) => setUserIdea(e.target.value)}
              placeholder={`例：产品=二次元电商App；用户=18-25岁；场景=手机购物；目标=进入${selectedMarket.title}。可写当前阶段（调研/设计/开发/准备上线）…`}
            />
            <button
              type="button"
              className="btn-generate-primary"
              onClick={handleAiAnalysis}
              disabled={!userIdea || isGenerating}
            >
              {isGenerating ? 'AI 生成报告中（约 20–40 秒，请勿关闭）…' : '生成跨文化三步分析报告 ➔'}
            </button>

            {aiError && <div className="ai-error">{aiError}</div>}
            {aiResult && (
              <div className="ai-report-box">
                <ReportMarkdown text={aiResult} />
              </div>
            )}
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        <HistoryDrawer
          open={historyOpen}
          refreshKey={historyRefreshKey}
          onClose={() => setHistoryOpen(false)}
          onLoadChat={handleLoadChatFromHistory}
          onLoadReport={handleLoadReportFromHistory}
          onLoadSimSession={handleLoadSimFromHistory}
          onHistoryMutated={bumpHistory}
        />
      </Suspense>

      <Suspense fallback={null}>
        <RechargeModal
          open={rechargeOpen}
          onClose={() => setRechargeOpen(false)}
          balanceYuan={user.balanceYuan}
          userPhone={user.phone || ''}
          onSuccess={() => refreshUser()}
        />
      </Suspense>

      <SimExitConfirmModal
        open={Boolean(simExit)}
        step={simExit?.snap?.step}
        researchTopic={simExit?.snap?.researchTopic}
        loggedIn={Boolean(user)}
        saving={simExitSaving}
        error={simExitError}
        onSave={handleSimExitSave}
        onDiscard={() => closeSimExitModal('discard')}
        onCancel={() => closeSimExitModal('cancel')}
      />
    </div>
  );
}

export default App;
