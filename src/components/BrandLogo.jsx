import React from 'react';

/**
 * 品牌标识 · 极简经纬线 mark + 宽距字标
 * variant: default（顶栏）| auth（登录页居中）
 */
export default function BrandLogo({ variant = 'default', className = '' }) {
  const rootClass = [
    'brand-logo',
    variant === 'auth' && 'brand-logo--auth',
    variant === 'auth-compact' && 'brand-logo--auth-compact',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const showTagline = variant !== 'compact' && variant !== 'auth-compact';

  return (
    <div className={rootClass}>
      <div className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="12.25" stroke="currentColor" strokeWidth="0.75" />
          <ellipse cx="16" cy="16" rx="12.25" ry="4.25" stroke="currentColor" strokeWidth="0.75" />
          <path d="M16 3.75V28.25" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" />
          <circle cx="16" cy="16" r="1.1" fill="currentColor" />
        </svg>
      </div>
      <div className="brand-text">
        <span className="brand-wordmark">Cross-Culture</span>
        {showTagline && (
          <span className="brand-tagline">跨文化研究设计平台</span>
        )}
      </div>
    </div>
  );
}
