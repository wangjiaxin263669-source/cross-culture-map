import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import ReportMarkdown from './components/ReportMarkdown';
import { sendChatMessage, generateReport, checkAiHealth } from './services/aiApi';
import './App.css';

const countriesData = [
  { 
    lat: 35.86, lng: 104.19, label: 'China', title: '中国', 
    overview: '典型的高权力距离与集体主义文化，用户倾向于全面且结构化的信息展示。',
    radarData: [
      { name: '权力距离', score: 80, fullMark: 100 },
      { name: '个人主义', score: 20, fullMark: 100 },
      { name: '男性度', score: 66, fullMark: 100 },
      { name: '规避不确定', score: 30, fullMark: 100 },
      { name: '长期导向', score: 87, fullMark: 100 },
      { name: '宽容度', score: 24, fullMark: 100 }
    ],
    density: 85,
    designTips: [
      {
        icon: "📚",
        title: "理论与文献依据 (Theoretical Basis)",
        content: <>中国文化具有典型的高权力距离（80分）与集体主义（个人主义仅20分）特征<a href="https://www.hofstede-insights.com/country-comparison/china/" target="_blank" rel="noreferrer" className="interactive-link">[Hofstede 官方维度数据]</a>。据 Heeman Kim 等人发表在《计算机介导通信杂志》（JCMC）上的跨文化内容分析文献指出，集体主义文化中的个体比个人主义文化中的个体更喜欢“同时处理多重任务”<a href="https://onlinelibrary.wiley.com/doi/full/10.1111/j.1083-6101.2009.01454.x" target="_blank" rel="noreferrer" className="interactive-link">[Wiley 实证文献: 网站设计的时间取向]</a>。在网络环境下，这种多元时间取向的用户能够更好地同时注意多种在线展示。</>
      },
      {
        icon: "💡",
        title: "深度 UI/UX 策略 (Design Strategy)",
        content: <>【因】由于集体主义带来多任务处理倾向，且高权力距离重视权威感。<br/>【果】前端布局应采用高信息密度的瀑布流或超级菜单（Mega Menu），容纳多元任务并行处理；同时必须在首屏显著位置增加专业背书模块、官方认证标识等元素，以此构建信任链路<a href="https://www.bilibili.com/video/BV1td4y1P7Us/" target="_blank" rel="noreferrer" className="interactive-link">[视频讲座: 什么是文化研究]</a>。</>
      },
      {
        icon: "🖼️",
        title: "商业成功案例 (Case Study)",
        content: <>以星巴克 (Starbucks) 为例，其中国区平台在一个屏幕内高密度地整合了菜单、星享俱乐部、优惠Banner及社交分享入口，这种极其丰富的信息架构完美契合了集体主义用户同时处理多重任务的习惯<a href="https://www.starbucks.com.cn/" target="_blank" rel="noreferrer" className="interactive-link">[星巴克中国官网对照]</a>。此外，中美公益广告也体现了极大差异：中国的森林防火海报文案为“森林防火，有你有我”，强烈凸显了集体主义的群像与连带责任意识。</>,
        imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=600",
        caseLink: "https://www.starbucks.com.cn/"
      }
    ]
  },
  { 
    lat: 37.09, lng: -95.71, label: 'USA', title: '美国', 
    overview: '高度个人主义文化，崇尚自由度、平权与单线程的沉浸式体验。',
    radarData: [
      { name: '权力距离', score: 40, fullMark: 100 },
      { name: '个人主义', score: 91, fullMark: 100 },
      { name: '男性度', score: 62, fullMark: 100 },
      { name: '规避不确定', score: 46, fullMark: 100 },
      { name: '长期导向', score: 26, fullMark: 100 },
      { name: '宽容度', score: 68, fullMark: 100 }
    ],
    density: 40,
    designTips: [
      {
        icon: "📚",
        title: "理论与文献依据 (Theoretical Basis)",
        content: <>美国是高度个人主义文化（91分）的代表，且权力距离较低（40分）<a href="https://www.hofstede-insights.com/country-comparison/the-usa/" target="_blank" rel="noreferrer" className="interactive-link">[Hofstede 官方维度数据]</a>。Heeman Kim 等人 (2009) 的实证研究证实，个人主义文化的用户显示了单一时间取向，倾向于“一次集中完成一项任务”，对界面中其他任务的视觉干扰更为敏感<a href="https://onlinelibrary.wiley.com/doi/full/10.1111/j.1083-6101.2009.01454.x" target="_blank" rel="noreferrer" className="interactive-link">[Collectivist and Individualist Influences]</a>。</>
      },
      {
        icon: "💡",
        title: "深度 UI/UX 策略 (Design Strategy)",
        content: <>【因】极端的个人主义导致单一时间取向，低权力距离崇尚平权与掌控权。<br/>【果】在低语境文化下，界面需保持大面积留白，剥离所有冗余信息。交互逻辑应引导单线程沉浸，确保用户能专注完成核心转化任务。同时，系统应提供高度自定义的模块鼓励用户共创并掌控数字体验<a href="https://www.nngroup.com/articles/cross-cultural-design/" target="_blank" rel="noreferrer" className="interactive-link">[NNG: 跨文化可用性准则]</a>。</>
      },
      {
        icon: "🖼️",
        title: "商业成功案例 (Case Study)",
        content: <>对比中韩官网，星巴克美国官网展现了极致的单线程设计。首屏往往只有一个清晰的“点单 (Order)”召唤按钮 (CTA)，排版空旷，直接切中个人主义受众对高效、无干扰体验的诉求<a href="https://www.starbucks.com/" target="_blank" rel="noreferrer" className="interactive-link">[星巴克美国官网对照]</a>。美国的 Smokey Bear 防火海报则直接指着受众说："ONLY YOU can prevent forest fires"（只有你能防止森林火灾），体现了极其强烈的个体独立责任感<a href="https://smokeybear.com/en" target="_blank" rel="noreferrer" className="interactive-link">[Smokey Bear 历史档案]</a>。</>,
        imageUrl: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=600",
        caseLink: "https://www.starbucks.com/"
      }
    ]
  },
  { 
    lat: 36.20, lng: 138.25, label: 'Japan', title: '日本', 
    overview: '全球最高的不确定性规避，注重细节完美与极高的产品信誉度。',
    radarData: [
      { name: '权力距离', score: 54, fullMark: 100 },
      { name: '个人主义', score: 46, fullMark: 100 },
      { name: '男性度', score: 95, fullMark: 100 },
      { name: '规避不确定', score: 92, fullMark: 100 },
      { name: '长期导向', score: 88, fullMark: 100 },
      { name: '宽容度', score: 42, fullMark: 100 }
    ],
    density: 95,
    designTips: [
      {
        icon: "📚",
        title: "理论与文献依据 (Theoretical Basis)",
        content: <>日本在 Hofstede 模型中拥有全球极高的不确定性规避指数（92分），同时表现出极强的男性度（95分）特征<a href="https://www.hofstede-insights.com/country-comparison/japan/" target="_blank" rel="noreferrer" className="interactive-link">[Hofstede 官方维度数据]</a>。这意味着该文化极度排斥未知风险，面对新事物时容易产生焦虑，因此需要大量前置的客观数据与细节来构建安全感。</>
      },
      {
        icon: "💡",
        title: "深度 UI/UX 策略 (Design Strategy)",
        content: <>【因】极高的不确定性规避导致对风险的抗拒，需要冗余信息填补心理空白。<br/>【果】为降低焦虑，页面必须提供近乎冗余的文字说明、严谨的参数对比表格与详尽的图文指引（如常见问题 FAQ 库）。色彩心理学方面，受高男性度社会影响，受众更偏向稳重、专业的色彩体系，忌讳在核心业务流中使用过度跳跃的视觉<a href="https://www.bilibili.com/video/BV1YG4y1B7Jh/" target="_blank" rel="noreferrer" className="interactive-link">[视频案例: 日本文化研究]</a>。</>
      },
      {
        icon: "🖼️",
        title: "商业成功案例 (Case Study)",
        content: <>在跨文化视觉设计的经典文献案例中，好莱坞电影《爱乐之城》(La La Land) 的原版/法国版海报极度留白，仅突出浪漫氛围；而在日本版海报中，发行方塞满了大量媒体赞誉、五星评价体系和详尽的剧情说明文字。这种高密度的视觉填补，正是为了抚平受众的“不确定性规避”心理，用权威口碑和海量信息建立产品信誉<a href="https://www.imdb.com/title/tt3783958/mediaviewer/rm324546560" target="_blank" rel="noreferrer" className="interactive-link">[La La Land 日本原版海报库]</a>。</>,
        imageUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600",
        caseLink: "https://www.imdb.com/title/tt3783958/mediaviewer/rm324546560"
      }
    ]
  },
  { 
    lat: 51.16, lng: 10.45, label: 'Germany', title: '德国', 
    overview: '低权力距离与高不确定性规避，用户极度注重逻辑严密性、数据隐私与产品功能性。',
    radarData: [
      { name: '权力距离', score: 35, fullMark: 100 },
      { name: '个人主义', score: 67, fullMark: 100 },
      { name: '男性度', score: 66, fullMark: 100 },
      { name: '规避不确定', score: 65, fullMark: 100 },
      { name: '长期导向', score: 83, fullMark: 100 },
      { name: '宽容度', score: 40, fullMark: 100 }
    ],
    density: 70,
    designTips: [
      {
        icon: "📚",
        title: "理论与文献依据 (Theoretical Basis)",
        content: <>德国文化呈现出典型的低权力距离（35分）与较高不确定性规避（65分）的组合<a href="https://www.hofstede-insights.com/country-comparison/germany/" target="_blank" rel="noreferrer" className="interactive-link">[Hofstede 官方维度数据]</a>。这种文化心理要求事物具备高度的可预测性和严密的逻辑支撑，受众不会盲从权威，而是通过独立验证细节、参数和合规性来做出理性决策。</>
      },
      {
        icon: "💡",
        title: "深度 UI/UX 策略 (Design Strategy)",
        content: <>【因】低权力距离+高不确定性规避，导致强烈的逻辑验证需求和极端的隐私保护意识。<br/>【果】排版上必须采用极其严谨的栅格系统（Grid System），提供清晰无歧义的面包屑导航。表单交互必须强调数据合规，支付环节需强化隐私保护条款及第三方权威机构认证标识<a href="https://gdpr.eu/cookies/" target="_blank" rel="noreferrer" className="interactive-link">[GDPR 欧盟隐私UI规范]</a>。</>
      }
    ]
  },
  { 
    lat: -14.23, lng: -51.92, label: 'Brazil', title: '巴西', 
    overview: '高度集体主义与高宽容度文化，用户情感丰富，偏好强社交属性与视觉冲击力。',
    radarData: [
      { name: '权力距离', score: 69, fullMark: 100 },
      { name: '个人主义', score: 38, fullMark: 100 },
      { name: '男性度', score: 49, fullMark: 100 },
      { name: '规避不确定', score: 76, fullMark: 100 },
      { name: '长期导向', score: 44, fullMark: 100 },
      { name: '宽容度', score: 59, fullMark: 100 }
    ],
    density: 60,
    designTips: [
      {
        icon: "📚",
        title: "理论与文献依据 (Theoretical Basis)",
        content: <>作为拉美代表，巴西具有较高的集体主义属性（个人主义仅38分）和显著的高宽容度（59分）<a href="https://www.hofstede-insights.com/country-comparison/brazil/" target="_blank" rel="noreferrer" className="interactive-link">[Hofstede 官方维度数据]</a>。文化维度表明该地民众普遍注重生活享乐、情感表达外露，并且高度依赖圈层内的社交联系。</>
      },
      {
        icon: "💡",
        title: "深度 UI/UX 策略 (Design Strategy)",
        content: <>【因】高宽容度与集体主义驱动了强烈的社交欲望和外放的情绪表达。<br/>【果】视觉策略上应大胆使用高饱和度色彩与具有强烈情绪感染力的人物影像，营造热情、活跃的数字沉浸氛围。交互机制必须深植社交基因，设计需强化跨平台的社交分享模块（Social Proof），提供便捷的即时通讯（如 WhatsApp）悬浮接入点<a href="https://www.nngroup.com/articles/trust-and-culture/" target="_blank" rel="noreferrer" className="interactive-link">[NNG: 文化与界面信任度研究]</a>。</>
      }
    ]
  },
  { 
    lat: 23.88, lng: 45.07, label: 'Saudi Arabia', title: '沙特阿拉伯', 
    overview: '高权力距离与强规避不确定性，受宗教文化影响深远，尊崇传统与权威。',
    radarData: [
      { name: '权力距离', score: 95, fullMark: 100 },
      { name: '个人主义', score: 25, fullMark: 100 },
      { name: '男性度', score: 60, fullMark: 100 },
      { name: '规避不确定', score: 80, fullMark: 100 },
      { name: '长期导向', score: 36, fullMark: 100 },
      { name: '宽容度', score: 52, fullMark: 100 }
    ],
    density: 50,
    designTips: [
      {
        icon: "📚",
        title: "理论与文献依据 (Theoretical Basis)",
        content: <>沙特阿拉伯拥有极高的权力距离（高达95分）和不确定性规避（80分）<a href="https://www.hofstede-insights.com/country-comparison/saudi-arabia/" target="_blank" rel="noreferrer" className="interactive-link">[Hofstede 官方维度数据]</a>。这种维度组合反映在社会结构上，体现为对宗教传统、权威等级的绝对尊崇，以及对社会秩序稳定性的强烈诉求。</>
      },
      {
        icon: "💡",
        title: "深度 UI/UX 策略 (Design Strategy)",
        content: <>【因】绝对的权力距离和传统宗教信仰导致对既定秩序和奢华符号的推崇。<br/>【果】底层架构必须完美支持 RTL（Right-To-Left，从右到左）镜像排版，这是适配阿拉伯语阅读习惯的基石<a href="https://m3.material.io/styles/bidi/overview" target="_blank" rel="noreferrer" className="interactive-link">[Material Design: RTL 镜像排版规范]</a>。在内容合规层面需保持极度警惕，严格避免使用任何可能违背宗教教义的图像。UI 质感应当通过色彩与材质的隐喻（如暗金、深色系），来烘托尊贵感与奢华属性。</>
      }
    ]
  },
  { 
    lat: 20.59, lng: 78.96, label: 'India', title: '印度', 
    overview: '高权力距离与多语种共存，用户对价格敏感，且习惯于高密度的信息展示。',
    radarData: [
      { name: '权力距离', score: 77, fullMark: 100 },
      { name: '个人主义', score: 48, fullMark: 100 },
      { name: '男性度', score: 56, fullMark: 100 },
      { name: '规避不确定', score: 40, fullMark: 100 },
      { name: '长期导向', score: 51, fullMark: 100 },
      { name: '宽容度', score: 26, fullMark: 100 }
    ],
    density: 80,
    designTips: [
      {
        icon: "📚",
        title: "理论与文献依据 (Theoretical Basis)",
        content: <>印度表现出较高的高权力距离（77分）和较低的不确定性规避（40分）<a href="https://www.hofstede-insights.com/country-comparison/india/" target="_blank" rel="noreferrer" className="interactive-link">[Hofstede 官方维度数据]</a>。同时，其作为一个多语种、多阶层的复杂巨型市场，用户群体在网络环境适应性、消费能力及文化背景上呈现出极大的方差。</>
      },
      {
        icon: "💡",
        title: "深度 UI/UX 策略 (Design Strategy)",
        content: <>【因】网络基建方差大，且多语种共存，对价格极度敏感。<br/>【果】界面设计必须包容其复杂的网络环境（如低带宽），采用轻量化开发框架，并前置多语言/方言的无缝一键切换功能。在商业转化策略上，应高频使用醒目的折扣标签、视觉倒计时等手段刺激购买，并辅以即时语音客服功能，以最低的门槛降低用户的决策成本<a href="https://www.smashingmagazine.com/2014/07/designing-for-the-indian-user/" target="_blank" rel="noreferrer" className="interactive-link">[Smashing Mag: 印度本土化用户体验研究]</a>。</>
      }
    ]
  }
];

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
      text: '您好！我是跨文化研究设计专家（cross-cultural-research 智能体），具备 20 年跨文化民族志与 Hofstede 诊断经验。已接入课程知识库与地球仪维度数据。\n\n您可以描述：目标国家/人群、产品类型、或具体设计问题。我将按「文化背景 → 关键发现 → 风险评级 → 建议 → 验证方法」为您分析。',
    },
  ]);

  const [aiHealth, setAiHealth] = useState(null);

  useEffect(() => {
    const initGlobe = () => {
      const globe = globeEl.current;
      if (!globe?.controls) return;
      try {
        const controls = globe.controls();
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        globe.pointOfView({ altitude: 2.2 });
      } catch {
        /* 地球尚未完成挂载，稍后重试 */
      }
    };
    initGlobe();
    const timer = setTimeout(initGlobe, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    checkAiHealth()
      .then(setAiHealth)
      .catch(() => setAiHealth({ aiConfigured: false }));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  const handleLabelClick = (label) => {
    setSelectedCountry(label);
    setUserIdea(''); 
    setAiResult(''); 
    globeEl.current?.pointOfView({ lat: label.lat, lng: label.lng - 25, altitude: 1.3 }, 1200);
    const ctrl = globeEl.current?.controls();
    if (ctrl) ctrl.autoRotate = false;
  };

  const closePanel = () => {
    setSelectedCountry(null);
    globeEl.current?.pointOfView({ altitude: 2.2 }, 1200);
    const ctrl = globeEl.current?.controls();
    if (ctrl) ctrl.autoRotate = true;
  };

  const handleAiAnalysis = async () => {
    if (!userIdea?.trim() || !selectedCountry) return;
    setIsGenerating(true);
    setAiResult('');
    setAiError('');
    try {
      const report = await generateReport({
        productIdea: userIdea.trim(),
        country: selectedCountry,
      });
      setAiResult(report);
    } catch (err) {
      setAiError(err.message || '报告生成失败，请确认后端已启动且已配置 DEEPSEEK_API_KEY');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExploreMap = () => {
    globeEl.current?.pointOfView({ altitude: 1.2 }, 1500);
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
          <span className="dot"></span> GLOBAL VIEW &nbsp;&nbsp; <span className="dot" style={{background:'#fff', boxShadow:'none'}}></span> Live
        </div>
        <h1>跨文化<br/><span className="highlight">研究设计</span></h1>
        <p>Real-time cultural dimension data and AI-driven insights empowering smarter, localized product decisions.</p>
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
            {isChatLoading && (
              <div className="chat-bubble ai loading">正在检索课程知识库并分析…</div>
            )}
            <div ref={chatEndRef} />
          </div>
          {chatError && <div className="ai-error" style={{ margin: '0 15px 10px' }}>{chatError}</div>}
          {selectedCountry && (
            <div className="knowledge-tag" style={{ margin: '0 15px 8px' }}>
              已关联目标市场：{selectedCountry.title}
            </div>
          )}
          <div className="chat-input-area">
            <input 
              type="text" 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="输入国家、文化维度或设计构想..."
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isChatLoading}
            />
            <button onClick={handleSendMessage} disabled={isChatLoading || !chatInput.trim()}>
              {isChatLoading ? '…' : '发送'}
            </button>
          </div>
        </div>
      )}

      <div className="globe-layer">
        <Globe
          ref={globeEl}
          globeImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
          backgroundColor="rgba(0,0,0,0)"
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
          <p style={{ color: '#00f0ff', fontSize: '13px', lineHeight: '1.5', marginTop: '-10px', marginBottom: '20px' }}>{selectedCountry.overview}</p>
          
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
            <h3 style={{ fontSize: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '16px' }}>
              🎨 本地化排版偏好
            </h3>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: '#8da4c4' }}>
                <span>UI 信息密度指示 (Info Density)</span>
                <span>{selectedCountry.density}%</span>
              </div>
              <div className="density-track">
                <div className="density-fill" style={{ width: `${selectedCountry.density}%` }}></div>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '25px' }}>
            <h3 style={{ fontSize: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '16px' }}>
              🎯 深度研究与 UI/UX 落地指南
            </h3>
            
            {/* 升级为具备学术感的纵向堆叠分析卡片 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedCountry.designTips.map((tip, index) => (
                <div key={index} className="research-card">
                  <h4 className="research-title">
                    <span style={{ marginRight: '6px' }}>{tip.icon}</span> 
                    {tip.title}
                  </h4>
                  <p className="research-content">
                    {tip.content}
                  </p>
                  
                  {/* 如果有图片，则渲染图文并茂的案例 */}
                  {tip.imageUrl && (
                    <div className="research-media-wrapper">
                      <img src={tip.imageUrl} alt="Case Study Visualization" className="research-image" />
                    </div>
                  )}

                  {/* 如果有外部链接，则渲染案例直达按钮 */}
                  {tip.caseLink && (
                    <a href={tip.caseLink} target="_blank" rel="noreferrer" className="case-link-btn">
                      🔗 探索真实案例文献 (Explore Case) ➔
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

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
                fontSize: '12px', resize: 'none', fontFamily: 'inherit', outline: 'none'
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
                fontWeight: '600', fontSize: '13px', transition: 'all 0.3s'
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