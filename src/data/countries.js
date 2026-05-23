/**
 * 各国文化数据：故事化讲解 + 视频延伸阅读 + 设计启示
 */
export const countriesData = [
  {
    lat: 35.86, lng: 104.19, label: 'China', title: '中国',
    tagline: '一家人的年夜饭，也是界面上的「全都给你看见」',
    overview: '集体主义 + 高权力距离：信息要全、背书要硬、面子要足。',
    radarData: [
      { name: '权力距离', score: 80, fullMark: 100 },
      { name: '个人主义', score: 20, fullMark: 100 },
      { name: '男性度', score: 66, fullMark: 100 },
      { name: '规避不确定', score: 30, fullMark: 100 },
      { name: '长期导向', score: 87, fullMark: 100 },
      { name: '宽容度', score: 24, fullMark: 100 },
    ],
    density: 85,
    culturalStory: {
      title: '年夜饭桌上的「多任务」',
      paragraphs: [
        '春节团圆饭，长辈一句「来，都尝尝」，桌上十几道菜同时动筷——没人只做一件事。这种「并行参与」深植于集体主义：在一起，才算完成。',
        '线上也是如此：淘宝首页同时露出秒杀、直播、会员、榜单；微信里支付、聊天、小程序并存。用户不是嫌乱，而是习惯在一张屏里掌握全局。',
      ],
      designLink: '高信息密度 + 权威背书（金牌商家、央视合作）不是堆砌，而是「像年夜饭一样丰盛且可信」。',
    },
    videos: [
      { title: '什么是文化研究（入门）', url: 'https://www.bilibili.com/video/BV1td4y1P7Us/', provider: 'Bilibili', tag: '入门' },
      { title: '霍夫斯泰德文化维度讲解', url: 'https://www.youtube.com/watch?v=lX7pY5nXYHY', provider: 'YouTube', tag: '理论' },
      { title: '中国用户体验设计观察', url: 'https://www.nngroup.com/articles/china-ux/', provider: 'NN/g', tag: 'UX' },
    ],
    designInsights: [
      { icon: '💡', title: '设计启示：密度即诚意', content: '首屏可承载多模块，但需清晰分区；用徽章、认证、销量建立信任链。' },
      { icon: '🖼️', title: '案例：星巴克中国', content: '一屏整合菜单、会员、优惠与社交入口，契合「并行任务」习惯。', caseLink: 'https://www.starbucks.com.cn/', imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=600' },
    ],
  },
  {
    lat: 37.09, lng: -95.71, label: 'USA', title: '美国',
    tagline: '「Only YOU」——一个人也能拯救森林',
    overview: '极端个人主义：留白、专注、掌控感比热闹更重要。',
    radarData: [
      { name: '权力距离', score: 40, fullMark: 100 },
      { name: '个人主义', score: 91, fullMark: 100 },
      { name: '男性度', score: 62, fullMark: 100 },
      { name: '规避不确定', score: 46, fullMark: 100 },
      { name: '长期导向', score: 26, fullMark: 100 },
      { name: '宽容度', score: 68, fullMark: 100 },
    ],
    density: 40,
    culturalStory: {
      title: 'Smokey Bear 与「只有你」',
      paragraphs: [
        '1944 年起，美国 Smokey Bear 海报指着你说："Only YOU can prevent forest fires."——防火是个人责任，不是「我们大家」。',
        '这种叙事贯穿产品：iPhone 强调「你的照片你的隐私」；Netflix 一账号一品味；网站首屏常只有一个大 CTA，因为打扰等于不尊重个人节奏。',
      ],
      designLink: '留白不是空，是尊重；单线程流程是在说「这一刻只属于你」。',
    },
    videos: [
      { title: '跨文化可用性准则', url: 'https://www.nngroup.com/articles/cross-cultural-design/', provider: 'NN/g', tag: 'UX' },
      { title: '个人主义与集体主义', url: 'https://www.youtube.com/watch?v=jbBtMvG8eek', provider: 'YouTube', tag: '文化' },
      { title: '美国网页设计趋势', url: 'https://www.youtube.com/watch?v=ZftSjc1hY6U', provider: 'YouTube', tag: '案例' },
    ],
    designInsights: [
      { icon: '💡', title: '设计启示：少即是尊重', content: '核心路径单一明确；提供跳过、自定义、关闭追踪等「掌控感」控件。' },
      { icon: '🖼️', title: '案例：星巴克美国', content: '首页极简，突出 Order 按钮，几乎无并行干扰。', caseLink: 'https://www.starbucks.com/', imageUrl: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=600' },
    ],
  },
  {
    lat: 36.2, lng: 138.25, label: 'Japan', title: '日本',
    tagline: '一枚饭团包装上的字数，比你想的多十倍',
    overview: '极高不确定性规避：细节、说明、口碑缺一不可。',
    radarData: [
      { name: '权力距离', score: 54, fullMark: 100 },
      { name: '个人主义', score: 46, fullMark: 100 },
      { name: '男性度', score: 95, fullMark: 100 },
      { name: '规避不确定', score: 92, fullMark: 100 },
      { name: '长期导向', score: 88, fullMark: 100 },
      { name: '宽容度', score: 42, fullMark: 100 },
    ],
    density: 95,
    culturalStory: {
      title: '《爱乐之城》海报的日本版',
      paragraphs: [
        '法国版海报：浪漫氛围、大量留白。日本版：密密麻麻的媒体评分、剧情要点、演员表——因为「未知=不安」。',
        '便利店饭团包装背面写满过敏原、产地、加热方式；电商商品页像说明书。不是啰嗦，是用信息抚平焦虑。',
      ],
      designLink: '冗余说明、对比表、FAQ、获奖标识，都是在说「我们已经替你想到了」。',
    },
    videos: [
      { title: '日本文化研究案例', url: 'https://www.bilibili.com/video/BV1YG4y1B7Jh/', provider: 'Bilibili', tag: '文化' },
      { title: '日本 UX 设计特点', url: 'https://www.youtube.com/watch?v=s8ETUOQM4Rk', provider: 'YouTube', tag: 'UX' },
      { title: '霍夫斯泰德：日本维度', url: 'https://www.hofstede-insights.com/country-comparison/japan/', provider: 'Hofstede', tag: '数据' },
    ],
    designInsights: [
      { icon: '💡', title: '设计启示：细节即安心', content: '参数表、步骤图、错误提示要具体；色彩偏稳重，少跳动式促销。' },
      { icon: '🖼️', title: '案例：电影海报本地化', content: '同片不同海报信息密度，是跨文化设计的经典教材。', caseLink: 'https://www.imdb.com/title/tt3783958/mediaviewer/rm324546560', imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600' },
    ],
  },
  {
    lat: 51.16, lng: 10.45, label: 'Germany', title: '德国',
    tagline: '工程师文化：先读说明书，再按同意键',
    overview: '低权力距离 + 逻辑至上：隐私与参数必须透明。',
    radarData: [
      { name: '权力距离', score: 35, fullMark: 100 },
      { name: '个人主义', score: 67, fullMark: 100 },
      { name: '男性度', score: 66, fullMark: 100 },
      { name: '规避不确定', score: 65, fullMark: 100 },
      { name: '长期导向', score: 83, fullMark: 100 },
      { name: '宽容度', score: 40, fullMark: 100 },
    ],
    density: 70,
    culturalStory: {
      title: 'GDPR 与「我自己判断」',
      paragraphs: [
        '德国用户从小习惯：合同条款可读、产品参数可核对、广告_claim_可质疑。权威头衔不如第三方检测、CE 标志、独立测评。',
        '汽车网站若只有美图没有油耗表，信任立刻打折。不是冷漠，是「请给我证据」。',
      ],
      designLink: '栅格对齐、面包屑、Cookie 分层同意、技术白皮书下载——都是「可验证」的设计语言。',
    },
    videos: [
      { title: 'GDPR 与 Cookie 设计', url: 'https://gdpr.eu/cookies/', provider: 'GDPR.eu', tag: '合规' },
      { title: '德国用户研究', url: 'https://www.youtube.com/watch?v=2X8I77XwJn4', provider: 'YouTube', tag: 'UX' },
      { title: '霍夫斯泰德：德国', url: 'https://www.hofstede-insights.com/country-comparison/germany/', provider: 'Hofstede', tag: '数据' },
    ],
    designInsights: [
      { icon: '💡', title: '设计启示：逻辑可见', content: '规格对比表、数据来源、隐私开关要前置且可读。' },
    ],
  },
  {
    lat: -14.23, lng: -51.92, label: 'Brazil', title: '巴西',
    tagline: '桑巴、嘉年华，和手机里跳动的 WhatsApp 绿点',
    overview: '集体主义 + 高宽容度：要热闹、要人、要现在开心。',
    radarData: [
      { name: '权力距离', score: 69, fullMark: 100 },
      { name: '个人主义', score: 38, fullMark: 100 },
      { name: '男性度', score: 49, fullMark: 100 },
      { name: '规避不确定', score: 76, fullMark: 100 },
      { name: '长期导向', score: 44, fullMark: 100 },
      { name: '宽容度', score: 59, fullMark: 100 },
    ],
    density: 60,
    culturalStory: {
      title: '从里约嘉年华到家族群里的购物链接',
      paragraphs: [
        '狂欢节里，整条街跟着鼓点一起动——「在一起」比「一个人酷」更重要。巴西人习惯在 WhatsApp 家族群分享链接、砍价、晒单，购买是社交行为。',
        '色彩鲜艳、音乐感强、真人笑脸多，不是肤浅，是「生活值得庆祝」的文化底色（高宽容度）。',
      ],
      designLink: '高饱和视觉 + 一键分享 + 即时聊天入口，比冷峻的极简更能建立信任。',
    },
    videos: [
      { title: '文化与界面信任度', url: 'https://www.nngroup.com/articles/trust-and-culture/', provider: 'NN/g', tag: 'UX' },
      { title: '巴西数字市场概览', url: 'https://www.youtube.com/watch?v=Gv8W9XkZ8eE', provider: 'YouTube', tag: '市场' },
      { title: '霍夫斯泰德：巴西', url: 'https://www.hofstede-insights.com/country-comparison/brazil/', provider: 'Hofstede', tag: '数据' },
      { title: '拉美设计色彩', url: 'https://www.bilibili.com/video/BV1QK4y1r7SW/', provider: 'Bilibili', tag: '设计' },
    ],
    designInsights: [
      { icon: '💡', title: '设计启示：社交即界面', content: '分享按钮、群购、WhatsApp 悬浮入口；人物情绪摄影优于抽象插画。' },
      { icon: '🎨', title: '色彩：热情可点击', content: '黄绿蓝等高饱和配色契合嘉年华能量，但需保证可读对比度。' },
    ],
  },
  {
    lat: 23.88, lng: 45.07, label: 'Saudi Arabia', title: '沙特阿拉伯',
    tagline: '从沙漠商队到 RTL 的王座式阅读',
    overview: '高权力距离 + 宗教传统：秩序、尊贵、合规是底线。',
    radarData: [
      { name: '权力距离', score: 95, fullMark: 100 },
      { name: '个人主义', score: 25, fullMark: 100 },
      { name: '男性度', score: 60, fullMark: 100 },
      { name: '规避不确定', score: 80, fullMark: 100 },
      { name: '长期导向', score: 36, fullMark: 100 },
      { name: '宽容度', score: 52, fullMark: 100 },
    ],
    density: 50,
    culturalStory: {
      title: '贝都因传统与数字时代的尊卑秩序',
      paragraphs: [
        '历史上商队穿越沙漠，长者与部落首领决定路线——等级与秩序保障生存。今日仍重视礼仪：称呼、座次、赠礼都有规矩。',
        '伊斯兰文化影响视觉：几何纹样、金深色、避免僭越宗教禁忌的图像。界面从右向左（RTL）不是选项，是尊重阅读习惯。',
      ],
      designLink: 'RTL 镜像、奢华但克制的配色、权威背书，是在数字空间延续「秩序与尊严」。',
    },
    videos: [
      { title: 'Material Design RTL 规范', url: 'https://m3.material.io/styles/bidi/overview', provider: 'Google', tag: '开发' },
      { title: '中东 UX 设计', url: 'https://www.youtube.com/watch?v=0_effGx1h5s', provider: 'YouTube', tag: 'UX' },
      { title: '霍夫斯泰德：沙特', url: 'https://www.hofstede-insights.com/country-comparison/saudi-arabia/', provider: 'Hofstede', tag: '数据' },
    ],
    designInsights: [
      { icon: '💡', title: '设计启示：镜像与合规', content: '完整 RTL 布局；宗教与文化敏感审查；暗金/深蓝传递尊贵。' },
    ],
  },
  {
    lat: 20.59, lng: 78.96, label: 'India', title: '印度',
    tagline: '一张屏上的十二种语言与「先比价」',
    overview: '多元、价格敏感、高密度：包容复杂才是本地化。',
    radarData: [
      { name: '权力距离', score: 77, fullMark: 100 },
      { name: '个人主义', score: 48, fullMark: 100 },
      { name: '男性度', score: 56, fullMark: 100 },
      { name: '规避不确定', score: 40, fullMark: 100 },
      { name: '长期导向', score: 51, fullMark: 100 },
      { name: '宽容度', score: 26, fullMark: 100 },
    ],
    density: 80,
    culturalStory: {
      title: '火车上的叫卖与 Flipkart 的折扣倒计时',
      paragraphs: [
        '印度铁路窗外小贩喊价，车厢里人人讨价还价——「值不值」比「贵不贵」更重要。线上 Flipkart、Meesho 大促倒计时、拼团、返现是同一逻辑。',
        '一部手机可能用印地语界面、英语通知、本地语客服；网络时快时慢。设计要轻、要快、要能切换语言。',
      ],
      designLink: '折扣可见、多语言一键切换、轻量页面，是在尊重「多元且务实」的市场。',
    },
    videos: [
      { title: '印度用户设计研究', url: 'https://www.smashingmagazine.com/2014/07/designing-for-the-indian-user/', provider: 'Smashing', tag: 'UX' },
      { title: '印度科技市场', url: 'https://www.youtube.com/watch?v=3Pq9blTtKfE', provider: 'YouTube', tag: '市场' },
      { title: '霍夫斯泰德：印度', url: 'https://www.hofstede-insights.com/country-comparison/india/', provider: 'Hofstede', tag: '数据' },
    ],
    designInsights: [
      { icon: '💡', title: '设计启示：包容复杂', content: '轻量资源、离线友好、语言切换；价格与优惠前置。' },
    ],
  },
];
