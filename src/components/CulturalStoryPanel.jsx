import React from 'react';

function providerIcon(provider) {
  const p = (provider || '').toLowerCase();
  if (p.includes('bilibili')) return '📺';
  if (p.includes('youtube')) return '▶️';
  if (p.includes('nng') || p.includes('nn/g')) return '📖';
  return '🔗';
}

export default function CulturalStoryPanel({ country }) {
  if (!country) return null;
  const { culturalStory, videos = [], designInsights = [] } = country;

  return (
    <div className="culture-panel">
      {culturalStory && (
        <section className="story-card">
          <h3 className="section-heading">
            <span className="section-icon">📖</span>
            文化故事
          </h3>
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

      {videos.length > 0 && (
        <section className="video-section">
          <h3 className="section-heading">
            <span className="section-icon">🎬</span>
            延伸阅读 · 视频
          </h3>
          <div className="video-grid">
            {videos.map((v, i) => (
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
                  <span className="video-card-provider">{v.provider}</span>
                </div>
                <span className="video-card-arrow">↗</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {designInsights.length > 0 && (
        <section className="insights-section">
          <h3 className="section-heading">
            <span className="section-icon">💡</span>
            落地设计启示
          </h3>
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
