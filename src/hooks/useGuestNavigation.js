import { useCallback, useEffect, useState } from 'react';

/** 未登录时的视图：首屏 / 登录 / 注册（与 URL hash 同步，支持浏览器后退） */
export function parseGuestView() {
  const hash = window.location.hash.replace(/^#/, '').toLowerCase();
  if (hash === 'login' || hash === 'register') return hash;
  return 'landing';
}

export function useGuestNavigation(isLoggedIn) {
  const [guestView, setGuestView] = useState(parseGuestView);

  useEffect(() => {
    if (isLoggedIn) return undefined;
    setGuestView(parseGuestView());
    const onPopState = () => setGuestView(parseGuestView());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isLoggedIn]);

  const navigateGuest = useCallback((view, { replace = false } = {}) => {
    const nextHash = view === 'landing' ? '' : `#${view}`;
    const base = `${window.location.pathname}${window.location.search}`;
    const nextUrl = nextHash ? `${base}${nextHash}` : base;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (current !== nextUrl) {
      if (replace) {
        window.history.replaceState(null, '', nextUrl);
      } else {
        window.history.pushState(null, '', nextUrl);
      }
    }

    setGuestView(view);
    if (view !== 'landing') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  return { guestView, navigateGuest };
}
