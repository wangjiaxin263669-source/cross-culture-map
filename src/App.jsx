import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Globe from 'react-globe.gl';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import ReportMarkdown from './components/ReportMarkdown';
import CulturalStoryPanel from './components/CulturalStoryPanel';
import RegionPicker from './components/RegionPicker';
import SimulatedResearchPanel from './components/SimulatedResearchPanel';
import AuthPage from './components/AuthPage';
import HistoryDrawer from './components/HistoryDrawer';
import RechargeModal from './components/RechargeModal';
import { useAuth } from './context/AuthContext';
import {
  globeLabelsData,
  normalizeMarket,
  getMarketDisplayTitle,
  getRegionsByParentId,
  getCountryById,
} from './data/markets';
import { sendChatMessage, generateReport, checkAiHealth } from './services/aiApi';
import { saveChatSession, saveReport } from './services/historyApi';
import './App.css';

const DEFAULT_CHAT_GREETING = {
  role: 'ai',
  text: '您好！我是面向中国产品/UX 团队的跨文化顾问。请选定国家/地区，说明产品、用户、场景与目标。我会从用户真实感受（非上帝视角）出发，结合项目/B计划、数据、商业与全局思维，用产品语言给出三步分析与全链路落地建议。',
};

function App() {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const globeEl = useRef();
  const threeStepSectionRef = useRef(null);
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
      globe.pointOfView({ lat: 20, lng: 0, altitude: 2.2 });
      return true;
    };
    if (!apply()) requestAnimationFrame(apply);
  }, []);

  useEffect(() => {
    checkAiHealth()
      .then(setAiHealth)
      .catch(() => setAiHealth({ aiConfigured: false }));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  const handleLabelClick = (raw) => {
    const market = normalizeMarket(raw);
    setSelectedMarket(market);
    setAiResult('');
    setAiError('');
    if (globeEl.current && market?.lat != null && market?.lng != null) {
      globeEl.current.pointOfView(
        { lat: market.lat, lng: market.lng, altitude: market.marketType === 'region' ? 1.6 : 1.9 },
        800,
      );
    }
  };

  const closePanel = () => {
    setSelectedMarket(null);
    setAiResult('');
    setAiError('');
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 1000);
    }
  };

  const handleExploreMap = () => {
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 1000);
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
      if (!user || !messages?.length) return sessionId;
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
        return session.id;
      } catch {
        return sessionId;
      }
    },
    [user, chatSessionId, selectedMarket, displayTitle],
  );

  const persistAnalysisReport = useCallback(
    async (content, productIdea) => {
      if (!user || !content?.trim()) return;
      try {
        await saveReport({
          type: 'three_step',
          title: `${displayTitle || '跨文化'} · 三步分析`,
          content,
          productIdea: productIdea || '',
          market: selectedMarket
            ? { id: selectedMarket.id, title: displayTitle }
            : null,
        });
      } catch {
        /* 静默失败，不影响主流程 */
      }
    },
    [user, selectedMarket, displayTitle],
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
        });
        setAiResult(report);
        await persistAnalysisReport(report, productIdea);
      } catch (err) {
        setAiError(err.message || '报告生成失败');
      } finally {
        setIsGenerating(false);
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
            <p>Design Decision Platform</p>
          </div>
        </div>

        <div className="center-nav">
          <span className="nav-item active">REGION MAP</span>
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
          <span className="dot"></span> REGION VIEW &nbsp;&nbsp;
          <span className="dot" style={{ background: '#fff', boxShadow: 'none' }}></span> Live
        </div>
        <h1>跨文化<br/><span className="highlight">研究设计</span></h1>
        <p>白色标签为国家整体介绍；青色标签为省/州/县等地方故事。两者并存，可先看全国再看地区。</p>
        <div className="action-buttons">
          <button className="btn-outline" onClick={handleExploreMap}>Explore the Map ➔</button>
          <button className="btn-outline" onClick={() => focusParentCountry('china', 35, 105)}>中国 ➔</button>
          <button className="btn-outline" onClick={() => focusParentCountry('usa', 37, -95)}>美国 ➔</button>
          <button className="btn-outline" onClick={() => focusParentCountry('japan', 36, 138, 1.6)}>日本 ➔</button>
          <button className="btn-outline" onClick={handleToggleChat}>Chat with AI ➔</button>
        </div>
      </div>

      {isChatOpen && (
        <div className="global-chat-modal">
          <div className="chat-header">
            <h3>✨ 跨文化研究专家 · DeepSeek</h3>
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
        <Globe
          ref={globeEl}
          onGlobeReady={handleGlobeReady}
          globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
          backgroundImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
          labelsData={globeLabelsData}
          labelLat={(d) => d.lat}
          labelLng={(d) => d.lng}
          labelText={(d) => d.label}
          labelSize={(d) => (d.marketType === 'region' ? 1.35 : d.hasRegions ? 2 : 1.8)}
          labelDotRadius={(d) => (d.marketType === 'region' ? 0.45 : d.hasRegions ? 0.75 : 0.6)}
          labelColor={(d) => (d.marketType === 'region' ? '#7ee8fa' : d.hasRegions ? '#ffd966' : 'white')}
          labelResolution={2}
          onLabelClick={handleLabelClick}
        />
      </div>

      {selectedMarket && (
        <div className="info-panel">
          <button className="close-btn" onClick={closePanel}>✕ Close</button>

          {selectedMarket.marketType === 'region' && selectedMarket.parentTitle && (
            <div className="market-breadcrumb">
              <span className="market-breadcrumb-parent">{selectedMarket.parentTitle}</span>
              <span className="market-breadcrumb-sep">/</span>
              <span className="market-breadcrumb-region">{selectedMarket.title}</span>
            </div>
          )}
          {selectedMarket.marketType === 'country' && selectedMarket.hasRegions && (
            <div className="market-level-badge market-level-badge-country">全国整体 · 国家级文化介绍</div>
          )}

          <h2>{displayTitle}</h2>
          {selectedMarket.tagline && (
            <p className="country-tagline">{selectedMarket.tagline}</p>
          )}
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

          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={selectedMarket.radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.15)" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#8da4c4', fontSize: 11 }} />
                <Tooltip wrapperStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Radar name="维度数据" dataKey="score" stroke="#00f0ff" strokeWidth={2} fill="#00f0ff" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h3 className="panel-subheading">🎨 本地化排版偏好</h3>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: '#8da4c4' }}>
                <span>UI 信息密度 (Info Density)</span>
                <span>{selectedMarket.density}%</span>
              </div>
              <div className="density-track">
                <div className="density-fill" style={{ width: `${selectedMarket.density}%` }}></div>
              </div>
            </div>
          </div>

          <CulturalStoryPanel country={selectedMarket} />

          <SimulatedResearchPanel
            market={selectedMarket}
            marketTitle={displayTitle}
            aiConfigured={Boolean(aiHealth?.aiConfigured ?? aiHealth?.geminiConfigured)}
            onSyncToThreeStepReport={handleSyncFromSimResearch}
            onReportGenerated={(content, topic) =>
              saveReport({
                type: 'sim_research',
                title: `${displayTitle} · 模拟调研`,
                content,
                productIdea: topic || '',
                market: selectedMarket
                  ? { id: selectedMarket.id, title: displayTitle }
                  : null,
              }).catch(() => {})
            }
          />

          <div
            ref={threeStepSectionRef}
            className={`three-step-section ${threeStepHighlight ? 'three-step-highlight' : ''}`}
            style={{ marginTop: '30px' }}
          >
            <h3 style={{ fontSize: '14px', marginBottom: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✨ DeepSeek 跨文化智能分析
            </h3>
            {aiHealth && (
              <div className={`ai-status-banner ${(aiHealth.aiConfigured ?? aiHealth.geminiConfigured) ? 'ok' : ''}`}>
                {(aiHealth.aiConfigured ?? aiHealth.geminiConfigured)
                  ? `智能体 ${aiHealth.agent?.skill || 'cross-cultural-research'} 已就绪 · ${aiHealth.model || 'deepseek-chat'} · 知识库 ${aiHealth.knowledge?.chunkCount ?? 0} 段`
                  : '请在项目根目录 .env 中设置 DEEPSEEK_API_KEY（见 .env.example）'}
              </div>
            )}
            <textarea
              value={userIdea}
              onChange={(e) => setUserIdea(e.target.value)}
              placeholder={`例：产品=二次元电商App；用户=18-25岁；场景=手机购物；目标=进入${selectedMarket.title}。可写当前阶段（调研/设计/开发/准备上线）…`}
              style={{
                width: '100%', height: '70px', borderRadius: '8px', padding: '12px',
                boxSizing: 'border-box', background: 'rgba(0,0,0,0.4)', color: 'white',
                border: '1px solid rgba(255,255,255,0.15)', marginBottom: '12px',
                fontSize: '12px', resize: 'none', fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button
              onClick={handleAiAnalysis}
              disabled={!userIdea || isGenerating}
              style={{
                width: '100%', padding: '12px',
                background: isGenerating ? 'rgba(255,255,255,0.1)' : '#ffffff',
                color: isGenerating ? '#888' : '#000000',
                border: 'none', borderRadius: '8px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontWeight: '600', fontSize: '13px', transition: 'all 0.3s',
              }}
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

      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onLoadChat={handleLoadChatFromHistory}
        onLoadReport={handleLoadReportFromHistory}
      />

      <RechargeModal
        open={rechargeOpen}
        onClose={() => setRechargeOpen(false)}
        balanceYuan={user.balanceYuan}
        onSuccess={() => refreshUser()}
      />
    </div>
  );
}

export default App;
