import React, { useState, useCallback, useEffect, useRef } from 'react';
import BrandLogo from './BrandLogo.jsx';
import AuthBackground from './AuthBackground.jsx';
import LandingHeroMark from './LandingHeroMark.jsx';
import { useLandingMotion } from '../hooks/useLandingMotion.js';

const NAV_ITEMS = [
  { id: 'about', label: '关于' },
  { id: 'pillars', label: '能力' },
  { id: 'journey', label: '流程' },
  { id: 'pricing', label: '计费' },
];

const PILLARS = [
  {
    index: 'I',
    title: '地区地图',
    subtitle: 'Culture Atlas',
    desc: '国家与省/州/县多级视图。Hofstede 六维雷达、信息密度与本地化排版偏好，帮助团队建立市场认知框架。',
    tags: ['50+ 市场', '文化雷达', '精选链接'],
  },
  {
    index: 'II',
    title: '模拟调研',
    subtitle: 'Simulated Fieldwork',
    desc: '语料抓取、材料上传、AI 人设与多轮访谈。从假设到验证，缩短出海前的用户研究周期。',
    tags: ['人设生成', '访谈回放', '报告导出'],
  },
  {
    index: 'III',
    title: '三步分析',
    subtitle: 'Design Intelligence',
    desc: '输入产品、用户、场景与目标，生成面向 UX / 产品团队的跨文化分析与落地建议。',
    tags: ['DeepSeek V4', '知识库增强', '历史沉淀'],
  },
];

const AUDIENCE = [
  { role: '产品经理', need: '验证本地化假设，对齐商业目标与用户感受' },
  { role: 'UX 设计师', need: '理解排版偏好、信息密度与文化叙事差异' },
  { role: '用户研究员', need: '快速搭建模拟访谈，补充实地调研前的方向' },
];

const JOURNEY = [
  { label: '选定市场', text: '在地球仪上定位国家或地区，阅读文化概览与维度数据' },
  { label: '展开研究', text: '对话 AI 顾问，或运行模拟调研验证关键假设' },
  { label: '形成决策', text: '输出三步分析报告，指导界面、内容与产品策略' },
];

const LANDING_HEADER_OFFSET = 96;

function getHeaderOffset() {
  return LANDING_HEADER_OFFSET;
}

