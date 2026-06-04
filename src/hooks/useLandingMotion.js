import { useEffect, useState } from 'react';

/**
 * 落地页轻量动效：滚动显现 + 顶栏滚动态
 * 尊重 prefers-reduced-motion
 */
export function useLandingMotion(pageRef) {
  const [headerScrolled, setHeaderScrolled] = useState(false);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return undefined;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reveals = page.querySelectorAll('.landing-reveal');

    const showAll = () => {
      reveals.forEach((el) => el.classList.add('is-visible'));
    };

    let observer;
    if (prefersReduced) {
      showAll();
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
      );
      reveals.forEach((el) => observer.observe(el));
    }

    const onScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [pageRef]);

  return { headerScrolled };
}
