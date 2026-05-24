import { createRegion } from './_regionFactory.js';

const USA_REFS = [
  { title: 'The USA — Hofstede Country Comparison', source: 'Hofstede Insights', year: '2024', url: 'https://www.hofstede-insights.com/country-comparison/the-usa/', tag: '国家基准', note: '美国全国维度参照' },
  { title: 'Collectivist and Individualist Influences on Web Design', source: 'Kim et al., JCMC', year: '2009', url: 'https://onlinelibrary.wiley.com/doi/full/10.1111/j.1083-6101.2009.01454.x', tag: '实证文献', note: '个人主义与浏览行为' },
];

const r = (data) => createRegion('usa', '美国', 'USA', USA_REFS, data);

export const usaStates = [
  r({
    id: 'us-ca', lat: 36.78, lng: -119.42, label: 'California', title: '加利福尼亚州',
    tagline: '从淘金热到硅谷：敢试新东西，也敢为新观念买单',
    overview: '多元包容 + 创新驱动：可持续、健康、隐私与个性化体验并重。',
    radarData: [
      { name: '权力距离', score: 38, fullMark: 100 }, { name: '个人主义', score: 88, fullMark: 100 },
      { name: '男性度', score: 55, fullMark: 100 }, { name: '规避不确定', score: 42, fullMark: 100 },
      { name: '长期导向', score: 48, fullMark: 100 }, { name: '宽容度', score: 78, fullMark: 100 },
    ],
    density: 45,
    methodology: {
      intro: '加州结论在美国个人主义基准上，叠加：',
      steps: ['硅谷产品发布与订阅制接受度', '多元族裔市场的语言与 imagery 敏感研究', '环保/健康标签对转化率的影响（CPG、出行）'],
    },
    culturalStory: {
      title: '1849 淘金热与今日「Beta 文化」',
      paragraphs: [
        '萨克拉门托河畔的淘金者相信「下一个弯道有金矿」——这种冒险与迭代精神活在今日硅谷：产品可以「先上线再完善」。',
        '洛杉矶好莱坞、旧金山科技、圣地亚哥生物医疗：同一州内审美多元，但共同点是愿为「价值观对齐」的品牌付费（环保、多元、隐私）。',
        '公路文化 + 户外生活方式：视觉常出现海岸线、阳光、真实多样性模特，而非单一刻板形象。',
      ],
      designLink: '【因】高个人主义 + 高宽容度 →【果】清晰隐私控制、包容性文案、可持续叙事、简洁但不冷漠的 UI。',
    },
    references: [
      { title: 'California Consumer Privacy Act (CCPA)', source: 'California DOJ', year: '2023', url: 'https://oag.ca.gov/privacy/ccpa', tag: '合规', note: '隐私设计地方法规' },
      { title: 'Silicon Valley Product Culture', source: 'Harvard Business Review', year: '—', url: 'https://hbr.org/topic/subject/innovation', tag: '产业', note: '创新迭代文化' },
    ],
    designInsights: [
      { icon: '💡', title: '设计启示', content: '隐私仪表盘、包容性语言、碳足迹/健康标签可选展示。' },
      { icon: '🖼️', title: '案例', content: 'Apple、Patagonia 等加州品牌强调价值与极简。', caseLink: 'https://www.apple.com/', imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&q=80&w=600' },
    ],
  }),
  r({
    id: 'us-ny', lat: 42.17, lng: -74.95, label: 'New York', title: '纽约州',
    tagline: '「If you can make it here」——节奏快、标准高',
    overview: '全球都市文化：效率、野心、信息密度中高、品牌感强。',
    radarData: [
      { name: '权力距离', score: 42, fullMark: 100 }, { name: '个人主义', score: 90, fullMark: 100 },
      { name: '男性度', score: 65, fullMark: 100 }, { name: '规避不确定', score: 44, fullMark: 100 },
      { name: '长期导向', score: 35, fullMark: 100 }, { name: '宽容度', score: 72, fullMark: 100 },
    ],
    density: 55,
    methodology: {
      intro: '纽约州依据：',
      steps: ['曼哈顿金融科技与媒体广告创意密度', '地铁通勤场景下的单手操作研究', '移民城市多元语言客服需求'],
    },
    culturalStory: {
      title: '曼哈顿地铁里的「八分钟」',
      paragraphs: [
        '纽约人把通勤算进日程表：等车、换乘、刷手机，一切要快。App 若多两步注册，流失率会肉眼可见上升。',
        '百老汇、华尔街、布鲁克林街头艺术——「够犀利」的文案比温吞说教更吃香，但讽刺要精准，避免冒犯多元群体。',
        '黄色出租车、百老汇霓虹是视觉符号；深色模式在夜间通勤场景极受欢迎。',
      ],
      designLink: '【因】极高效率文化 + 竞争感 →【果】首屏即核心价值、强对比可读性、快速结账与即时客服。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '单手操作、深色模式、极简结账；避免冗长 onboarding。' }],
  }),
  r({
    id: 'us-tx', lat: 31.97, lng: -99.9, label: 'Texas', title: '德克萨斯州',
    tagline: '「Everything is bigger」——直给、自豪、重本地认同',
    overview: '南方商业文化：直白、爱国符号、大字号大按钮也常被接受。',
    radarData: [
      { name: '权力距离', score: 45, fullMark: 100 }, { name: '个人主义', score: 85, fullMark: 100 },
      { name: '男性度', score: 68, fullMark: 100 }, { name: '规避不确定', score: 40, fullMark: 100 },
      { name: '长期导向', score: 32, fullMark: 100 }, { name: '宽容度', score: 55, fullMark: 100 },
    ],
    density: 50,
    methodology: {
      intro: '德州结论依据：',
      steps: ['能源与农业州际经济文化', '本地骄傲营销（Texas-shaped 图标等）转化案例', '枪枝/宗教等敏感议题的内容审核经验'],
    },
    culturalStory: {
      title: '牧场与航天城的双城记',
      paragraphs: [
        '休斯顿航天中心、达拉斯牛仔、奥斯汀音乐节——德州叙事强调「大、敢、自豪」。营销太含蓄会被认为「不够德州」。',
        '烧烤与橄榄球是社交货币；本地化活动页、线下 pickup 体验仍很重要，即便在电商时代。',
        '西班牙语用户比例高：英语为主但西语切换是加分项，而非可有可无。',
      ],
      designLink: '【因】高男性度 + 直给沟通 →【果】大 CTA、清晰价格、本地配送/自提、尊重敏感话题。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '西语支持；突出本地自提/配送；直白文案。' }],
  }),
  r({
    id: 'us-fl', lat: 27.66, lng: -81.52, label: 'Florida', title: '佛罗里达州',
    tagline: '阳光、银发族与拉美脉搏',
    overview: '旅游 + 退休人口 + 拉美裔：易读、热情、电话/人工服务仍重要。',
    radarData: [
      { name: '权力距离', score: 44, fullMark: 100 }, { name: '个人主义', score: 82, fullMark: 100 },
      { name: '男性度', score: 58, fullMark: 100 }, { name: '规避不确定', score: 48, fullMark: 100 },
      { name: '长期导向', score: 30, fullMark: 100 }, { name: '宽容度', score: 65, fullMark: 100 },
    ],
    density: 58,
    methodology: {
      intro: '佛州依据：',
      steps: ['65+ 用户占比与字体/对比度需求', '迈阿密拉美文化对色彩与语言的影响', '飓风季等本地服务信息时效性'],
    },
    culturalStory: {
      title: '迈阿密海滩的霓虹与养老社区的日历',
      paragraphs: [
        '南佛罗里达：古巴、委内瑞拉移民带来西班牙语主导的商业街；北部则是退休社区「银发硅谷」。',
        '大字号、高对比、人工客服电话——对年长用户是信任信号，不是落后。',
        '主题公园、邮轮、飓风预警：事件驱动营销在该州极其有效。',
      ],
      designLink: '【因】人口老龄化 + 拉美文化 →【果】无障碍字号、西语/英语切换、电话入口、清晰时间敏感信息。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '大字体模式；电话客服入口；西语资源。' }],
  }),
  r({
    id: 'us-wa', lat: 47.75, lng: -120.74, label: 'Washington', title: '华盛顿州',
    tagline: '雨、咖啡与云：低调务实的技术人文',
    overview: '太平洋西北：环保、极简、隐私与工程师文化。',
    radarData: [
      { name: '权力距离', score: 36, fullMark: 100 }, { name: '个人主义', score: 86, fullMark: 100 },
      { name: '男性度', score: 52, fullMark: 100 }, { name: '规避不确定', score: 46, fullMark: 100 },
      { name: '长期导向', score: 50, fullMark: 100 }, { name: '宽容度', score: 70, fullMark: 100 },
    ],
    density: 42,
    methodology: {
      intro: '华盛顿州依据：',
      steps: ['西雅图科技集群 UX 偏好（Amazon、Microsoft 影响）', '环保法规与碳中和叙事接受度', '阴雨气候下的界面对比度与室内使用场景'],
    },
    culturalStory: {
      title: '星巴克诞生地与「低调奢华」',
      paragraphs: [
        '西雅图：咖啡、雨、/grafana 工程师文化。用户欣赏「不喧哗的功能」——过多弹窗会被反感。',
        '户外品牌 REI 起源于此：产品页要经得起「技术用户」审视，参数诚实比夸张形容词重要。',
        '与加州相比，西北人更含蓄：社交分享按钮存在即可，不宜强迫分享解锁功能。',
      ],
      designLink: '【因】工程师文化 + 环保价值 →【果】克制 UI、详细规格、碳足迹信息、少打扰通知。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '技术规格透明；通知克制；环保信息可选展开。' }],
  }),
  r({
    id: 'us-il', lat: 40.63, lng: -89.4, label: 'Illinois', title: '伊利诺伊州',
    tagline: '风城芝加哥：中部枢纽的务实与多元',
    overview: '中西部工商业传统：务实、中等信息密度、多元社区。',
    radarData: [
      { name: '权力距离', score: 42, fullMark: 100 }, { name: '个人主义', score: 84, fullMark: 100 },
      { name: '男性度', score: 60, fullMark: 100 }, { name: '规避不确定', score: 45, fullMark: 100 },
      { name: '长期导向', score: 38, fullMark: 100 }, { name: '宽容度', score: 62, fullMark: 100 },
    ],
    density: 52,
    methodology: {
      intro: '伊利诺伊依据：',
      steps: ['芝加哥期货/金融 UI 信息密度中等偏好', '中西部「实在」消费观与退货政策敏感度', '冬季室内使用时长对媒体消费的影响'],
    },
    culturalStory: {
      title: '密西根湖畔的摩天楼与深盘披萨',
      paragraphs: [
        '芝加哥建筑、蓝调音乐、深盘披萨——中部城市自豪但不如海岸张扬。文案「实在」比「炫酷」更管用。',
        '奥黑尔机场中转枢纽：旅行、物流类 App 在此有典型场景（航班延误、实时更新）。',
        '多元社区（波兰、墨西哥、非裔）要求营销 imagery 真实，避免单一白人家庭模板。',
      ],
      designLink: '【因】中部务实 + 枢纽经济 →【果】可靠的状态更新、清晰价格、包容性视觉、中等密度。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '强调可靠与售后；旅行类实时信息；多元 imagery。' }],
  }),
  r({
    id: 'us-ma', lat: 42.41, lng: -71.38, label: 'Massachusetts', title: '马萨诸诸塞州',
    tagline: '哈佛与麻省理工：证据导向、爱辩论',
    overview: '学术与医疗创新：用户爱问「有研究吗？」',
    radarData: [
      { name: '权力距离', score: 40, fullMark: 100 }, { name: '个人主义', score: 87, fullMark: 100 },
      { name: '男性度', score: 58, fullMark: 100 }, { name: '规避不确定', score: 50, fullMark: 100 },
      { name: '长期导向', score: 55, fullMark: 100 }, { name: '宽容度', score: 68, fullMark: 100 },
    ],
    density: 48,
    methodology: {
      intro: '马萨诸塞依据：',
      steps: ['波士顿生物医药与高等教育用户画像', '健康类 App 对临床证据引用需求', '新英格兰地区隐私与数据伦理关注度'],
    },
    culturalStory: {
      title: '波士顿茶党与今日「Citation Needed」',
      paragraphs: [
        '清教徒遗产留下「证据与辩论」传统：健康、教育、金融产品若缺出处，波士顿用户会质疑。',
        '哈佛广场、麻省理工实验室——高教育人群愿读长文，但结构要清晰（目录、摘要、跳转）。',
        '冬季漫长：室内阅读场景多，深色模式与 serif 标题偶显「学术气质」。',
      ],
      designLink: '【因】高教育 + 中等不确定性规避 →【果】引用文献、数据图表、分层披露、专业可信语气。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '数据出处、白皮书下载；长文用清晰层级。' }],
  }),
  r({
    id: 'us-hi', lat: 19.9, lng: -155.58, label: 'Hawaii', title: '夏威夷州',
    tagline: 'Aloha 不是标语，是节奏',
    overview: '岛屿旅游文化：松弛、自然、尊重原住民叙事。',
    radarData: [
      { name: '权力距离', score: 44, fullMark: 100 }, { name: '个人主义', score: 78, fullMark: 100 },
      { name: '男性度', score: 48, fullMark: 100 }, { name: '规避不确定', score: 43, fullMark: 100 },
      { name: '长期导向', score: 40, fullMark: 100 }, { name: '宽容度', score: 75, fullMark: 100 },
    ],
    density: 38,
    methodology: {
      intro: '夏威夷依据：',
      steps: ['原住民文化敏感与旅游营销规范', '岛屿物流时效与预订体验', '亚太游客多元语言需求'],
    },
    culturalStory: {
      title: '冲浪板上的时间感',
      paragraphs: [
        '「Aloha」含尊重与耐心：催促式倒计时营销易引发反感。预订流程要清晰，但语气可柔和。',
        '火山、海浪、草裙舞意象需避免 caricature；尊重 Native Hawaiian 叙事是品牌红线。',
        '日本、韩国游客占比高：多语言与多时区客服常见需求。',
      ],
      designLink: '【因】旅游松弛 + 文化敏感 →【果】柔和交互、真实摄影、文化合规审查、多语言。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '避免压迫式促销；尊重原住民元素；旅游预订透明。' }],
  }),
  r({
    id: 'us-ga', lat: 32.17, lng: -83.5, label: 'Georgia', title: '佐治亚州',
    tagline: '亚特兰大：新南方的商业枢纽',
    overview: '南部增长中心：非裔文化影响深、音乐与体育营销强。',
    radarData: [
      { name: '权力距离', score: 48, fullMark: 100 }, { name: '个人主义', score: 80, fullMark: 100 },
      { name: '男性度', score: 62, fullMark: 100 }, { name: '规避不确定', score: 46, fullMark: 100 },
      { name: '长期导向', score: 36, fullMark: 100 }, { name: '宽容度', score: 58, fullMark: 100 },
    ],
    density: 54,
    methodology: {
      intro: '佐治亚依据：',
      steps: ['亚特兰大物流与音乐产业（嘻哈文化）营销', '非裔美国用户代表性研究', '南部宗教社区对内容偏好'],
    },
    culturalStory: {
      title: '民权运动故乡与嘻哈商业',
      paragraphs: [
        '亚特兰大：民权历史、CNN、可口可乐总部——叙事常强调进步与社区。',
        '嘻哈与 R&B 文化影响全球流行审美：音乐联名、运动员代言在该州尤其有效。',
        '「南方好客」：客服语气可热情，但要真诚，过度机械回复会失分。',
      ],
      designLink: '【因】社区认同 + 音乐体育文化 →【果】代表性 imagery、联名活动、热情但真实的客服语气。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '社区与音乐营销；非裔用户真实代表；客服人性化。' }],
  }),
  r({
    id: 'us-co', lat: 39.55, lng: -105.78, label: 'Colorado', title: '科罗拉多州',
    tagline: '落基山下：户外、啤酒与初创',
    overview: '户外生活方式 + 丹佛科技：健康、环保、休闲语气。',
    radarData: [
      { name: '权力距离', score: 38, fullMark: 100 }, { name: '个人主义', score: 85, fullMark: 100 },
      { name: '男性度', score: 54, fullMark: 100 }, { name: '规避不确定', score: 44, fullMark: 100 },
      { name: '长期导向', score: 45, fullMark: 100 }, { name: '宽容度', score: 72, fullMark: 100 },
    ],
    density: 44,
    methodology: {
      intro: '科罗拉多依据：',
      steps: ['户外装备电商 imagery 与功能描述', '大麻合法化后的品类合规 UI', '高海拔地区物流与户外安全提示'],
    },
    culturalStory: {
      title: '滑雪季与精酿啤酒标签',
      paragraphs: [
        '丹佛、博尔德：滑雪、徒步、精酿啤酒——健康、户外、本地小店文化浓厚。',
        '初创公司密度高：用户愿试新 App，但反感 dark pattern。',
        '季节性强：冬季运动、夏季露营，营销日历应跟季节模块切换。',
      ],
      designLink: '【因】户外文化 + 创新接受度 →【果】功能导向摄影、季节运营、合规品类提示、诚实订阅。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '户外场景 imagery；季节模块；订阅透明。' }],
  }),
];
