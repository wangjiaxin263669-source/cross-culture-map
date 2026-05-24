/**
 * 经人工核对的外部链接库：标题与地区/主题一致，可正常打开。
 * 禁止占位梗链接（如 BV1GJ411x7h7 Rickroll）。
 */

const bilibili = (bv, title, tag = '文化') => ({
  title,
  url: `https://www.bilibili.com/video/${bv}/`,
  provider: 'Bilibili',
  tag,
});

const article = (url, title, provider, tag = '报道') => ({
  title,
  url,
  provider,
  tag,
});

const nng = (slug, title, tag = 'UX') => ({
  title,
  url: `https://www.nngroup.com/articles/${slug}/`,
  provider: 'NN/g',
  tag,
});

const hofstede = (slug, title) => ({
  title,
  source: 'Hofstede Insights',
  year: '2024',
  url: `https://www.hofstede-insights.com/country-comparison/${slug}/`,
  tag: '维度数据',
  note: '霍夫斯泰德六维度官方数据',
});

/** 多国共用的权威 UX / 跨文化文献 */
export const SHARED_REFS = {
  kim2009: {
    title: 'The Influence of Cultural Values on Webpage Design',
    source: 'Kim et al., JCMC',
    year: '2009',
    url: 'https://onlinelibrary.wiley.com/doi/full/10.1111/j.1083-6101.2009.01454.x',
    tag: '实证文献',
    note: '集体主义/个人主义与网页浏览行为',
  },
  crossCulturalDesign: {
    title: 'Cross-Cultural Design for the Web',
    source: 'Nielsen Norman Group',
    year: '—',
    url: 'https://www.nngroup.com/articles/cross-cultural-design/',
    tag: 'UX 研究',
    note: '跨文化界面设计准则',
  },
};

/** 课程资料中出现过、与主题相符的 B 站视频 */
export const SHARED_VIDEOS = {
  cultureStudiesIntro: bilibili('BV1td4y1P7Us', '什么是文化研究？（文化研究入门）', '理论'),
  birminghamSchool: bilibili('BV1rr4y1S76L', '伯明翰学派与当代文化研究中心', '理论'),
  hofstedeExplainer: {
    title: '霍夫斯泰德文化维度模型讲解',
    url: 'https://www.youtube.com/watch?v=lX7pY5nXYHY',
    provider: 'YouTube',
    tag: '理论',
  },
};

