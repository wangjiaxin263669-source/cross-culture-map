import React from 'react';

/** 品牌符号 · 经纬线地球 + Hofstede 六维射线 */
export default function LandingHeroMark() {
  return (
    <div className="landing-hero-mark" aria-hidden="true">
      <svg viewBox="0 0 420 420" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="landingGlobeGlow" cx="50%" cy="48%" r="50%">
            <stop offset="0%" stopColor="rgba(212,196,168,0.14)" />
            <stop offset="55%" stopColor="rgba(212,196,168,0.04)" />
            <stop offset="100%" stopColor="rgba(212,196,168,0)" />
          </radialGradient>
        </defs>

        <circle cx="210" cy="200" r="168" fill="url(#landingGlobeGlow)" />

        <g className="landing-hero-mark-rays">
          {[0, 60, 120, 180, 240, 300].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1="210"
                y1="200"
                x2={210 + Math.cos(rad) * 188}
                y2={200 + Math.sin(rad) * 188}
                stroke="rgba(212,196,168,0.12)"
                strokeWidth="0.75"
              />
            );
          })}
        </g>

        <circle cx="210" cy="200" r="132" stroke="rgba(212,196,168,0.28)" strokeWidth="0.85" />
        <ellipse cx="210" cy="200" rx="132" ry="46" stroke="rgba(212,196,168,0.18)" strokeWidth="0.75" />
        <ellipse cx="210" cy="200" rx="132" ry="88" stroke="rgba(212,196,168,0.1)" strokeWidth="0.6" />
        <path d="M210 68 V332" stroke="rgba(212,196,168,0.22)" strokeWidth="0.75" />
        <path d="M78 200 H342" stroke="rgba(212,196,168,0.14)" strokeWidth="0.6" />

        {[-60, -30, 0, 30, 60].map((lat) => {
          const ry = 132 * Math.cos((lat * Math.PI) / 180);
          return (
            <ellipse
              key={lat}
              cx="210"
              cy="200"
              rx="132"
              ry={Math.max(ry, 8)}
              stroke="rgba(212,196,168,0.14)"
              strokeWidth="0.55"
            />
          );
        })}

        <circle className="landing-hero-mark-core" cx="210" cy="200" r="3.5" fill="rgba(212,196,168,0.85)" />
        <circle className="landing-hero-mark-ring" cx="210" cy="200" r="9" stroke="rgba(212,196,168,0.35)" strokeWidth="0.75" />
        <circle className="landing-hero-mark-dot landing-hero-mark-dot--1" cx="268" cy="148" r="2.5" fill="rgba(212,196,168,0.7)" />
        <circle className="landing-hero-mark-dot landing-hero-mark-dot--2" cx="142" cy="228" r="2" fill="rgba(212,196,168,0.5)" />
        <circle className="landing-hero-mark-dot landing-hero-mark-dot--3" cx="292" cy="236" r="2" fill="rgba(212,196,168,0.45)" />
      </svg>
      <div className="landing-hero-mark-caption">
        <span>Culture Map</span>
        <span>Hofstede · Research Studio</span>
      </div>
    </div>
  );
}
