import { createRegion } from './_regionFactory.js';
import { getRegionBaseRefs } from '../countryCurated.js';

const DE_REFS = getRegionBaseRefs('germany');

const r = (data) => createRegion('germany', '德国', 'Germany', DE_REFS, data);

export const germanyStates = [
  r({
    id: 'de-by', lat: 48.14, lng: 11.58, label: 'Bavaria', title: '巴伐利亚州',
    tagline: '啤酒节、阿尔卑斯与「传统+精密」',
    overview: '南部保守务实：传统价值、汽车工业、旅游。',
    radarData: [
      { name: '权力距离', score: 38, fullMark: 100 }, { name: '个人主义', score: 68, fullMark: 100 },
      { name: '男性度', score: 62, fullMark: 100 }, { name: '规避不确定', score: 68, fullMark: 100 },
      { name: '长期导向', score: 85, fullMark: 100 }, { name: '宽容度', score: 42, fullMark: 100 },
    ],
    density: 68,
    methodology: {
      intro: '巴伐利亚依据：',
      steps: ['宝马/奥迪总部区域品牌期待', ' Oktoberfest 等事件营销', '天主教影响下的节日消费'],
    },
    culturalStory: {
      title: '慕尼黑啤酒帐篷里的信任',
      paragraphs: [
        '巴伐利亚自称「自由州」：传统服饰、教堂钟声、精密制造并存。',
        '汽车配置器、工业 4.0：用户要详细参数与能耗标签，德语文案必须准确。',
        '阿尔卑斯旅游：季节性户外装备、滑雪租赁流程要清晰。',
      ],
      designLink: '【因】传统 + 工程文化 →【果】德语本地化、规格详尽、季节旅游模块、稳重视觉。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '德语精准；汽车级参数展示；传统节庆运营。' }],
  }),
  r({
    id: 'de-be', lat: 52.52, lng: 13.41, label: 'Berlin', title: '柏林州',
    tagline: '墙已倒下，创意还在生长',
    overview: '首都创意：相对宽松、英语普及、初创与艺术文化。',
    radarData: [
      { name: '权力距离', score: 32, fullMark: 100 }, { name: '个人主义', score: 72, fullMark: 100 },
      { name: '男性度', score: 55, fullMark: 100 }, { name: '规避不确定', score: 58, fullMark: 100 },
      { name: '长期导向', score: 70, fullMark: 100 }, { name: '宽容度', score: 62, fullMark: 100 },
    ],
    density: 58,
    methodology: {
      intro: '柏林依据：',
      steps: ['初创生态与英语产品接受度', '东德遗产与价格敏感群体', '俱乐部文化与夜间经济'],
    },
    culturalStory: {
      title: '东边画廊的涂鸦与创业车库',
      paragraphs: [
        '柏林相对德国其他地区更开放：英语界面接受度高，实验性功能可在此试点。',
        '历史分层：东柏林用户对价格、隐私历史更敏感。',
        '艺术、科技、政治讨论活跃：品牌立场需真诚，漂绿会被抨击。',
      ],
      designLink: '【因】创意开放 + 历史敏感 →【果】英语可选、透明定价、真诚 CSR、实验性 UI 可试点。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '英德双语；透明定价；CSR 真诚。' }],
  }),
  r({
    id: 'de-nw', lat: 51.23, lng: 6.77, label: 'NRW', title: '北莱茵-威斯特法伦州',
    tagline: '鲁尔区工业与科隆狂欢节',
    overview: '人口第一大州：工业、贸易展会、狂欢节文化。',
    radarData: [
      { name: '权力距离', score: 34, fullMark: 100 }, { name: '个人主义', score: 65, fullMark: 100 },
      { name: '男性度', score: 64, fullMark: 100 }, { name: '规避不确定', score: 66, fullMark: 100 },
      { name: '长期导向', score: 80, fullMark: 100 }, { name: '宽容度', score: 48, fullMark: 100 },
    ],
    density: 72,
    methodology: {
      intro: '北威州依据：',
      steps: ['杜塞尔多夫展会与 B2B 流程', '鲁尔区工业遗产与转型叙事', '科隆狂欢节营销'],
    },
    culturalStory: {
      title: '鲁尔区烟囱与科隆大教堂',
      paragraphs: [
        '北威州：德国工业心脏，B2B 表单、报价单、合规文档是常态。',
        '科隆狂欢节：「Kölle Alaaf」——年度营销节点，色彩可大胆。',
        '靠近荷兰边境：跨境购物、物流、语言（低地德语）细微差异。',
      ],
      designLink: '【因】工业 B2B + 节庆 →【果】展会预约、文档下载、狂欢节主题、跨境物流说明。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: 'B2B 线索表单；展会模块；节庆皮肤。' }],
  }),
  r({
    id: 'de-hh', lat: 53.55, lng: 9.99, label: 'Hamburg', title: '汉堡州',
    tagline: '港口、媒体与北欧风',
    overview: '港口贸易：国际化、媒体业、相对开放。',
    radarData: [
      { name: '权力距离', score: 33, fullMark: 100 }, { name: '个人主义', score: 70, fullMark: 100 },
      { name: '男性度', score: 58, fullMark: 100 }, { name: '规避不确定', score: 62, fullMark: 100 },
      { name: '长期导向', score: 78, fullMark: 100 }, { name: '宽容度', score: 55, fullMark: 100 },
    ],
    density: 65,
    methodology: {
      intro: '汉堡依据：',
      steps: ['港口物流与跨境贸易 UI', '媒体集团（Spiegel）数字习惯', '北欧影响的设计极简'],
    },
    culturalStory: {
      title: '易北河上的仓库城',
      paragraphs: [
        '汉堡媒体港、仓库城：贸易与新闻嗅觉敏锐，订阅制、付费墙设计成熟。',
        '港口物流：实时追踪、海关信息对 B2B 至关重要。',
        '气候多雨：室内场景多，阅读型内容表现好。',
      ],
      designLink: '【因】港口贸易 + 媒体素养 →【果】物流追踪、订阅透明、国际运输条款、清晰排版。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '物流与海关信息；订阅模式清晰。' }],
  }),
  r({
    id: 'de-bw', lat: 48.66, lng: 9.35, label: 'Baden-Württemberg', title: '巴登-符腾堡州',
    tagline: '奔驰故乡与黑森林蛋糕：精密与乡土',
    overview: '西南部创新：汽车、机械、中小企业「隐形冠军」。',
    radarData: [
      { name: '权力距离', score: 36, fullMark: 100 }, { name: '个人主义', score: 66, fullMark: 100 },
      { name: '男性度', score: 60, fullMark: 100 }, { name: '规避不确定', score: 70, fullMark: 100 },
      { name: '长期导向', score: 88, fullMark: 100 }, { name: '宽容度', score: 45, fullMark: 100 },
    ],
    density: 70,
    methodology: {
      intro: '巴符州依据：',
      steps: ['斯图加特汽车产业集群', '中小企业数字化（Mittelstand）', '黑森林旅游与精工叙事'],
    },
    culturalStory: {
      title: '斯图加特奔驰博物馆的时间轴',
      paragraphs: [
        '巴符州汇集德国大量「隐形冠军」：工业配件、软件、精密仪器——B2B 要专业。',
        '奔驰、保时捷：性能参数、安全评级、配置对比是用户熟悉交互。',
        '黑森林、温泉小镇：旅游子品牌可用乡土叙事，与工业主品牌区分。',
      ],
      designLink: '【因】精密制造文化 →【果】专业 B2B、配置器、长期保修信息、德英技术双语。',
    },
    designInsights: [{ icon: '💡', title: '设计启示', content: '配置对比；技术白皮书；B2B 专业语气。' }],
  }),
];