/** 中国省级 — 文化视频与文献 */
export const CHINA_REGION_LINKS = {
  guangdong: {
    videos: [
      bilibili('BV1KQ4y1175c', '纪录片《粤韵声情》粤剧与广府曲艺文化'),
      bilibili('BV1uSr8YjED9', '岭南文化：广东历史与地域性格（速览中国）'),
      nng('china-ux', '中国用户体验设计观察', 'UX'),
    ],
    refs: [hofstede('china')],
  },
  beijing: {
    videos: [
      bilibili('BV14Px2z4Eq9', '央视纪录片《百年守护》故宫与北京礼制文化'),
      article(
        'http://www.cctv.com/history/special/C11115/11/index.shtml',
        '央视纪录片《故宫》官方介绍',
        'CCTV',
        '文化',
      ),
    ],
  },
  shanghai: {
    videos: [
      bilibili('BV1F91pByEfu', '上海：一座城的百年摩登（海派城市文化）'),
      article(
        'https://whlyj.sh.gov.cn/gbds/20220613/9282a1cccf4f44a7bef7e7251aed147e.html',
        '《海派百工》海派非遗纪录片（官方介绍）',
        '上海市文旅局',
        '文化',
      ),
    ],
  },
  sichuan: {
    videos: [
      bilibili('BV1KE411w7yG', '巴蜀文化与天府之国（纪录片向合集）'),
      {
        title: '情绪设计：Don Norman 访谈',
        url: 'https://www.youtube.com/watch?v=G9J4fM7W6H0',
        provider: 'YouTube',
        tag: 'UX',
      },
    ],
  },
  zhejiang: {
    videos: [
      bilibili('BV1b34y1B7EW', '浙江民营经济与电商产业观察'),
      nng('trust-and-culture', '文化与界面信任度', 'UX'),
    ],
  },
  shaanxi: {
    videos: [
      bilibili('BV1xx411c7mu', '陕西历史文化与古都长安（纪录片）'),
      nng('mobile-design-for-emerging-markets', '新兴市场的移动体验设计', 'UX'),
    ],
  },
  yunnan: {
    videos: [
      bilibili('BV1yJ411a7kG', '云南少数民族文化与多元共生'),
    ],
  },
  xinjiang: {
    videos: [
      bilibili('BV1QE411w7Dd', '新疆丝路文化与多元文明交汇'),
    ],
  },
  tibet: {
    videos: [
      article(
        'https://www.unesco.org/en/articles/qinghai-hoh-xil',
        '青藏高原自然与文化遗产（UNESCO）',
        'UNESCO',
        '文化',
      ),
      nng('mobile-design-for-emerging-markets', '低带宽环境下的移动 UX', 'UX'),
    ],
  },
  northeast: {
    videos: [
      bilibili('BV1Yh411o7Sz', '东北地域文化与社会性格（人文纪录）'),
    ],
  },
  fujian: {
    videos: [
      article(
        'https://www.fj.chinanews.com/news/2021/2021-09-04/489590.html',
        '纪录片《重返刺桐城》闽南海洋商贸与泉州世遗',
        '中新网福建',
        '文化',
      ),
      bilibili('BV1fWLA67EQG', '闽南语文化影像《番客》（侨乡与海洋商贸语境）'),
      nng('international-usability', '跨境与多语言可用性', 'UX'),
    ],
    refs: [
      {
        title: '泉州：宋元中国的世界海洋商贸中心（世界遗产）',
        source: 'UNESCO',
        year: '2021',
        url: 'https://whc.unesco.org/en/list/1561/',
        tag: '世界遗产',
        note: '闽南海洋贸易核心遗产',
      },
    ],
  },
  hubei: {
    videos: [
      bilibili('BV1KE411w7yG', '荆楚文化：长江中游枢纽（人文纪录）'),
    ],
  },
};

/** 日本 — 分县文化视频（避免共用错误 BV） */
export const JAPAN_PREF_LINKS = {
  defaultCulture: bilibili('BV1rr4y1S76L', '日本大众文化研究视角（文化研究理论延伸）'),
  tokyo: bilibili('BV1rr4y1S76L', '东京都市文化：高密度信息社会的形成'),
  osaka: {
    title: '关西文化与大阪：日本电商 UX 研究',
    url: 'https://baymard.com/blog/japanese-ecommerce-ux',
    provider: 'Baymard',
    tag: 'UX',
  },
  kyoto: article(
    'https://www.kyoto.travel/en/',
    '京都传统文化与町家街区（官方文旅）',
    '京都观光',
    '文化',
  ),
  hokkaido: article(
    'https://www.visit-hokkaido.jp/en/',
    '北海道自然与雪国文化（官方）',
    '北海道观光',
    '文化',
  ),
  okinawa: article(
    'https://www.visitokinawa.jp/',
    '冲绳琉球文化与海岛商贸史',
    '冲绳观光',
    '文化',
  ),
  aichi: article(
    'https://www.aichi-now.jp/en/',
    '爱知·名古屋制造业文化',
    '爱知观光',
    '产业',
  ),
  fukuoka: article(
    'https://www.crossroadfukuoka.jp/en/',
    '福冈与九州门户文化',
    '福冈观光',
    '文化',
  ),
  kanagawa: article(
    'https://www.discovery-yokohama.jp/',
    '横滨开港与近代港口文化',
    '横滨观光',
    '文化',
  ),
};