export default function LandingPage({ onLogin, onRegister }) {
  const pageRef = useRef(null);
  const { headerScrolled } = useLandingMotion(pageRef);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    setActiveSection(id);
    setMenuOpen(false);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    const sectionIds = NAV_ITEMS.map((item) => item.id);
    const onScroll = () => {
      const offset = getHeaderOffset() + 40;
      let current = '';
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) current = id;
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <div className="landing-page" ref={pageRef}>
      <AuthBackground scopeClass="landing-page" />

      <header
        className={`landing-header${menuOpen ? ' landing-header--menu-open' : ''}${headerScrolled ? ' landing-header--scrolled' : ''}`}
      >
        <button type="button" className="landing-logo-btn" onClick={scrollToTop} aria-label="返回首屏顶部">
          <BrandLogo />
        </button>

        <nav className="landing-header-nav" aria-label="页面导航">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeSection === item.id ? 'is-active' : ''}
              onClick={() => scrollTo(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="landing-header-actions">
          <button type="button" className="landing-link-btn" onClick={onLogin}>登录</button>
          <button type="button" className="landing-entry-btn" onClick={onRegister}>进入平台</button>
          <button
            type="button"
            className="landing-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            aria-label={menuOpen ? '关闭导航菜单' : '打开导航菜单'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="landing-menu-toggle-icon" aria-hidden="true" />
          </button>
        </div>
      </header>

      {menuOpen && (
        <>
          <button
            type="button"
            className="landing-menu-backdrop"
            aria-label="关闭导航菜单"
            onClick={() => setMenuOpen(false)}
          />
          <div id="landing-mobile-menu" className="landing-mobile-menu landing-mobile-menu--open" role="dialog" aria-modal="true">
            <p className="landing-mobile-menu-title">页面导航</p>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activeSection === item.id ? 'is-active' : ''}
                onClick={() => scrollTo(item.id)}
              >
                {item.label}
              </button>
            ))}
            <div className="landing-mobile-menu-divider" />
            <button type="button" onClick={() => { setMenuOpen(false); onLogin(); }}>登录</button>
            <button type="button" className="landing-mobile-menu-primary" onClick={() => { setMenuOpen(false); onRegister(); }}>
              进入平台 / 注册
            </button>
          </div>
        </>
      )}

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-copy landing-hero-in landing-hero-in--1">
            <p className="landing-eyebrow">Cross-Culture Research Studio</p>
            <h1 className="landing-title">
              跨文化
              <br />
              研究设计
            </h1>
            <p className="landing-lead">
              为中国产品与设计团队打造的研究决策平台。把 Hofstede 文化框架、
              地区地图、AI 模拟调研与智能报告，收敛到同一条工作流里。
            </p>
            <div className="landing-hero-actions">
              <button type="button" className="landing-entry-btn landing-entry-btn--lg" onClick={onRegister}>
                创建账号，开始研究
              </button>
              <button type="button" className="landing-link-btn landing-link-btn--lg" onClick={() => scrollTo('about')}>
                阅读平台介绍
              </button>
            </div>
            <dl className="landing-hero-meta">
              <div>
                <dt>覆盖</dt>
                <dd>50+ 国家与地区</dd>
              </div>
              <div>
                <dt>框架</dt>
                <dd>Hofstede 六维</dd>
              </div>
              <div>
                <dt>引擎</dt>
                <dd>DeepSeek V4</dd>
              </div>
            </dl>
          </div>

          <div className="landing-hero-visual landing-hero-in landing-hero-in--2">
            <LandingHeroMark />
          </div>
        </section>

        <div className="landing-divider" aria-hidden="true" />

        <section id="pillars" className="landing-pillars landing-anchor">
          <header className="landing-section-head landing-reveal">
            <span className="landing-kicker">Research Modules</span>
            <h2>三个模块，一条研究链路</h2>
          </header>

          <div className="landing-pillar-list">
            {PILLARS.map((item, i) => (
              <article
                key={item.index}
                className={`landing-pillar landing-reveal landing-reveal--d${Math.min(i + 1, 3)}`}
              >
                <div className="landing-pillar-index">{item.index}</div>
                <div className="landing-pillar-body">
                  <p className="landing-pillar-sub">{item.subtitle}</p>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  <ul>
                    {item.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="landing-about landing-anchor">
          <div className="landing-about-quote landing-reveal">
            <blockquote>
              「本地化不是翻译界面，而是理解另一个市场里，用户如何感受产品与品牌。」
            </blockquote>
          </div>
          <div className="landing-about-content landing-reveal landing-reveal--d2">
            <span className="landing-kicker">关于我们</span>
            <h2>CROSS-CULTURE 是什么</h2>
            <p>
              我们面向出海与跨文化设计场景，将人类学框架、设计语言和 AI 能力整合为可执行的研究工具。
              平台不替代实地调研，但帮助团队在早期以更低成本建立结构化的文化认知，并在设计评审中有据可依。
            </p>
            <p>
              从地图上的文化概览，到模拟用户访谈，再到面向产品团队的三步分析报告——
              你可以在同一账户下完成探索、验证与沉淀。
            </p>

            <div className="landing-audience">
              <h3>为谁而做</h3>
              <ul>
                {AUDIENCE.map((a) => (
                  <li key={a.role}>
                    <strong>{a.role}</strong>
                    <span>{a.need}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="journey" className="landing-journey landing-anchor">
          <header className="landing-section-head landing-reveal">
            <span className="landing-kicker">Workflow</span>
            <h2>从市场选择到设计决策</h2>
          </header>
          <ol className="landing-journey-track landing-reveal landing-reveal--d2">
            {JOURNEY.map((step, i) => (
              <li key={step.label}>
                <span className="landing-journey-node">{i + 1}</span>
                <h3>{step.label}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="pricing" className="landing-pricing landing-anchor">
          <header className="landing-section-head landing-reveal">
            <span className="landing-kicker">Pricing</span>
            <h2>按次计费，透明可控</h2>
          </header>
          <div className="landing-price-table landing-reveal landing-reveal--d2">
            <div className="landing-price-row">
              <span>AI 跨文化对话</span>
              <strong>¥0.02 / 次</strong>
            </div>
            <div className="landing-price-row">
              <span>三步分析报告</span>
              <strong>¥0.10 / 次</strong>
            </div>
            <div className="landing-price-row landing-price-row--featured">
              <span>模拟调研（人设 + 访谈 + 报告）</span>
              <strong>¥0.45 / 轮</strong>
            </div>
          </div>
          <p className="landing-pricing-note landing-reveal landing-reveal--d3">
            新用户注册赠送体验额度，每日登录另有小额赠送。支持微信扫码充值，研究记录云端保存。
          </p>
        </section>

        <section className="landing-cta-band landing-reveal">
          <div className="landing-cta-band-inner">
            <div>
              <h2>准备好进入研究工作室了吗？</h2>
              <p>登录后即可使用地图、模拟调研与智能分析全套能力。</p>
            </div>
            <div className="landing-cta-band-actions">
              <button type="button" className="landing-entry-btn" onClick={onRegister}>免费注册</button>
              <button type="button" className="landing-link-btn" onClick={onLogin}>我已有账号</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <BrandLogo variant="compact" />
        <p>© {new Date().getFullYear()} CROSS-CULTURE · 跨文化研究设计平台</p>
      </footer>
    </div>
  );
}
