import React, { useEffect, useRef } from 'react';

const CHAMPAGNE = '212, 196, 168';

/**
 * 登录页全屏黑色背景 · 高端互动视觉
 * 鼠标聚光 + 星座粒子 + 大型经纬线球体 + 流光
 */
export default function AuthBackground() {
  const canvasRef = useRef(null);
  const ripplesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const page = canvas.closest('.auth-page');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let w = 0;
    let h = 0;
    let raf = 0;
    let mouseX = 0.5;
    let mouseY = 0.45;
    let targetMouseX = 0.5;
    let targetMouseY = 0.45;
    let lastRipple = 0;

    const particleCount = prefersReduced ? 0 : 72;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.5 + Math.random() * 1.4,
      vx: (Math.random() - 0.5) * 0.00012,
      vy: (Math.random() - 0.5) * 0.00012,
      pulse: Math.random() * Math.PI * 2,
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

    const setMouseCss = (x, y) => {
      if (!page) return;
      page.style.setProperty('--mouse-x', `${x}px`);
      page.style.setProperty('--mouse-y', `${y}px`);
      page.style.setProperty('--mouse-nx', String(x / w));
      page.style.setProperty('--mouse-ny', String(y / h));
    };

    const onMove = (e) => {
      targetMouseX = e.clientX / w;
      targetMouseY = e.clientY / h;
      setMouseCss(e.clientX, e.clientY);

      const now = performance.now();
      if (!prefersReduced && now - lastRipple > 900) {
        lastRipple = now;
        ripplesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          r: 0,
          maxR: Math.min(w, h) * 0.14,
          alpha: 0.22,
        });
        if (ripplesRef.current.length > 4) ripplesRef.current.shift();
      }
    };

    const drawWireGlobe = (cx, cy, radius, spin, tilt, alpha) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tilt);

      ctx.strokeStyle = `rgba(${CHAMPAGNE}, ${alpha})`;
      ctx.lineWidth = 0.65;

      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      for (let lat = -3; lat <= 3; lat += 1) {
        if (lat === 0) continue;
        const squash = 0.22 + Math.abs(lat) * 0.13;
        ctx.beginPath();
        ctx.ellipse(0, lat * radius * 0.17, radius, radius * squash, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.ellipse(0, 0, radius, radius * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();

      for (let i = 0; i < 10; i += 1) {
        const angle = spin + (i / 10) * Math.PI;
        ctx.save();
        ctx.rotate(angle);
        ctx.scale(0.26, 1);
        ctx.beginPath();
        ctx.ellipse(0, 0, radius, radius, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.beginPath();
      ctx.moveTo(0, -radius);
      ctx.lineTo(0, radius);
      ctx.stroke();

      ctx.restore();
    };

    const drawConstellation = (time) => {
      const positions = particles.map((p) => ({
        px: p.x * w,
        py: p.y * h,
      }));

      const linkDist = Math.min(w, h) * 0.11;
      for (let i = 0; i < positions.length; i += 1) {
        for (let j = i + 1; j < positions.length; j += 1) {
          const dx = positions[i].px - positions[j].px;
          const dy = positions[i].py - positions[j].py;
          const dist = Math.hypot(dx, dy);
          if (dist > linkDist) continue;

          const nearMouse =
            Math.hypot(positions[i].px - mouseX * w, positions[i].py - mouseY * h) <
              linkDist * 1.4 ||
            Math.hypot(positions[j].px - mouseX * w, positions[j].py - mouseY * h) <
              linkDist * 1.4;

          const lineAlpha = (1 - dist / linkDist) * (nearMouse ? 0.14 : 0.06);
          ctx.beginPath();
          ctx.moveTo(positions[i].px, positions[i].py);
          ctx.lineTo(positions[j].px, positions[j].py);
          ctx.strokeStyle = `rgba(${CHAMPAGNE}, ${lineAlpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      particles.forEach((p, i) => {
        const pullX = (mouseX - p.x) * 0.000015;
        const pullY = (mouseY - p.y) * 0.000015;
        p.x += p.vx + pullX;
        p.y += p.vy + pullY;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;

        const px = p.x * w;
        const py = p.y * h;
        const twinkle = 0.2 + Math.sin(time * 0.0018 + p.pulse) * 0.18;
        const distToMouse = Math.hypot(px - mouseX * w, py - mouseY * h);
        const boost = distToMouse < linkDist ? 1.6 : 1;

        ctx.beginPath();
        ctx.arc(px, py, p.r * boost, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${CHAMPAGNE}, ${twinkle * boost})`;
        ctx.fill();

        if (boost > 1.2) {
          ctx.beginPath();
          ctx.arc(px, py, p.r * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${CHAMPAGNE}, ${twinkle * 0.08})`;
          ctx.fill();
        }

        positions[i] = { px, py };
      });
    };

    const drawRipples = () => {
      ripplesRef.current = ripplesRef.current.filter((ripple) => {
        ripple.r += ripple.maxR * 0.018;
        ripple.alpha *= 0.965;
        if (ripple.alpha < 0.01) return false;

        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${CHAMPAGNE}, ${ripple.alpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        return true;
      });
    };

    const tick = (time) => {
      mouseX += (targetMouseX - mouseX) * 0.07;
      mouseY += (targetMouseY - mouseY) * 0.07;

      ctx.clearRect(0, 0, w, h);

      const gx = mouseX * w;
      const gy = mouseY * h;

      const baseGlow = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(w, h) * 0.55);
      baseGlow.addColorStop(0, `rgba(${CHAMPAGNE}, 0.1)`);
      baseGlow.addColorStop(0.25, `rgba(${CHAMPAGNE}, 0.035)`);
      baseGlow.addColorStop(0.55, `rgba(${CHAMPAGNE}, 0.008)`);
      baseGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = baseGlow;
      ctx.fillRect(0, 0, w, h);

      const spin = time * 0.00006;
      const globeX = w * (0.54 + (mouseX - 0.5) * 0.1);
      const globeY = h * (0.46 + (mouseY - 0.5) * 0.08);
      const globeR = Math.min(w, h) * 0.36;

      drawWireGlobe(globeX, globeY, globeR, spin, -0.18, 0.1);
      drawWireGlobe(w * 0.18, h * 0.72, globeR * 0.42, -spin * 1.3, 0.12, 0.055);
      drawWireGlobe(w * 0.82, h * 0.22, globeR * 0.32, spin * 0.8 + 1, -0.08, 0.045);

      if (particleCount > 0) {
        drawConstellation(time);
      }

      drawRipples();

      const ring = ctx.createRadialGradient(gx, gy, 0, gx, gy, 140);
      ring.addColorStop(0, `rgba(${CHAMPAGNE}, 0.06)`);
      ring.addColorStop(0.6, `rgba(${CHAMPAGNE}, 0.015)`);
      ring.addColorStop(1, 'transparent');
      ctx.fillStyle = ring;
      ctx.fillRect(gx - 140, gy - 140, 280, 280);

      raf = requestAnimationFrame(tick);
    };

    resize();
    setMouseCss(w * 0.5, h * 0.45);
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
    <div className="auth-ambient" aria-hidden="true">
      <div className="auth-bg-deep" />
      <div className="auth-spotlight" />
      <div className="auth-spotlight-ring" />
      <canvas ref={canvasRef} className="auth-canvas" />
      <div className="auth-aurora auth-aurora--a" />
      <div className="auth-aurora auth-aurora--b" />
      <div className="auth-beam auth-beam--a" />
      <div className="auth-beam auth-beam--b" />
      <div className="auth-grid-field" />
      <div className="auth-vignette" />
      <div className="auth-noise" />
    </div>
  );
}
