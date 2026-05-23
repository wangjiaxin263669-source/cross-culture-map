import { createRegion } from './_regionFactory.js';

const IN_REFS = [
  { title: 'India — Hofstede Country Comparison', source: 'Hofstede Insights', year: '2024', url: 'https://www.hofstede-insights.com/country-comparison/india/', tag: '国家基准', note: '印度全国维度参照' },
  { title: 'Designing for the Indian User', source: 'Smashing Magazine', year: '2014', url: 'https://www.smashingmagazine.com/2014/07/designing-for-the-indian-user/', tag: 'UX 研究', note: '印度用户行为' },
];

const r = (data) => createRegion('india', '印度', 'India', IN_REFS, data);

export const indiaStates = [
  r({
    id: 'in-mh', lat: 19.08, lng: 72.88, label: 'Maharashtra', title: '马哈拉施特拉邦',
    tagline: '孟买宝莱坞：梦想、堵车与分期付款',
    overview: '金融与娱乐中心：高密度、多语言、宝莱坞美学。',
    radarData: [
      { name: '权力距离', score: 80, fullMark: 100 }, { name: '个人主义', score: 50, fullMark: 100 },
      { name: '男性度', score: 58, fullMark: 100 }, { name: '规避不确定', score: 42, fullMark: 100 },
      { name: '长期导向', score: 55, fullMark: 100 }, { name: '宽容度', score: 28, fullMark: 100 },
    ],
    density: 85,
    methodology: {
      intro: '马哈拉施特拉邦依据：',
      steps: ['孟买金融科技与 UPI 支付普及', '宝莱坞明星代言转化', '马拉地语 + 印地语 + 英语多语'],
    },
    culturalStory: {
      title: '孟买本地火车与宝莱坞海报',
      paragraphs: [
        '孟买：印度梦与残酷现实并存——用户愿为「成功叙事」买单，也精打细算。',
        '宝莱坞色彩、歌舞、明星脸是视觉捷径，但需授权合规。',
        'UPI 二维码无处不在：支付流程必须极简，失败重试要友好。',
      ],
      designLink: '【因】娱乐文化 + 数字支付 →【果】UPI/钱包、明星联名、多语言、高密度促销但结构清晰。',
    },
    videos: [
      { title: '孟买与宝莱坞文化', url: 'https://www.youtube.com/watch?v=3Pq9blTtKfE', provider: 'YouTube', tag: '文化' },
      { title: '印度用户设计', url: 'https://www.smashingmagazine.com/2014/07/designing-for-the-indian-user/', provider: 'Smashing', tag: 'UX' },
    ],
    designInsights: [{ icon: '💡', title: '设计启示', content: 'UPI 支付；印地/马拉地语；明星营销合规。' }],
  }),
  r({
    id: 'in-dl', lat: 28.61, lng: 77.21, label: 'Delhi', title: '德里',
    tagline: '权力、历史与北方枢纽',
    overview: '首都圈：政治中心、印地语主导、历史遗迹旅游。',
    radarData: [
      { name: '权力距离', score: 85, fullMark: 100 }, { name: '个人主义', score: 45, fullMark: 100 },
      { name: '男性度', score: 60, fullMark: 100 }, { name: '规避不确定', score: 38, fullMark: 100 },
      { name: '长期导向', score: 58, fullMark: 100 }, { name: '宽容度', score: 25, fullMark: 100 },
    ],
    density: 82,
    methodology: {
      intro: '德里依据：',
      steps: ['政府数字化服务（DigiLocker 等）', '北印度节日营销日历', '空气污染等本地服务信息'],
    },
    culturalStory: {
      title: '红堡与地铁里的印地语推送',
      paragraphs: [
        '德里：莫卧儿遗迹与国会——权威、传统、等级仍在语言中体现（敬语）。',
        '排灯节、胡里节：全站主题皮肤可显著提升转化，但需文化准确。',
        '冬季空气污染：健康类 App 的 AQI 模块是刚需场景。',
      ],
      designLink: '【因】高权力距离 + 节日文化 →【果】敬语选项、节日运营、本地公共服务信息、政府背书样式。',
    },
    videos: [
      { title: '德里历史与文化', url: 'https://www.youtube.com/watch?v=3Pq9blTtKfE', provider: 'YouTube', tag: '文化' },
    ],
    designInsights: [{ icon: '💡', title: '设计启示', content: '印地语优先；节日模块；AQI/本地警报。' }],
  }),
  r({
    id: 'in-ka', lat: 12.97, lng: 77.59, label: 'Karnataka', title: '卡纳塔克邦',
    tagline: '班加罗尔：印度硅谷的咖啡与代码',
    overview: '科技中心：英语工作语言、初创文化、南印滤泡咖啡。',
    radarData: [
      { name: '权力距离', score: 72, fullMark: 100 }, { name: '个人主义', score: 52, fullMark: 100 },
      { name: '男性度', score: 54, fullMark: 100 }, { name: '规避不确定', score: 40, fullMark: 100 },
      { name: '长期导向', score: 62, fullMark: 100 }, { name: '宽容度', score: 32, fullMark: 100 },
    ],
    density: 78,
    methodology: {
      intro: '卡纳塔克邦依据：',
      steps: ['班加罗尔 IT 出口与 SaaS 用户', '卡纳达语本地化需求', '咖啡文化与年轻职场人群'],
    },
    culturalStory: {
      title: '班加罗尔科技园区的夜班',
      paragraphs: [
        '班加罗尔：Infosys、Wipro 与无数初创——英语产品可先行，卡纳达语本地化是加分。',
        '南印滤泡咖啡、周末徒步：生活方式品牌可强调平衡。',
        '交通拥堵：外卖、拼车状态实时更新是高频场景。',
      ],
      designLink: '【因】科技开放 + 南印文化 →【果】英语+卡纳达语、开发者友好文档、实时状态、年轻职场审美。',
    },
    videos: [
      { title: '班加罗尔科技文化', url: 'https://www.youtube.com/watch?v=3Pq9blTtKfE', provider: 'YouTube', tag: '科技' },
    ],
    designInsights: [{ icon: '💡', title: '设计启示', content: '卡纳达语切换；API 文档；实时物流。' }],
  }),
  r({
    id: 'in-tn', lat: 13.08, lng: 80.27, label: 'Tamil Nadu', title: '泰米尔纳德邦',
    tagline: '金奈：南印电影、庙塔与制造',
    overview: '泰米尔文化强势：本地语言优先、电影营销、汽车制造。',
    radarData: [
      { name: '权力距离', score: 78, fullMark: 100 }, { name: '个人主义', score: 48, fullMark: 100 },
      { name: '男性度', score: 52, fullMark: 100 }, { name: '规避不确定', score: 42, fullMark: 100 },
      { name: '长期导向', score: 60, fullMark: 100 }, { name: '宽容度', score: 30, fullMark: 100 },
    ],
    density: 80,
    methodology: {
      intro: '泰米尔纳德邦依据：',
      steps: ['泰米尔电影产业营销力', '金奈汽车制造出口', '庙塔建筑文化敏感'],
    },
    culturalStory: {
      title: '金奈 Marina 海滩与泰米尔电影海报',
      paragraphs: [
        '泰米尔语 pride 强：仅英语界面会被认为「不够尊重」，泰米尔语本地化优先。',
        '金奈电影明星政治影响力大：联名与肖像权需谨慎。',
        '素食、寺庙礼仪：食品类 App 需标注素食/非素食图标（绿点/棕点）。',
      ],
      designLink: '【因】语言认同 + 宗教饮食 →【果】泰米尔语优先、素食标识、电影营销合规、庙塔 imagery 尊重。',
    },
    videos: [
      { title: '泰米尔文化与电影', url: 'https://www.bilibili.com/video/BV1QK4y1r7SW/', provider: 'Bilibili', tag: '文化' },
    ],
    designInsights: [{ icon: '💡', title: '设计启示', content: '泰米尔语；素食标识；文化敏感。' }],
  }),
  r({
    id: 'in-wb', lat: 22.57, lng: 88.36, label: 'West Bengal', title: '西孟加拉邦',
    tagline: '加尔各答：诗歌、甜茶与知识精英',
    overview: '文化重镇：艺术、政治讨论、甜食与文学传统。',
    radarData: [
      { name: '权力距离', score: 76, fullMark: 100 }, { name: '个人主义', score: 46, fullMark: 100 },
      { name: '男性度', score: 50, fullMark: 100 }, { name: '规避不确定', score: 38, fullMark: 100 },
      { name: '长期导向', score: 52, fullMark: 100 }, { name: '宽容度', score: 35, fullMark: 100 },
    ],
    density: 76,
    methodology: {
      intro: '西孟加拉邦依据：',
      steps: ['孟加拉语内容与文学传统', '杜尔迦女神节营销', '加尔各答教育出版业'],
    },
    culturalStory: {
      title: '恒河岸边的杜尔迦节与罗宋果',
      paragraphs: [
        '加尔各答：泰戈尔故乡，爱辩论、爱文学——长文、社论式内容有受众。',
        '杜尔迦节：年度视觉盛宴，节日皮肤与礼盒极有效。',
        '甜茶（mishti）文化：食品类强调分享、礼盒、节日限定。',
      ],
      designLink: '【因】文化精英 + 节日叙事 →【果】孟加拉语、长文可读性、节日礼盒、文学气质排版。',
    },
    videos: [
      { title: '孟加拉文化与节日', url: 'https://www.youtube.com/watch?v=3Pq9blTtKfE', provider: 'YouTube', tag: '文化' },
    ],
    designInsights: [{ icon: '💡', title: '设计启示', content: '孟加拉语；节日礼盒；长文排版。' }],
  }),
  r({
    id: 'in-rj', lat: 26.91, lng: 75.79, label: 'Rajasthan', title: '拉贾斯坦邦',
    tagline: '沙漠宫殿、色彩与皇家叙事',
    overview: '旅游与手工艺：视觉华丽、传统等级、骆驼与宫殿意象。',
    radarData: [
      { name: '权力距离', score: 82, fullMark: 100 }, { name: '个人主义', score: 42, fullMark: 100 },
      { name: '男性度', score: 55, fullMark: 100 }, { name: '规避不确定', score: 45, fullMark: 100 },
      { name: '长期导向', score: 48, fullMark: 100 }, { name: '宽容度', score: 32, fullMark: 100 },
    ],
    density: 74,
    methodology: {
      intro: '拉贾斯坦依据：',
      steps: ['斋浦尔、乌代布尔旅游电商', '手工艺品（蓝陶、纺织品）故事营销', '婚礼产业奢华消费'],
    },
    culturalStory: {
      title: '斋浦尔粉红之城与沙漠星空',
      paragraphs: [
        '拉贾斯坦：宫殿、沙漠、骆驼——视觉可华丽，但避免对王室/种姓不当戏谑。',
        '婚礼季：珠宝、礼服、酒店预订是高频品类，分期与家族决策流程长。',
        '夏季极端高温：旅游 App 需季节警告与室内活动推荐。',
      ],
      designLink: '【因】旅游奢华 + 高权力距离 →【果】华丽但尊重的 imagery、婚礼套餐、多角色预订、季节提示。',
    },
    videos: [
      { title: '拉贾斯坦宫殿文化', url: 'https://www.youtube.com/watch?v=3Pq9blTtKfE', provider: 'YouTube', tag: '文化' },
    ],
    designInsights: [{ icon: '💡', title: '设计启示', content: '旅游预订；婚礼模块；文化尊重。' }],
  }),
];
