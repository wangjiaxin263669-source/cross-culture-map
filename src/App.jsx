import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import ReportMarkdown from './components/ReportMarkdown';
import CulturalStoryPanel from './components/CulturalStoryPanel';
import { countriesData } from './data/countries';
import { sendChatMessage, generateReport, checkAiHealth } from './services/aiApi';
import './App.css';

function App() {
  const globeEl = useRef();
  const [selectedCountry, setSelectedCountry] = useState(null);

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
      text: '您好！我是跨文化研究设计专家。先点击地球上的国家，读一读那里的文化故事与视频，再告诉我您的产品构想——我会结合历史叙事与 Hofstede 数据为您分析。',
    },
  ]);
  const [aiHealth, setAiHealth] = useState(null);

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

  const handleLabelClick = (country) => {
    setSelectedCountry(country);
    setAiResult('');
    setAiError('');
  };

  const closePanel = () => {
    setSelectedCountry(null);
    setAiResult('');
    setAiError('');
  };

  const handleExploreMap = () => {
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 1000);
    }
  };

  const handleAiAnalysis = async () => {
    if (!userIdea?.trim() || !selectedCountry) return;
    setIsGenerating(true);
    setAiError('');
    setAiResult('');
    try {
      const report = await generateReport({
        productIdea: userIdea,
        country: selectedCountry,
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
        country: selectedCountry,
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
          <span className="nav-item active">OVERVIEW</span>
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
          <span className="dot"></span> GLOBAL VIEW &nbsp;&nbsp; <span className="dot" style={{ background: '#fff', boxShadow: 'none' }}></span> Live
        </div>
        <h1>跨文化<br/><span className="highlight">研究设计</span></h1>
        <p>用文化故事与真实案例理解世界，再让 AI 帮你做本地化设计决策。</p>
        <div className="action-buttons">
          <button className="btn-outline" onClick={handleExploreMap}>Explore the Map ➔</button>
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
          {selectedCountry && (
            <div className="chat-context-hint">
              已关联目标市场：{selectedCountry.title}
            </div>
          )}
          <div className="chat-input-area">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="输入国家、文化维度或设计构想..."
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
          labelsData={countriesData}
          labelLat={(d) => d.lat}
          labelLng={(d) => d.lng}
          labelText={(d) => d.label}
          labelSize={() => 1.8}
          labelDotRadius={() => 0.6}
          labelColor={() => 'white'}
          labelResolution={2}
          onLabelClick={handleLabelClick}
        />
      </div>

      {selectedCountry && (
        <div className="info-panel">
          <button className="close-btn" onClick={closePanel}>✕ Close</button>
          <h2>{selectedCountry.title}</h2>
          <p className="country-overview">{selectedCountry.overview}</p>

          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={selectedCountry.radarData}>
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
                <span>{selectedCountry.density}%</span>
              </div>
              <div className="density-track">
                <div className="density-fill" style={{ width: `${selectedCountry.density}%` }}></div>
              </div>
            </div>
          </div>

          <CulturalStoryPanel country={selectedCountry} />

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
              placeholder="描述您的产品构想..."
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
