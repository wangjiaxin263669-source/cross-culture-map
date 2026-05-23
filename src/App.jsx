import React, { useState, useEffect, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import ReportMarkdown from './components/ReportMarkdown';
import CulturalStoryPanel from './components/CulturalStoryPanel';
import RegionPicker from './components/RegionPicker';
import {
  globeLabelsData,
  normalizeMarket,
  getMarketDisplayTitle,
  getRegionsByParentId,
} from './data/markets';
import { sendChatMessage, generateReport, checkAiHealth } from './services/aiApi';
import './App.css';

function App() {
  const globeEl = useRef();
  const [selectedMarket, setSelectedMarket] = useState(null);

  const [userIdea, setUserIdea] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiError, setAiError] = useState('');

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const chatEndRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'ai',
      text: '您好！我是跨文化研究设计专家。点击地球上的国家标签，或中国省、美国州、日本县等地区标签，阅读文化故事与视频；再告诉我您的产品构想，我会结合当地文化为您分析。',
    },
  ]);
  const [aiHealth, setAiHealth] = useState(null);

  const displayTitle = useMemo(
    () => getMarketDisplayTitle(selectedMarket),
    [selectedMarket],
  );

  const siblingRegions = useMemo(() => {
    const parentId = selectedMarket?.parentId;
    if (!parentId) return null;
    const list = getRegionsByParentId(parentId);
    return list.length ? list : null;
  }, [selectedMarket]);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.4;
      globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2.2 });
    }
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

  const focusParentRegion = (parentId, lat, lng, altitude = 1.5) => {
    const regions = getRegionsByParentId(parentId);
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat, lng, altitude }, 1000);
    }
    if (regions.length) {
      handleLabelClick(regions[0]);
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
    } catch (err) {
      setAiError(err.message || '报告生成失败，请确认后端已启动且已配置 DEEPSEEK_API_KEY');
    } finally {
      setIsGenerating(false);
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
      setChatMessages((prev) => [...prev, { role: 'ai', text: reply }]);
    } catch (err) {
      const msg = err.message || '对话失败';
      setChatError(msg);
      setChatMessages((prev) => [
        ...prev,
        { role: 'ai', text: `请求失败：${msg}` },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

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

        <div className="right-profile">
          <div className="avatar">A</div>
          <div className="user-info">
            <span>Adele-Lu</span>
            <small>Administrator</small>
          </div>
        </div>
      </div>

      <div className="hero-section">
        <div className="live-tag">
          <span className="dot"></span> REGION VIEW &nbsp;&nbsp;
          <span className="dot" style={{ background: '#fff', boxShadow: 'none' }}></span> Live
        </div>
        <h1>跨文化<br/><span className="highlight">研究设计</span></h1>
        <p>按国家或地区探索文化故事——中国省、美国州、日本县、巴西/德国/印度等地区均已支持长故事与视频。</p>
        <div className="action-buttons">
          <button className="btn-outline" onClick={handleExploreMap}>Explore the Map ➔</button>
          <button className="btn-outline" onClick={() => focusParentRegion('china', 35, 105)}>中国各省 ➔</button>
          <button className="btn-outline" onClick={() => focusParentRegion('usa', 37, -95, 1.7)}>美国各州 ➔</button>
          <button className="btn-outline" onClick={() => focusParentRegion('japan', 36, 138, 1.6)}>日本各县 ➔</button>
          <button className="btn-outline" onClick={handleToggleChat}>Chat with AI ➔</button>
        </div>
      </div>

      {isChatOpen && (
        <div className="global-chat-modal">
          <div className="chat-header">
            <h3>✨ 跨文化研究专家 · DeepSeek</h3>
            <button className="close-chat-btn" onClick={handleToggleChat}>✕ 隐藏</button>
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

      <div className="globe-wrapper">
        <Globe
          ref={globeEl}
          globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
          backgroundImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
          labelsData={globeLabelsData}
          labelLat={(d) => d.lat}
          labelLng={(d) => d.lng}
          labelText={(d) => d.label}
          labelSize={(d) => (d.marketType === 'region' ? 1.35 : 1.8)}
          labelDotRadius={(d) => (d.marketType === 'region' ? 0.45 : 0.6)}
          labelColor={(d) => (d.marketType === 'region' ? '#7ee8fa' : 'white')}
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

          <h2>{displayTitle}</h2>
          <p className="country-overview">{selectedMarket.overview}</p>

          {siblingRegions && selectedMarket.parentId && (
            <RegionPicker
              parentId={selectedMarket.parentId}
              parentTitle={selectedMarket.parentTitle}
              regions={siblingRegions}
              activeId={selectedMarket.id}
              onSelect={(r) => handleLabelClick(r)}
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

          <div style={{ marginTop: '30px' }}>
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
              placeholder={`描述您在${selectedMarket.title}市场的产品构想...`}
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
              {isGenerating ? '深度逻辑推理中...' : '生成本地化设计报告 ➔'}
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
    </div>
  );
}

export default App;
