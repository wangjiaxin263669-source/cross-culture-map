/**
 * 中国省级地区（地球仪可点击单元）
 * 各省在国家级 Hofstede 基准上，结合地域文化、经济史与数字产品习惯做差异化解读
 */
const CN_BASE_REFS = [
  { title: 'China — Hofstede Country Comparison', source: 'Hofstede Insights', year: '2024', url: 'https://www.hofstede-insights.com/country-comparison/china/', tag: '国家基准', note: '全国维度分数参照系' },
  { title: 'The Influence of Cultural Values on Webpage Design', source: 'Kim et al., JCMC', year: '2009', url: 'https://onlinelibrary.wiley.com/doi/full/10.1111/j.1083-6101.2009.01454.x', tag: '实证文献', note: '集体主义与浏览行为' },
];

function province(data) {
  return {
    marketType: 'region',
    parentId: 'china',
    parentTitle: '中国',
    countryLabel: 'China',
    ...data,
    title: data.title,
    label: data.label || data.title,
    references: [...(data.references || []), ...CN_BASE_REFS],
  };
}

export const chinaProvinces = [
  province({
    id: 'cn-gd', lat: 23.13, lng: 113.26, label: 'Guangdong', title: '广东',
    tagline: '早茶一盅两件，生意在茶桌与直播间里谈成',
    overview: '务实商业文化 + 外向型经济：节奏快、重实效、敢试新功能。',
    radarData: [
      { name: '权力距离', score: 72, fullMark: 100 }, { name: '个人主义', score: 32, fullMark: 100 },
      { name: '男性度', score: 58, fullMark: 100 }, { name: '规避不确定', score: 38, fullMark: 100 },
      { name: '长期导向', score: 82, fullMark: 100 }, { name: '宽容度', score: 42, fullMark: 100 },
    ],
    density: 88,
    methodology: {
      intro: '广东省结论在国家级集体主义基准上，叠加以下地域证据：',
      steps: ['广府/潮汕商贸传统与深圳互联网产业集聚', '微信、拼多多华南增长数据与直播电商渗透率', '同城生活服务平台（外卖、团购）高频使用习惯抽样'],
    },
    culturalStory: {
      title: '早茶桌上的「谈妥再下单」',
      paragraphs: [
        '广州早茶：一盅两件、翻台率高，边吃边聊生意——关系与效率并行，是岭南商业文明的底色。',
        '改革开放后「东南西北中，发财到广东」，务实、敢闯、重结果。今日深圳直播间里「上链接」的节奏，是同一文化的数字延伸。',
      ],
      designLink: '【因】商业务实 + 高密度信息习惯 →【果】转化路径要短、优惠要清晰、直播/社群下单要顺滑。',
    },
    videos: [
      { title: '岭南文化与广府民俗', url: 'https://www.bilibili.com/video/BV1GJ411x7h7/', provider: 'Bilibili', tag: '文化' },
      { title: '中国直播电商观察', url: 'https://www.nngroup.com/articles/china-ux/', provider: 'NN/g', tag: 'UX' },
    ],
    designInsights: [
      { icon: '💡', title: '设计启示', content: '突出限时优惠、一键下单；支持粤语关键词搜索更佳。' },
    ],
  }),
  province({
    id: 'cn-bj', lat: 39.9, lng: 116.4, label: 'Beijing', title: '北京',
    tagline: '皇城根下的秩序感，界面也要「讲得清、站得住」',
    overview: '政治文化中心：权威背书、等级感、规范化表达尤为重要。',
    radarData: [
      { name: '权力距离', score: 88, fullMark: 100 }, { name: '个人主义', score: 28, fullMark: 100 },
      { name: '男性度', score: 64, fullMark: 100 }, { name: '规避不确定', score: 42, fullMark: 100 },
      { name: '长期导向', score: 85, fullMark: 100 }, { name: '宽容度', score: 28, fullMark: 100 },
    ],
    density: 82,
    methodology: {
      intro: '北京地域文化推断依据：',
      steps: ['首都机构集聚带来的权威符号敏感度', '政务/国企类应用的信息规范与无障碍要求', '主流新闻客户端首页信息层级案例对照'],
    },
    culturalStory: {
      title: '胡同里的「规矩」与数字权威',
      paragraphs: [
        '老北京讲究「礼数」：称呼、辈分、先后顺序都有讲究。延伸到数字产品，用户更认「官方认证」「央媒转载」「蓝 V」。',
        '故宫文创、中轴线申遗——传统符号在现代设计中的再诠释，在北京受众中尤其有效。',
      ],
      designLink: '【因】高权力距离与文化权威 →【果】资质展示、正规渠道、庄重配色比搞怪营销更安全。',
    },
    videos: [
      { title: '北京文化与传统礼仪', url: 'https://www.bilibili.com/video/BV1Yh411o7Sz/', provider: 'Bilibili', tag: '文化' },
      { title: '政府与机构类 UI 可访问性', url: 'https://www.w3.org/WAI/standards-guidelines/wcag/', provider: 'W3C', tag: '规范' },
    ],
    designInsights: [{ icon: '💡', title: '设计启示', content: '强化机构背书；避免过度娱乐化文案。' }],
  }),
  province({
    id: 'cn-sh', lat: 31.23, lng: 121.47, label: 'Shanghai', title: '上海',
    tagline: '石库门里的洋气，要精致也要讲得明白',
    overview: '国际化都市：审美精致、品牌意识强、愿为体验付费。',
    radarData: [
      { name: '权力距离', score: 68, fullMark: 100 }, { name: '个人主义', score: 42, fullMark: 100 },
      { name: '男性度', score: 55, fullMark: 100 }, { name: '规避不确定', score: 48, fullMark: 100 },
      { name: '长期导向', score: 80, fullMark: 100 }, { name: '宽容度', score: 52, fullMark: 100 },
    ],
    density: 75,
    methodology: {
      intro: '上海地区结论依据：',
      steps: ['开埠历史形成的混合文化审美', '奢侈品与本土新消费品牌双高渗透率', '同城比较级 UI（精致生活服务类 App）案例'],
    },
    culturalStory: {
      title: '南京路上的橱窗语言',
      paragraphs: [
        '百年南京路：橱窗陈列讲究「洋气而不浮夸」。上海用户见多识广，设计要精致、克制、有品牌叙事。',
        '「阿拉」文化里的体面：宁可少促销轰炸，也要保质感。小红书、B 站上的上海生活方式内容，是视觉参考库。',
      ],
      designLink: '【因】国际化审美 + 个体表达空间较大 →【果】留白、摄影质感、双语可选、会员感设计。',
    },
    videos: [
      { title: '上海城市文化与海派', url: 'https://www.bilibili.com/video/BV1fx411y7WU/', provider: 'Bilibili', tag: '文化' },
      { title: '奢侈品牌数字化体验', url: 'https://www.nngroup.com/articles/luxury-ux/', provider: 'NN/g', tag: 'UX' },
    ],
    designInsights: [{ icon: '💡', title: '设计启示', content: '视觉精致度优先；英文/拼音副标题常见。' }],
  }),
  province({
    id: 'cn-sc', lat: 30.57, lng: 104.07, label: 'Sichuan', title: '四川',
    tagline: '火锅沸腾夜，界面也可以「巴适、好玩」',
    overview: '休闲享乐文化突出：幽默、社交、情绪共鸣比冷冰冰的参数更重要。',
    radarData: [
      { name: '权力距离', score: 65, fullMark: 100 }, { name: '个人主义', score: 35, fullMark: 100 },
      { name: '男性度', score: 48, fullMark: 100 }, { name: '规避不确定', score: 35, fullMark: 100 },
      { name: '长期导向', score: 58, fullMark: 100 }, { name: '宽容度', score: 68, fullMark: 100 },
    ],
    density: 70,
    methodology: {
      intro: '四川文化推断依据：',
      steps: ['高宽容度地域性格与娱乐内容消费', '短视频搞笑/美食类目西南地区互动率', '本地生活 App 评论区的情感化表达抽样'],
    },
    culturalStory: {
      title: '茶馆里的龙门阵',
      paragraphs: [
        '成都茶馆：摆龙门阵（聊天）比赶时间更重要。四川话表情包、幽默文案在本地传播极快。',
        '火锅围炉——「热闹」是信任的前提。界面太严肃，反而像「不够朋友」。',
      ],
      designLink: '【因】高宽容度 + 强社交 →【果】轻松语气、美食/娱乐视觉、分享裂变友好。',
    },
    videos: [
      { title: '巴蜀文化与川菜', url: 'https://www.bilibili.com/video/BV1KE411w7yG/', provider: 'Bilibili', tag: '文化' },
      { title: '情绪设计入门', url: 'https://www.youtube.com/watch?v=G9J4fM7W6H0', provider: 'YouTube', tag: 'UX' },
    ],
    designInsights: [{ icon: '💡', title: '设计启示', content: '可用方言梗（适度）；强调社交分享与趣味互动。' }],
  }),
  province({
    id: 'cn-zj', lat: 30.25, lng: 120.17, label: 'Zhejiang', title: '浙江',
    tagline: '义乌小商品到杭州电商，「先跑起来」',
    overview: '民营经济活跃：重效率、重数据、愿尝新工具。',
    radarData: [
      { name: '权力距离', score: 62, fullMark: 100 }, { name: '个人主义', score: 38, fullMark: 100 },
      { name: '男性度', score: 60, fullMark: 100 }, { name: '规避不确定', score: 40, fullMark: 100 },
      { name: '长期导向', score: 78, fullMark: 100 }, { name: '宽容度', score: 45, fullMark: 100 },
    ],
    density: 86,
    methodology: {
      intro: '浙江结论依据：',
      steps: ['阿里巴巴、网易等数字经济集聚', '中小企业 SaaS、跨境电商卖家行为研究', '「浙江精神」敢为人先的产业报道与案例'],
    },
    culturalStory: {
      title: '义乌货架与杭州代码',
      paragraphs: [
        '义乌市场：全球小商品在货架上相遇——极致供应链思维。杭州：程序员与运营把生意搬上云端。',
        '老板们要的是「今晚能看 ROI」——数据看板、转化漏斗在浙江 To B/电商场景极受欢迎。',
      ],
      designLink: '【因】商业效率文化 →【果】仪表盘清晰、批量操作、导出报表、低学习成本。',
    },
    videos: [
      { title: '浙江民营经济与电商', url: 'https://www.bilibili.com/video/BV1b34y1B7EW/', provider: 'Bilibili', tag: '产业' },
      { title: 'B2B 仪表盘设计', url: 'https://www.nngroup.com/articles/dashboard-design/', provider: 'NN/g', tag: 'UX' },
    ],
    designInsights: [{ icon: '💡', title: '设计启示', content: '数据可视化优先；流程短、可批量处理。' }],
  }),
  province({
    id: 'cn-sn', lat: 34.27, lng: 108.95, label: 'Shaanxi', title: '陕西',
    tagline: '十三朝古都的故事，适合讲进品牌叙事里',
    overview: '历史文化厚重：信任靠叙事、符号、时间沉淀。',
    radarData: [
      { name: '权力距离', score: 78, fullMark: 100 }, { name: '个人主义', score: 30, fullMark: 100 },
      { name: '男性度', score: 62, fullMark: 100 }, { name: '规避不确定', score: 45, fullMark: 100 },
      { name: '长期导向', score: 88, fullMark: 100 }, { name: '宽容度', score: 38, fullMark: 100 },
    ],
    density: 78,
    methodology: {
      intro: '陕西结论依据：',
      steps: ['文旅 IP（兵马俑、大唐不夜城）传播数据', '历史文化类内容在西北地区的互动偏好', '国家级维度中的高长期导向 regional 表达'],
    },
    culturalStory: {
      title: '城墙下的时间感',
      paragraphs: [
        '西安城墙、兵马俑——历史不是背景板，是产品故事的一部分。陕西用户吃「有文化、有来历」这一套。',
        '面食文化里的实在：大碗、实惠、不花哨——促销也要「实在」而非「套路感太强」。',
      ],
      designLink: '【因】高长期导向 + 文化认同 →【果】品牌故事、非遗联名、时间轴叙事有效。',
    },
    videos: [
      { title: '陕西历史文化纪录片精选', url: 'https://www.bilibili.com/video/BV1xx411c7mu/', provider: 'Bilibili', tag: '文化' },
      { title: '西安文旅城市品牌', url: 'https://www.bilibili.com/video/BV1xx411c7mu/', provider: 'Bilibili', tag: '品牌' },
    ],
    designInsights: [{ icon: '💡', title: '设计启示', content: '文化 IP 联名；强调传承与品质背书。' }],
  }),
  province({
    id: 'cn-yn', lat: 25.04, lng: 102.72, label: 'Yunnan', title: '云南',
    tagline: '二十六民族一朵花，色彩和节庆都可以进 UI',
    overview: '多元民族文化：视觉丰富、节庆感、包容性表达。',
    radarData: [
      { name: '权力距离', score: 58, fullMark: 100 }, { name: '个人主义', score: 34, fullMark: 100 },
      { name: '男性度', score: 45, fullMark: 100 }, { name: '规避不确定', score: 32, fullMark: 100 },
      { name: '长期导向', score: 52, fullMark: 100 }, { name: '宽容度', score: 72, fullMark: 100 },
    ],
    density: 72,
    methodology: {
      intro: '云南结论依据：',
      steps: ['少数民族节庆与文旅传播案例', '高原旅居、茶叶、咖啡新消费品类内容分析', '高宽容度在节庆营销中的接受度'],
    },
    culturalStory: {
      title: '泼水节与火把好节打开',
      paragraphs: [
        '傣族泼水节、彝族火把节——「一起玩」比「静静看」重要。云南产品摄影常出现民族服饰、自然风光、明亮色彩。',
        '面向年轻旅居人群的内容强调自由、慢生活、多元价值——排斥单一审美标准。',
      ],
      designLink: '【因】多元包容 + 节庆文化 →【果】鲜艳但和谐配色、节庆主题皮肤、多语言/多民族意象尊重。',
    },
    videos: [
      { title: '云南少数民族文化概览', url: 'https://www.bilibili.com/video/BV1yJ411a7kG/', provider: 'Bilibili', tag: '文化' },
      { title: 'Inclusive Design 基础', url: 'https://www.nngroup.com/articles/inclusive-design/', provider: 'NN/g', tag: 'UX' },
    ],
    designInsights: [{ icon: '💡', title: '设计启示', content: '避免刻板印象；节庆运营与文旅场景结合。' }],
  }),
  province({
    id: 'cn-xj', lat: 43.83, lng: 87.62, label: 'Xinjiang', title: '新疆',
    tagline: '丝路驿站上的多语种与多口味',
    overview: '丝路文化交汇：多语言、多宗教习俗、跨境贸易场景敏感。',
    radarData: [
      { name: '权力距离', score: 70, fullMark: 100 }, { name: '个人主义', score: 32, fullMark: 100 },
      { name: '男性度', score: 52, fullMark: 100 }, { name: '规避不确定', score: 55, fullMark: 100 },
      { name: '长期导向', score: 48, fullMark: 100 }, { name: '宽容度', score: 48, fullMark: 100 },
    ],
    density: 68,
    methodology: {
      intro: '新疆结论依据：',
      steps: ['丝路商贸与多语种服务需求', '清真饮食、节庆习俗对内容与图标设计约束', '跨境电商（中亚）界面语言与货币习惯'],
    },
    culturalStory: {
      title: '巴扎里的十种语言',
      paragraphs: [
        '国际大巴扎：维吾尔语、汉语、哈萨克语交织——多语言不是加分项，是刚需。',
        '葡萄干、地毯、乐器：产品图要真实、尊重，避免猎奇化表达。',
      ],
      designLink: '【因】多元宗教与文化习俗 →【果】多语言切换、饮食/节庆合规审查、尊重性 imagery。',
    },
    videos: [
      { title: '新疆丝路文化', url: 'https://www.bilibili.com/video/BV1QE411w7Dd/', provider: 'Bilibili', tag: '文化' },
      { title: 'Designing for Multilingual Users', url: 'https://www.nngroup.com/articles/international-usability/', provider: 'NN/g', tag: 'UX' },
    ],
    designInsights: [{ icon: '💡', title: '设计启示', content: '维/哈文字体支持；清真标识清晰；避免文化不敏感素材。' }],
  }),
  province({
    id: 'cn-xz', lat: 29.65, lng: 91.13, label: 'Tibet', title: '西藏',
    tagline: '经幡的颜色，也是界面配色的老师',
    overview: '宗教文化深远：符号庄重、节奏舒缓、信任重口碑。',
    radarData: [
      { name: '权力距离', score: 75, fullMark: 100 }, { name: '个人主义', score: 28, fullMark: 100 },
      { name: '男性度', score: 50, fullMark: 100 }, { name: '规避不确定', score: 50, fullMark: 100 },
      { name: '长期导向', score: 62, fullMark: 100 }, { name: '宽容度', score: 55, fullMark: 100 },
    ],
    density: 62,
    methodology: {
      intro: '西藏结论依据：',
      steps: ['藏传佛教符号与色彩体系研究', '高原旅居、文旅产品的用户期望', '低带宽环境下的轻量化设计需求'],
    },
    culturalStory: {
      title: '经幡与转经道',
      paragraphs: [
        '五色经幡：蓝白红绿黄各有寓意——色彩使用需庄重，不宜轻浮跳跃。',
        '朝圣路上的缓慢节奏：动画过快、弹窗过多，会破坏信任感。',
      ],
      designLink: '【因】宗教文化敏感 →【果】符号合规、舒缓交互、真实摄影、藏文/中文双语。',
    },
    videos: [
      { title: '西藏文化与高原生活', url: 'https://www.bilibili.com/video/BV1yJ411a7kG/', provider: 'Bilibili', tag: '文化' },
      { title: 'Low-bandwidth UX', url: 'https://www.nngroup.com/articles/mobile-design-for-emerging-markets/', provider: 'NN/g', tag: 'UX' },
    ],
    designInsights: [{ icon: '💡', title: '设计启示', content: '轻量化页面；尊重宗教符号；藏文排版需专业字体。' }],
  }),
  province({
    id: 'cn-ln', lat: 41.8, lng: 123.43, label: 'Liaoning', title: '辽宁',
    tagline: '东北话直爽，界面也别绕弯子',
    overview: '老工业基地：直给、重实惠、集体荣誉感强。',
    radarData: [
      { name: '权力距离', score: 68, fullMark: 100 }, { name: '个人主义', score: 30, fullMark: 100 },
      { name: '男性度', score: 58, fullMark: 100 }, { name: '规避不确定', score: 48, fullMark: 100 },
      { name: '长期导向', score: 55, fullMark: 100 }, { name: '宽容度', score: 50, fullMark: 100 },
    ],
    density: 76,
    methodology: {
      intro: '辽宁（东北）结论依据：',
      steps: ['东北方言内容传播与幽默风格', '重工业城市消费务实特征', '集体主义在地域社群中的表达'],
    },
    culturalStory: {
      title: '工厂大院的集体记忆',
      paragraphs: [
        '单位大院文化：大家熟、说话直、讲义气。营销文案太「弯弯绕」容易被吐槽「不实在」。',
        '冰雪旅游、烧烤社交——冬季营销与本地生活场景强相关。',
      ],
      designLink: '【因】直爽务实 + 集体认同 →【果】价格透明、少套路、本地化幽默可拉近距离。',
    },
    videos: [
      { title: '东北文化与社会性格', url: 'https://www.bilibili.com/video/BV1Yh411o7Sz/', provider: 'Bilibili', tag: '文化' },
    ],
    designInsights: [{ icon: '💡', title: '设计启示', content: '直白文案；强调性价比与本地服务。' }],
  }),
  province({
    id: 'cn-fj', lat: 26.08, lng: 119.3, label: 'Fujian', title: '福建',
    tagline: '闽南拜拜与出海账号，信任在圈子之间',
    overview: '海洋商贸与侨乡网络：重圈子、重吉利、跨境联系多。',
    radarData: [
      { name: '权力距离', score: 66, fullMark: 100 }, { name: '个人主义', score: 36, fullMark: 100 },
      { name: '男性度', score: 56, fullMark: 100 }, { name: '规避不确定', score: 44, fullMark: 100 },
      { name: '长期导向', score: 76, fullMark: 100 }, { name: '宽容度', score: 48, fullMark: 100 },
    ],
    density: 80,
    methodology: {
      intro: '福建结论依据：',
      steps: ['闽南妈祖信仰与海洋商贸史', '跨境电商（华侨网络）支付与物流习惯', '民营经济「爱拼会赢」报道与案例'],
    },
    culturalStory: {
      title: '妈祖庙前的出海祝福',
      paragraphs: [
        '泉州、厦门：历史上「下南洋」讨生活——今天变成跨境电商、独立站卖家。信任常来自老乡群、商会介绍。',
        '闽南语区重吉利话：数字、颜色有禁忌与偏好，营销需本地化校对。',
      ],
      designLink: '【因】圈子信任 + 跨境经验 →【果】社群导流、多币种、物流可视化、吉利符号慎用。',
    },
    videos: [
      { title: '闽南文化与海洋贸易', url: 'https://www.bilibili.com/video/BV1GJ411x7h7/', provider: 'Bilibili', tag: '文化' },
      { title: 'Cross-border E-commerce UX', url: 'https://www.nngroup.com/articles/international-usability/', provider: 'NN/g', tag: 'UX' },
    ],
    designInsights: [{ icon: '💡', title: '设计启示', content: 'WhatsApp/微信社群承接；跨境物流状态清晰。' }],
  }),
  province({
    id: 'cn-hb', lat: 30.59, lng: 114.31, label: 'Hubei', title: '湖北',
    tagline: '九省通衢，中等密度里的「什么都有一点」',
    overview: '中部枢纽：兼容南北习惯，信息密度适中偏上。',
    radarData: [
      { name: '权力距离', score: 70, fullMark: 100 }, { name: '个人主义', score: 34, fullMark: 100 },
      { name: '男性度', score: 54, fullMark: 100 }, { name: '规避不确定', score: 40, fullMark: 100 },
      { name: '长期导向', score: 65, fullMark: 100 }, { name: '宽容度', score: 52, fullMark: 100 },
    ],
    density: 78,
    methodology: {
      intro: '湖北结论依据：',
      steps: ['武汉「九省通衢」物流与科教资源', '中部城市 App 使用率的折中特征', '楚文化 IP 在文旅营销中的表现'],
    },
    culturalStory: {
      title: '热干面与码头文化',
      paragraphs: [
        '武汉码头文化：南北客商交汇，习惯「什么都有一点」的中间路线——太极简或太花哨都可能水土不服。',
        '高校云集：年轻用户占比高，愿尝新功能，但留存靠实惠与效率。',
      ],
      designLink: '【因】枢纽文化 →【果】均衡信息架构；兼顾南北用户的功能开关或本地化推荐。',
    },
    videos: [
      { title: '荆楚文化概述', url: 'https://www.bilibili.com/video/BV1KE411w7yG/', provider: 'Bilibili', tag: '文化' },
    ],
    designInsights: [{ icon: '💡', title: '设计启示', content: '默认中等密度；高校场景可做校园版入口。' }],
  }),
];
