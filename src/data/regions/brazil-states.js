import { createRegion } from './_regionFactory.js';

const BR_REFS = [
  { title: 'Brazil — Hofstede Country Comparison', source: 'Hofstede Insights', year: '2024', url: 'https://www.hofstede-insights.com/country-comparison/brazil/', tag: '国家基准', note: '巴西全国维度参照' },
  { title: 'Trust and Culture', source: 'Nielsen Norman Group', year: '—', url: 'https://www.nngroup.com/articles/trust-and-culture/', tag: 'UX 研究', note: '社交信任' },
];

const r = (data) => createRegion('brazil', '巴西', 'Brazil', BR_REFS, data);

export const brazilStates = [
  r({
    id: 'br-sp', lat: -23.55, lng: -46.63, label: 'São Paulo', title: '圣保罗州',
    tagline: '南美纽约：金融、时尚与堵车中的手机 commerce',
    overview: '经济心脏：高信息密度、商务正式与街头多元并存。',
    radarData: [
      { name: '权力距离', score: 72, fullMark: 100 }, { name: '个人主义', score: 40, fullMark: 100 },
      { name: '男性度', score: 52, fullMark: 100 }, { name: '规避不确定', score: 78, fullMark: 100 },
      { name: '长期导向', score: 48, fullMark: 100 }, { name: '宽容度', score: 58, fullMark: 100 },
    ],
    density: 72,
    methodology: {
      intro: '圣保罗州依据：',
      steps: ['金融科技与分期付款（parcelamento）习惯', '圣保罗时装周与奢侈品电商', '交通拥堵中的移动支付场景'],
    },
    culturalStory: {
      title: '保利斯塔大街的混凝土丛林',
      paragraphs: [
        '圣保罗不以海滩闻名，而以工作、艺术、夜生活著称——用户节奏快，分期付款极普遍。',
        '意大利、日本、阿拉伯移民社区交织：营销 imagery 需多元，葡语为主，英语辅助。',
        '足球、狂欢节、街头涂鸦：情绪高对比视觉有效，但 B2B 需更克制。',
      ],
      designLink: '【因】商务密度 + 分期消费文化 →【果】parcelamento 展示、即时支付、多元模特、清晰发票/税务信息。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '分期付款；Pix 支付；葡语优先。' }],
  }),
  r({
    id: 'br-rj', lat: -22.91, lng: -43.17, label: 'Rio de Janeiro', title: '里约热内卢州',
    tagline: '基督像下：海滩、桑巴与视觉狂欢',
    overview: '旅游与嘉年华：高饱和视觉、音乐、社交分享极强。',
    radarData: [
      { name: '权力距离', score: 68, fullMark: 100 }, { name: '个人主义', score: 42, fullMark: 100 },
      { name: '男性度', score: 48, fullMark: 100 }, { name: '规避不确定', score: 72, fullMark: 100 },
      { name: '长期导向', score: 40, fullMark: 100 }, { name: '宽容度', score: 65, fullMark: 100 },
    ],
    density: 65,
    methodology: {
      intro: '里约州依据：',
      steps: ['狂欢节与事件营销转化', '海滩经济（B2C 旅游、运动）', '贫民窟社区数字 inclusion 项目'],
    },
    culturalStory: {
      title: '科帕卡巴纳的日落与桑巴鼓点',
      paragraphs: [
        '里约：基督像、桑巴、海滩足球——「快乐」是品牌语言，但需避免对贫民窟的刻板剥削。',
        '狂欢节门票、街头派对、Instagram 打卡：社交分享是增长引擎。',
        '安全提示与地理分区：地图、网约车、夜间模式对用户是信任关键。',
      ],
      designLink: '【因】节庆文化 + 旅游社交 →【果】鲜艳视觉、分享激励、安全提示、活动日历。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '社交分享；活动票务；安全/区域提示。' }],
  }),
  r({
    id: 'br-ba', lat: -12.97, lng: -38.51, label: 'Bahia', title: '巴伊亚州',
    tagline: '萨尔瓦多：非裔根源与热带节奏',
    overview: '非洲裔文化重镇：音乐、宗教多元、色彩浓郁。',
    radarData: [
      { name: '权力距离', score: 70, fullMark: 100 }, { name: '个人主义', score: 35, fullMark: 100 },
      { name: '男性度', score: 45, fullMark: 100 }, { name: '规避不确定', score: 70, fullMark: 100 },
      { name: '长期导向', score: 38, fullMark: 100 }, { name: '宽容度', score: 68, fullMark: 100 },
    ],
    density: 62,
    methodology: {
      intro: '巴伊亚依据：',
      steps: ['坎东布莱宗教节日营销', '非裔巴西用户代表性', '热带旅游与历史文化城'],
    },
    culturalStory: {
      title: '萨尔瓦多的巴洛克与鼓声',
      paragraphs: [
        '巴伊亚是非洲文化在美洲的活态博物馆：阿芙罗式发型、坎东布莱仪式、卡波耶拉。',
        '音乐（桑巴-reggae）驱动传播：音频、短视频、直播带货有天然土壤。',
        '色彩浓烈但需尊重宗教符号，不可戏谑 Orisha 形象。',
      ],
      designLink: '【因】非裔文化 + 音乐社交 →【果】音乐/视频整合、尊重符号、社区创作者合作。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '音乐营销；文化敏感；非裔代表。' }],
  }),
  r({
    id: 'br-am', lat: -3.42, lng: -65.86, label: 'Amazonas', title: '亚马孙州',
    tagline: '雨林与河流：慢网、远距、生态叙事',
    overview: '北部雨林：物流挑战、原住民文化、环保叙事。',
    radarData: [
      { name: '权力距离', score: 74, fullMark: 100 }, { name: '个人主义', score: 32, fullMark: 100 },
      { name: '男性度', score: 50, fullMark: 100 }, { name: '规避不确定', score: 68, fullMark: 100 },
      { name: '长期导向', score: 42, fullMark: 100 }, { name: '宽容度', score: 55, fullMark: 100 },
    ],
    density: 55,
    methodology: {
      intro: '亚马孙州依据：',
      steps: ['雨林地区网络覆盖与轻量 App 需求', '原住民社区文化敏感', '可持续/碳信用产品叙事'],
    },
    culturalStory: {
      title: '玛瑙斯歌剧院与雨林航道',
      paragraphs: [
        '玛瑙斯：雨林中的城市，物流靠河船与飞机——「预计送达 7-14 天」需诚实写明。',
        '原住民图案与生物多样性：环保品牌故事在此有共鸣，但不可 greenwashing。',
        '雨季与旱季影响配送：状态追踪比花哨动画更重要。',
      ],
      designLink: '【因】物流约束 + 生态叙事 →【果】轻量页面、配送透明、环保认证、文化敏感 imagery。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '轻量模式；物流追踪；环保认证。' }],
  }),
  r({
    id: 'br-mg', lat: -19.92, lng: -43.94, label: 'Minas Gerais', title: '米纳斯吉拉斯州',
    tagline: '奶酪面包与矿业：慢食、慢聊、慢信任',
    overview: '内陆保守友好：口碑、家庭、WhatsApp 群极重要。',
    radarData: [
      { name: '权力距离', score: 70, fullMark: 100 }, { name: '个人主义', score: 36, fullMark: 100 },
      { name: '男性度', score: 50, fullMark: 100 }, { name: '规避不确定', score: 74, fullMark: 100 },
      { name: '长期导向', score: 50, fullMark: 100 }, { name: '宽容度', score: 52, fullMark: 100 },
    ],
    density: 58,
    methodology: {
      intro: '米纳斯州依据：',
      steps: ['家庭式餐饮与 WhatsApp 订单习惯', '宗教（天主教）节日营销', '矿业与工业 B2B 务实沟通'],
    },
    culturalStory: {
      title: '蒂奥卡的咖啡与家族食谱',
      paragraphs: [
        '米纳斯以「慢」闻名：咖啡、对话、信任慢慢建立——硬推销转化率低。',
        'WhatsApp 群里的家族团购、教会社区推荐是常见获客路径。',
        '殖民时期巴洛克建筑：视觉可温暖、复古，但避免过度华丽影响性能。',
      ],
      designLink: '【因】关系型信任 →【果】WhatsApp 入口、口碑评价、温暖视觉、耐心客服。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: 'WhatsApp 下单；评价与推荐；温暖语气。' }],
  }),
  r({
    id: 'br-pr', lat: -25.43, lng: -49.27, label: 'Paraná', title: '巴拉那州',
    tagline: '库里蒂巴：生态城市与南方欧洲移民',
    overview: '南部务实：环保、教育水平较高、德意移民影响。',
    radarData: [
      { name: '权力距离', score: 65, fullMark: 100 }, { name: '个人主义', score: 42, fullMark: 100 },
      { name: '男性度', score: 52, fullMark: 100 }, { name: '规避不确定', score: 76, fullMark: 100 },
      { name: '长期导向', score: 55, fullMark: 100 }, { name: '宽容度', score: 50, fullMark: 100 },
    ],
    density: 60,
    methodology: {
      intro: '巴拉那依据：',
      steps: ['库里蒂巴 BRT 生态城市案例', '农业科技（大豆）出口 B2B', '南部欧洲移民文化'],
    },
    culturalStory: {
      title: '库里蒂巴的回收公交与农科硅谷',
      paragraphs: [
        '库里蒂巴曾引领公交专用道与回收文化——用户对环境信息有较高接受度。',
        '隆德里纳、卡斯卡韦尔等农业带：B2B 仪表盘、数据导出是刚需。',
        '冬季较冷：季节性服装电商有明显峰值。',
      ],
      designLink: '【因】生态务实 + 农业 B2B →【果】环保信息、数据工具、季节模块、清晰规格。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '环保标签；B2B 数据；季节品类。' }],
  }),
];
