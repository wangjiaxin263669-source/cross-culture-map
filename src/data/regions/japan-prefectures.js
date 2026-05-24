import { createRegion } from './_regionFactory.js';

const JP_REFS = [
  { title: 'Japan — Hofstede Country Comparison', source: 'Hofstede Insights', year: '2024', url: 'https://www.hofstede-insights.com/country-comparison/japan/', tag: '国家基准', note: '日本全国维度参照' },
  { title: 'Japanese UX Design Patterns', source: 'Baymard Institute', year: '—', url: 'https://baymard.com/blog/japanese-ecommerce-ux', tag: 'UX 研究', note: '电商信息密度' },
];

const r = (data) => createRegion('japan', '日本', 'Japan', JP_REFS, data);

export const japanPrefectures = [
  r({
    id: 'jp-13', lat: 35.68, lng: 139.76, label: 'Tokyo', title: '东京都',
    tagline: '电车与便利店：极致效率里的礼貌',
    overview: '首都圈：超高信息密度、礼仪用语、移动支付普及。',
    radarData: [
      { name: '权力距离', score: 58, fullMark: 100 }, { name: '个人主义', score: 48, fullMark: 100 },
      { name: '男性度', score: 92, fullMark: 100 }, { name: '规避不确定', score: 94, fullMark: 100 },
      { name: '长期导向', score: 90, fullMark: 100 }, { name: '宽容度', score: 40, fullMark: 100 },
    ],
    density: 98,
    methodology: {
      intro: '东京都在日本高不确定性规避基准上：',
      steps: ['山手线通勤 App 使用场景研究', '便利店密度与即时配送文化', '敬语体系对客服文案的影响'],
    },
    culturalStory: {
      title: '山手线「满员电车」里的像素',
      paragraphs: [
        '早晚高峰的电车：人们默契折叠手机、避免外放——界面音效默认静音是常识。',
        '涩谷、秋叶原、银座：同一都市不同亚文化，但共同点是「细节不能错」：价格税込表示、配送时段精确到小时。',
        '原宿卡哇伊与商务丸之内并存：子品牌可用不同视觉，但品质感不能掉线。',
      ],
      designLink: '【因】极高不确定性规避 + 长期导向 →【果】税込价格、详尽 FAQ、道歉式错误文案、预约制流程。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '税込标价；静音默认；敬语客服；配送时段精细。' }],
  }),
  r({
    id: 'jp-27', lat: 34.69, lng: 135.5, label: 'Osaka', title: '大阪府',
    tagline: '「食倒れ」精神：幽默、实惠、敢比较',
    overview: '关西中心：比东京更外向幽默，重性价比与口碑。',
    radarData: [
      { name: '权力距离', score: 52, fullMark: 100 }, { name: '个人主义', score: 52, fullMark: 100 },
      { name: '男性度', score: 88, fullMark: 100 }, { name: '规避不确定', score: 88, fullMark: 100 },
      { name: '长期导向', score: 82, fullMark: 100 }, { name: '宽容度', score: 48, fullMark: 100 },
    ],
    density: 92,
    methodology: {
      intro: '大阪府依据：',
      steps: ['关西方言内容传播与幽默营销接受度', '道顿堀餐饮比价文化', '世博会遗产与城市品牌'],
    },
    culturalStory: {
      title: '道顿堀的霓虹与章鱼烧队列',
      paragraphs: [
        '大阪人爱说「きつい」（小气）是玩笑——实则对价格敏感，比价、优惠券、排队攻略是社交话题。',
        '吉本喜剧、漫才文化：营销可更活泼，但仍有底线，不可侮辱竞争对手。',
        '环球影城、大阪城：旅游与本地生活内容需分层，避免只服务游客。',
      ],
      designLink: '【因】关西外向 + 实惠文化 →【果】比价表、幽默但得体的文案、口碑/评分突出、排队信息透明。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '突出评分与优惠；语气可更轻松；比价功能。' }],
  }),
  r({
    id: 'jp-26', lat: 35.01, lng: 135.77, label: 'Kyoto', title: '京都府',
    tagline: '千年古都的「间」与克制美学',
    overview: '传统文化核心区：留白、季节感、礼仪、游客与本地人分层。',
    radarData: [
      { name: '权力距离', score: 56, fullMark: 100 }, { name: '个人主义', score: 42, fullMark: 100 },
      { name: '男性度', score: 85, fullMark: 100 }, { name: '规避不确定', score: 90, fullMark: 100 },
      { name: '长期导向', score: 92, fullMark: 100 }, { name: '宽容度', score: 38, fullMark: 100 },
    ],
    density: 88,
    methodology: {
      intro: '京都府依据：',
      steps: ['町屋文化与季节祭典营销', '访日游客预约制（ overtourism ）体验', '和色与留白在传统品牌中的应用'],
    },
    culturalStory: {
      title: '祇园祭与茶室的「间」',
      paragraphs: [
        '京都茶室「间」（ま）——留白不是空，是呼吸。网页留白过多在东京可能显得冷清，在京都显得有品位。',
        '艺伎、枯山水、和服体验： imagery 需庄重，避免戏谑传统文化。',
        '樱花与红叶季：季节性皮肤与限时内容极有效，但需预约制避免拥挤。',
      ],
      designLink: '【因】传统文化 + 高长期导向 →【果】季节视觉、预约流程、克制动画、文化合规。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '季节主题；预约制；和色与留白；尊重传统符号。' }],
  }),
  r({
    id: 'jp-01', lat: 43.06, lng: 141.35, label: 'Hokkaido', title: '北海道',
    tagline: '雪国、温泉与农产：慢一点的日本',
    overview: '北方开阔：旅游季节性强、食材叙事、低密度界面也可接受。',
    radarData: [
      { name: '权力距离', score: 50, fullMark: 100 }, { name: '个人主义', score: 50, fullMark: 100 },
      { name: '男性度', score: 80, fullMark: 100 }, { name: '规避不确定', score: 85, fullMark: 100 },
      { name: '长期导向', score: 78, fullMark: 100 }, { name: '宽容度', score: 50, fullMark: 100 },
    ],
    density: 75,
    methodology: {
      intro: '北海道依据：',
      steps: ['滑雪/温泉旅游预订 UX', '札幌雪祭等事件营销', '农产（牛奶、海鲜）品牌故事'],
    },
    culturalStory: {
      title: '札幌雪祭与白色恋人',
      paragraphs: [
        '北海道地图像一片叶子——空间开阔，人心态略松弛。冬季雪祭、夏季花田，旅游日历驱动明显。',
        '「白色恋人」等特产：礼物文化（お土産）强，电商需突出礼盒、保质期、配送冷链。',
        '冬季道路封闭信息：旅行类 App 的实时预警是刚需，不是锦上添花。',
      ],
      designLink: '【因】旅游季节 + 土产文化 →【果】礼盒装选项、冷链说明、天气/路况模块、稍低密度也可。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '季节运营；礼盒与冷链；路况/天气信息。' }],
  }),
  r({
    id: 'jp-47', lat: 26.21, lng: 127.68, label: 'Okinawa', title: '冲绳县',
    tagline: '琉球海风：慢节奏与美式影响的混搭',
    overview: '群岛文化：休闲、美基地影响、长寿与旅游。',
    radarData: [
      { name: '权力距离', score: 48, fullMark: 100 }, { name: '个人主义', score: 50, fullMark: 100 },
      { name: '男性度', score: 70, fullMark: 100 }, { name: '规避不确定', score: 75, fullMark: 100 },
      { name: '长期导向', score: 65, fullMark: 100 }, { name: '宽容度', score: 62, fullMark: 100 },
    ],
    density: 68,
    methodology: {
      intro: '冲绳县依据：',
      steps: ['琉球文化敏感与美军基地并存语境', '长寿饮食与康养旅游', '台风季预订取消政策'],
    },
    culturalStory: {
      title: '三味线与珊瑚海',
      paragraphs: [
        '琉球王国历史独立于本州：色彩更鲜艳、节奏更慢，不宜套用「典型日式极简」一刀切。',
        '美军基地带来英语与美式消费场景：部分商圈双语需求高于东京以外地区。',
        '潜水、婚礼、康养：视觉可明亮海洋风，但尊重琉球传统图案版权。',
      ],
      designLink: '【因】群岛休闲 + 文化独特 →【果】明亮海洋视觉、双语、灵活退改、琉球文化合规。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '海洋明亮风；双语；台风退改政策清晰。' }],
  }),
  r({
    id: 'jp-23', lat: 35.18, lng: 136.91, label: 'Aichi', title: '爱知县',
    tagline: '丰田与制造业：可靠比花哨更重要',
    overview: '中部工业核心：务实、品质、B2B 与汽车文化。',
    radarData: [
      { name: '权力距离', score: 54, fullMark: 100 }, { name: '个人主义', score: 44, fullMark: 100 },
      { name: '男性度', score: 90, fullMark: 100 }, { name: '规避不确定', score: 92, fullMark: 100 },
      { name: '长期导向', score: 88, fullMark: 100 }, { name: '宽容度', score: 42, fullMark: 100 },
    ],
    density: 90,
    methodology: {
      intro: '爱知县依据：',
      steps: ['丰田生产方式对「可靠」品牌期待', '名古屋都市圈中等密度 UI', '工业旅游与博物馆叙事'],
    },
    culturalStory: {
      title: '丰田城的「改善」哲学',
      paragraphs: [
        '精益生产（改善）刻在地方性格里：产品若频繁出 bug，比营销华丽更严重。',
        '名古屋味噌猪排、世界博览会遗产——本地自豪但不如大阪外放。',
        '汽车配置器类交互：参数对比、安全评级、油耗数据要权威来源。',
      ],
      designLink: '【因】制造业文化 + 高不确定性规避 →【果】可靠优先、详细规格、售后可见、克制营销。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '质量与保修信息前置；参数对比表；少浮夸动画。' }],
  }),
  r({
    id: 'jp-40', lat: 33.59, lng: 130.4, label: 'Fukuoka', title: '福冈县',
    tagline: '博多拉面与离亚洲最近的大门',
    overview: '九州门户：美食、创业、与韩国/中国联系紧密。',
    radarData: [
      { name: '权力距离', score: 50, fullMark: 100 }, { name: '个人主义', score: 50, fullMark: 100 },
      { name: '男性度', score: 82, fullMark: 100 }, { name: '规避不确定', score: 86, fullMark: 100 },
      { name: '长期导向', score: 80, fullMark: 100 }, { name: '宽容度', score: 52, fullMark: 100 },
    ],
    density: 82,
    methodology: {
      intro: '福冈县依据：',
      steps: ['博多创业城市（Startup City Fukuoka）', '离岛与亚洲航线旅游', '拉面/屋台美食文化营销'],
    },
    culturalStory: {
      title: '屋台摊位的烟火气',
      paragraphs: [
        '福冈屋台（路边摊）：社交、美食、快速周转——外卖与预约到店结合的模式很贴切。',
        '地理上离首尔、上海近：跨境支付、多语言、旅行套餐常见。',
        '拉面锦标赛、棒球文化：本地事件营销转化率高。',
      ],
      designLink: '【因】美食社交 + 门户区位 →【果】预约排队、多语言、跨境支付、事件运营模块。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '餐饮预约；亚洲语言；跨境旅行套餐。' }],
  }),
  r({
    id: 'jp-14', lat: 35.45, lng: 139.64, label: 'Kanagawa', title: '神奈川县',
    tagline: '横滨港与湘南海岸：国际与通勤',
    overview: '东京卫星圈：港口国际感、冲浪文化、通勤族。',
    radarData: [
      { name: '权力距离', score: 56, fullMark: 100 }, { name: '个人主义', score: 50, fullMark: 100 },
      { name: '男性度', score: 88, fullMark: 100 }, { name: '规避不确定', score: 90, fullMark: 100 },
      { name: '长期导向', score: 85, fullMark: 100 }, { name: '宽容度', score: 45, fullMark: 100 },
    ],
    density: 90,
    methodology: {
      intro: '神奈川县依据：',
      steps: ['横滨中华街与国际化社区', '镰仓/湘南旅游与通勤双场景', '港未来金融科技区'],
    },
    culturalStory: {
      title: '横滨港的万国桥',
      paragraphs: [
        '横滨开港历史造就相对开放的都市性格：外国居民多，英文标识接受度高于平均。',
        '镰仓大佛、江之岛冲浪：周末旅游 + 平日通勤，同一用户群两种模式。',
        '中华街、拉面博物馆：美食主题营销特别有效。',
      ],
      designLink: '【因】国际港口 + 双场景用户 →【果】多语言、周末旅游模块、通勤时刻表整合。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '英中日多语；旅游/通勤模式切换。' }],
  }),
];
