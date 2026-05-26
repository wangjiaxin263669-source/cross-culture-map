import React, { useState } from 'react';
import { isVideoUrl } from '../data/linkPlatforms.js';

function providerIcon(provider) {
  const p = (provider || '').toLowerCase();
  if (p.includes('bilibili')) return '📺';
  if (p.includes('抖音')) return '🎵';
  if (p.includes('知乎')) return '📖';
  if (p.includes('人人都是产品经理') || p.includes('woshipm')) return '📄';
  if (p.includes('站酷') || p.includes('zcool')) return '🎨';
  return '🔗';
}

export default function CulturalStoryPanel({ country }) {
  const [expanded, setExpanded] = useState(false);
  if (!country) return null;
  const {
    culturalStory,
    methodology,
    references = [],
    videos = [],
    designInsights = [],
  } = country;

  const videoList = videos.filter((v) => isVideoUrl(v.url));

  return (
    <div className="culture-panel">
      <div className="culture-panel-toolbar">
        <button
          type="button"
          className="culture-collapse-btn"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? '收起文化故事与参考' : '展开文化故事与参考'}
        </button>
      </div>
      {!expanded && (
        <p className="culture-collapsed-hint">已折叠，便于快速进入下方「模拟调研」与「三步分析」。</p>
      )}
      {expanded && culturalStory && (
        <section className="story-card">
          <h3 className="section-heading section-heading-plain">文化故事</h3>
          <p className="story-tagline">{country.tagline}</p>
          <h4 className="story-title">{culturalStory.title}</h4>
          {culturalStory.paragraphs?.map((para, i) => (
            <p key={i} className="story-paragraph">{para}</p>
          ))}
          {culturalStory.designLink && (
            <div className="story-design-link">
              <span className="story-design-label">→ 设计启示</span>
              {culturalStory.designLink}
            </div>
          )}
        </section>
      )}

      {expanded && methodology && (
        <section className="methodology-card">
          <h3 className="section-heading">
            <span className="section-icon">🔬</span>
            结论从何而来？
          </h3>
          <p className="methodology-intro">{methodology.intro}</p>
          <ol className="methodology-steps">
            {methodology.steps?.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      {expanded && references.length > 0 && (
        <section className="references-section">
          <h3 className="section-heading section-heading-plain">文献与数据来源</h3>
          <p className="section-hint">点击标题可在新标签页打开原文；标注「设计师必读」的为跨文化 UX 经典参考</p>
          <div className="references-grid">
            {references.map((ref, i) => (
              <a
                key={i}
                href={ref.url}
                target="_blank"
                rel="noreferrer"
                className="reference-card"
              >
                <span className="reference-tag">{ref.tag}</span>
                <span className="reference-title">{ref.title}</span>
                <span className="reference-meta">
                  {ref.source}
                  {ref.year && ref.year !== '—' ? ` · ${ref.year}` : ''}
                </span>
                {ref.note && <span className="reference-note">{ref.note}</span>}
                <span className="reference-open">打开文献 ↗</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {expanded && videoList.length > 0 && (
        <section className="video-section">
          <h3 className="section-heading section-heading-plain">视频讲解 · 点击观看</h3>
          <p className="section-hint">仅展示 B 站等可播放视频；文献请见上方卡片</p>
          <div className="video-grid">
            {videoList.map((v, i) => (
              <a
                key={i}
                href={v.url}
                target="_blank"
                rel="noreferrer"
                className="video-card"
              >
                <span className="video-card-icon">{providerIcon(v.provider)}</span>
                <div className="video-card-body">
                  <span className="video-card-tag">{v.tag || v.provider}</span>
                  <span className="video-card-title">{v.title}</span>
                  <span className="video-card-provider">{v.provider} · 点击播放 ↗</span>
                </div>
                <span className="video-card-arrow">↗</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {expanded && designInsights.length > 0 && (
        <section className="insights-section">
          <h3 className="section-heading section-heading-plain">落地设计启示</h3>
          <div className="insights-stack">
            {designInsights.map((tip, index) => (
              <div key={index} className="research-card insight-card">
                <h4 className="research-title">
                  <span style={{ marginRight: '6px' }}>{tip.icon}</span>
                  {tip.title}
                </h4>
                <p className="research-content">{tip.content}</p>
                {tip.imageUrl && (
                  <div className="research-media-wrapper">
                    <img src={tip.imageUrl} alt="" className="research-image" />
                  </div>
                )}
                {tip.caseLink && (
                  <a href={tip.caseLink} target="_blank" rel="noreferrer" className="case-link-btn">
                    🔗 查看真实案例 ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
