/**
 * 跨文化产品设计 · 设计师必读经典库
 * 筛选标准：能直接改变「文化维度 → 界面决策」的思维，而非泛泛文化科普或厂商广告
 */
import { bilibili, woshipm, zcool, article } from './linkPlatforms.js';

/** 设计师必读理由（显示在文献 note 末尾） */
export const WHY = {
  hofstede:
    '【设计师必读】霍夫斯泰德是跨文化产品最常用的分析框架；文内用 B 站 vs YouTube 讲清集体主义/个人主义如何落到首页信息架构。',
  crossDesign:
    '【设计师必读】从文化差异提取设计策略，适合立项时做「单一文化 / 多元文化」路线判断。',
  globalUi:
    '【设计师必读】出海 UI 实操清单：RTL 镜像、禁忌图案、超长文案、色彩禁忌——沙特/中东/巴西项目必查。',
  cnUsApp:
    '【设计师必读】微信 PM Dan Grover 经典：红点、超级 App、支付三列 vs 美国「少即是多」——理解中国高密度界面。',
  japanMarket:
    '【设计师必读】日本 SaaS/消费品牌如何平衡「日式美学」与「信任感」，对应高不确定性规避下的界面预期。',
  posterCase:
    '【设计师必读】同一部电影的中日海报对照，是「信息密度 = 文化安全感」最直观的视觉教案。',
  gdpr:
    '【设计师必读】德国/欧盟用户为何需要「可读、可拒绝、可分层」的隐私 UI；合规即体验。',
  googleNbU:
    '【设计师必读】Google「下一十亿用户」原则：低带宽、多语言、折扣驱动——印度/新兴市场的设计基准文献。',
  smokey:
    '【设计师必读】美国个人主义叙事的国民级案例，与「只有你」类 CTA、极简首页同源。',
};

export const CANON = {
  hofstede: woshipm(
    'https://www.woshipm.com/pd/4448329.html',
    '国际化产品设计：Hofstede的文化维度',
    '框架',
    WHY.hofstede,
  ),
  crossDesign: woshipm(
    'https://www.woshipm.com/pd/2875181.html',
    '跨文化设计：面向不同文化背景的产品设计',
    '方法论',
    WHY.crossDesign,
  ),
  globalUi: woshipm(
    'https://www.woshipm.com/ucd/6200498.html',
    '全球化UI设计：小语种出海产品设计干货',
    '出海 UX',
    WHY.globalUi,
  ),
  zcoolCross: zcool(
    'https://m.zcool.com.cn/article/ZMTQwNTM3Ng==.html',
    '跨文化产品的设计思路',
    '设计方法',
    '【设计师必读】文化差异提取、禁忌规避、设计策略选择。',
  ),
  zcoolFont: zcool(
    'https://m.zcool.com.cn/article/ZMTY2MDY2NA==.html',
    '跨文化设计实践：多语言字体的文化适配',
    'UX',
    '【设计师必读】多语言字体与排版禁忌，德国/印度/中东多语项目适用。',
  ),
  cnUsApp: woshipm(
    'https://www.woshipm.com/ucd/124750.html',
    '在一个老外微信PM的眼中，中国App UI那些事',
    'UX 经典',
    WHY.cnUsApp,
  ),
  japanMarket: woshipm(
    'https://www.woshipm.com/share/6281743.html',
    '为日本市场打造多场景设计语言',
    '本地化',
    WHY.japanMarket,
  ),
  posterCase: article(
    'https://www.roomie.tw/posts/71704',
    '電影海報演進史：好萊塢電影來到日本後為何字特別多',
    'Roomie',
    '视觉案例',
    WHY.posterCase,
  ),
  gdpr: article(
    'https://gdpr.eu/cookies/',
    'Cookies, the GDPR, and the ePrivacy Directive',
    'GDPR.eu',
    '合规 UX',
    WHY.gdpr,
  ),
  googleNbU: article(
    'https://design.google/library/building-for-everyone/',
    'Design Inclusive Products — Reach a Wider Audience',
    'Google Design',
    '新兴市場',
    WHY.googleNbU,
  ),
  smokey: article(
    'https://smokeybear.com/en',
    'Smokey Bear — Only YOU Can Prevent Wildfires',
    'U.S. Forest Service',
    '文化案例',
    WHY.smokey,
  ),
};

/** 唯一推荐的「文化定义」入门视频（其余国家不再堆叠重复学术片） */
export const FOUNDATION_VIDEO = bilibili(
  'BV1td4y1P7Us',
  '【文化的定义】什么是文化？文化是什么？',
  '框架',
);