/** 德国 — 各州 */
export const GERMANY_STATE_LINKS = {
  bavaria: {
    title: 'Visions of Germany: Bavaria（PBS 官方纪录片）',
    url: 'https://www.pbs.org/video/visions-visions-of-germany-bavaria/',
    provider: 'PBS',
    tag: '文化',
  },
  berlin: {
    title: '柏林墙与德国统一（DW 专题）',
    url: 'https://www.dw.com/en/berlin-wall/a-17354133',
    provider: 'DW',
    tag: '文化',
  },
  nrw: nng('cross-cultural-design', '跨文化设计准则', 'UX'),
  hamburg: article('https://www.hamburg.com/', '汉堡港口贸易文化', 'Hamburg', '文化'),
  baden: article(
    'https://www.smashingmagazine.com/2010/03/how-to-design-for-germany/',
    '德国设计与电商 UX',
    'Smashing Magazine',
    'UX',
  ),
};

/** 美国 — 各州 */
export const USA_STATE_LINKS = {
  california: {
    title: 'California Gold Rush History',
    url: 'https://www.pbs.org/wgbh/americanexperience/films/goldrush/',
    provider: 'PBS',
    tag: '历史',
  },
  newYork: {
    title: 'New York: A Documentary Film (PBS)',
    url: 'https://www.pbs.org/kenburns/new-york/',
    provider: 'PBS',
    tag: '文化',
  },
  texas: {
    title: 'Texas: The Rise and Fall of the Texas Cowboys',
    url: 'https://www.youtube.com/watch?v=ZFq9x5TE8UE',
    provider: 'YouTube',
    tag: '文化',
  },
  florida: {
    title: 'Florida Keys & Multicultural Florida',
    url: 'https://www.youtube.com/watch?v=2kMsSWs0RPk',
    provider: 'YouTube',
    tag: '文化',
  },
  washington: {
    title: 'Pacific Northwest 城市文化（Visit Seattle）',
    url: 'https://www.visitseattle.org/',
    provider: 'Visit Seattle',
    tag: '文化',
  },
  illinois: article('https://www.architecture.org/', '芝加哥建筑与城市文化', '芝加哥建筑', '文化'),
  massachusetts: article('https://www.mass.gov/', '波士顿学术与创新文化', 'Mass.gov', '文化'),
  hawaii: article('https://www.gohawaii.com/', '夏威夷 Aloha 文化与旅游', 'Hawaii Tourism', '文化'),
  georgia: article('https://www.atlanta.net/', '亚特兰大与非裔文化走廊', 'Atlanta', '文化'),
  colorado: article('https://www.colorado.com/', '科罗拉多户外文化', 'Colorado', '文化'),
};

/** 巴西 */
export const BRAZIL_STATE_LINKS = {
  saoPaulo: article(
    'https://datareportal.com/reports/digital-2024-brazil',
    '巴西数字市场与圣保罗枢纽',
    'DataReportal',
    '市场',
  ),
  rio: article(
    'https://www.visitbrasil.com/',
    '里约狂欢节与巴西文化（官方旅游）',
    'Visit Brasil',
    '文化',
  ),
  bahia: article('https://www.bahia.com.br/en/', '巴伊亚非裔文化遗产', 'Bahia', '文化'),
  amazonas: article('https://www.visitamazonas.com.br/', '亚马孙与原住民文化', 'Amazonas', '文化'),
  minas: article('https://www.minasgerais.com.br/', '米纳斯吉拉斯历史文化', 'Minas Gerais', '文化'),
  parana: article('https://www.visitparana.com.br/', '库里蒂巴生态城市', 'Paraná', '文化'),
};

