import React, { useEffect, useRef } from 'react';

const C = '212, 196, 168';

/** 主界面背景 · 星野 + 鼠标聚光 + 边缘星座（不遮挡地球中心区） */
export default function MapAmbient() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const root = canvas.closest('.app-container');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let w = 0;
    let h = 0;
    let raf = 0;
    let mx = 0.5;
    let my = 0.45;
    let tmx = 0.5;
    let tmy = 0.45;

    const stars = Array.from({ length: reduced ? 80 : 160 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.35 + Math.random() * 1.1,
      tw: Math.random() * Math.PI * 2,
      sp: 0.4 + Math.random() * 1.2,
    }));

    const dust = Array.from({ length: reduced ? 0 : 36 }, () => ({
      x: Math.random() < 0.5 ? Math.random() * 0.38 : 0.62 + Math.random() * 0.38,
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00006,
      vy: (Math.random() - 0.5) * 0.00006,
    }));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMove = (e) => {
      tmx = e.clientX / w;
      tmy = e.clientY / h;
      root?.style.setProperty('--map-mx', `${e.clientX}px`);
      root?.style.setProperty('--map-my', `${e.clientY}px`);
      root?.style.setProperty('--map-nx', String(tmx));
      root?.style.setProperty('--map-ny', String(tmy));
    };

    const inGlobeZone = (nx, ny) => {
      const dx = nx - 0.58;
      const dy = ny - 0.46;
      return dx * dx + dy * dy < 0.12;
    };

    const tick = (time) => {
      mx += (tmx - mx) * 0.05;
      my += (tmy - my) * 0.05;

      ctx.clearRect(0, 0, w, h);

      const gx = mx * w;
      const gy = my * h;
      const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(w, h) * 0.42);
      glow.addColorStop(0, `rgba(${C}, 0.055)`);
      glow.addColorStop(0.4, `rgba(${C}, 0.015)`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      stars.forEach((s) => {
        const alpha = 0.15 + Math.sin(time * 0.001 * s.sp + s.tw) * 0.12;
        if (inGlobeZone(s.x, s.y)) return;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      });

      const linkR = Math.min(w, h) * 0.09;
      const pts = dust.map((p) => {
        p.x += p.vx + (mx - 0.5) * 0.000008;
        p.y += p.vy + (my - 0.5) * 0.000008;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
        return { px: p.x * w, py: p.y * h };
      });

      for (let i = 0; i < pts.length; i += 1) {
        for (let j = i + 1; j < pts.length; j += 1) {
          const dist = Math.hypot(pts[i].px - pts[j].px, pts[i].py - pts[j].py);
          if (dist > linkR) continue;
          const a = (1 - dist / linkR) * 0.07;
          ctx.strokeStyle = `rgba(${C},${a})`;
          ctx.lineWidth = 0.45;
          ctx.beginPath();
          ctx.moveTo(pts[i].px, pts[i].py);
          ctx.lineTo(pts[j].px, pts[j].py);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(pts[i].px, pts[i].py, 0.9, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${C},0.35)`;
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    root?.style.setProperty('--map-mx', `${w * 0.35}px`);
    root?.style.setProperty('--map-my', `${h * 0.5}px`);
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <div className="map-ambient" aria-hidden="true">
      <div className="map-ambient-glow" />
      <div className="map-ambient-spot" />
      <canvas ref={canvasRef} className="map-ambient-canvas" />
      <div className="map-ambient-beam map-ambient-beam--a" />
      <div className="map-ambient-beam map-ambient-beam--b" />
    </div>
  );
}