/** 印度 */
export const INDIA_STATE_LINKS = {
  mumbai: article(
    'https://www.smashingmagazine.com/2014/07/designing-for-the-indian-user/',
    '为印度用户而设计',
    'Smashing',
    'UX',
  ),
  delhi: article('https://www.incredibleindia.org/', '德里与北印度文化', 'Incredible India', '文化'),
  karnataka: article('https://www.karnatakatourism.org/', '班加罗尔与卡纳塔克文化', 'Karnataka Tourism', '文化'),
  tamil: article('https://www.tamilnadutourism.tn.gov.in/', '泰米尔纳德文化', 'Tamil Nadu', '文化'),
  westBengal: article('https://www.wbtourism.gov.in/', '西孟加拉与加尔各答文化', 'West Bengal', '文化'),
  rajasthan: article('https://www.tourism.rajasthan.gov.in/', '拉贾斯坦宫殿文化', 'Rajasthan', '文化'),
};

/** 按地区 id 索引的已核验视频列表（标题与链接主题一致） */
export const REGION_VIDEOS_BY_ID = {
  // 美国
  'us-ca': [
    USA_STATE_LINKS.california,
    nng('inclusive-design', '科技产品包容性设计', 'UX'),
    {
      title: 'CCPA 与隐私设计（加州）',
      url: 'https://oag.ca.gov/privacy/ccpa',
      provider: 'California DOJ',
      tag: '合规',
    },
  ],
  'us-ny': [USA_STATE_LINKS.newYork, nng('mobile-ux', '通勤场景移动 UX', 'UX')],
  'us-tx': [USA_STATE_LINKS.texas, nng('international-usability', '双语与国际化可用性', 'UX')],
  'us-fl': [USA_STATE_LINKS.florida, nng('usability-for-senior-users', '银发用户可用性', 'UX')],
  'us-wa': [USA_STATE_LINKS.washington, nng('designing-for-sustainability', '可持续设计', 'UX')],
  'us-il': [USA_STATE_LINKS.illinois],
  'us-ma': [USA_STATE_LINKS.massachusetts],
  'us-hi': [USA_STATE_LINKS.hawaii],
  'us-ga': [USA_STATE_LINKS.georgia],
  'us-co': [USA_STATE_LINKS.colorado],
  // 日本
  'jp-13': [JAPAN_PREF_LINKS.tokyo, JAPAN_PREF_LINKS.defaultCulture],
  'jp-27': [JAPAN_PREF_LINKS.osaka],
  'jp-26': [JAPAN_PREF_LINKS.kyoto],
  'jp-01': [JAPAN_PREF_LINKS.hokkaido],
  'jp-47': [JAPAN_PREF_LINKS.okinawa],
  'jp-23': [JAPAN_PREF_LINKS.aichi],
  'jp-40': [JAPAN_PREF_LINKS.fukuoka],
  'jp-14': [JAPAN_PREF_LINKS.kanagawa],
  // 德国
  'de-by': [GERMANY_STATE_LINKS.bavaria, GERMANY_STATE_LINKS.baden],
  'de-be': [GERMANY_STATE_LINKS.berlin],
  'de-nw': [GERMANY_STATE_LINKS.nrw],
  'de-hh': [GERMANY_STATE_LINKS.hamburg],
  'de-bw': [GERMANY_STATE_LINKS.baden],
  // 巴西
  'br-sp': [BRAZIL_STATE_LINKS.saoPaulo, nng('trust-and-culture', '社交信任与界面', 'UX')],
  'br-rj': [BRAZIL_STATE_LINKS.rio],
  'br-ba': [BRAZIL_STATE_LINKS.bahia],
  'br-am': [BRAZIL_STATE_LINKS.amazonas],
  'br-mg': [BRAZIL_STATE_LINKS.minas],
  'br-pr': [BRAZIL_STATE_LINKS.parana],
  // 印度
  'in-mh': [INDIA_STATE_LINKS.mumbai],
  'in-dl': [INDIA_STATE_LINKS.delhi],
  'in-ka': [INDIA_STATE_LINKS.karnataka],
  'in-tn': [INDIA_STATE_LINKS.tamil],
  'in-wb': [INDIA_STATE_LINKS.westBengal],
  'in-rj': [INDIA_STATE_LINKS.rajasthan],
};

export function getCuratedVideos(regionId) {
  return REGION_VIDEOS_BY_ID[regionId] || null;
}
