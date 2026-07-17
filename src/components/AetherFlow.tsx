import { useEffect, useRef } from "react";
import { THEME_EVENT } from "../lib/theme";

/**
 * Aether flow — the drill pages' living backdrop: the aether-flow-hero
 * particle NETWORK, adapted to this codebase. Drifting particles, lines
 * connecting close neighbours, a mouse field that pushes particles away, and
 * a standing clearing around the anomaly AND every card on the page so the
 * network never crawls over content.
 *
 * Colour comes from the theme: base tint = --aether-rgb, and near the cursor
 * the strands intensify to --aether-hot-rgb with an additive glow (instead of
 * turning white). Re-reads on themechange. Reduced-motion holds one frame.
 */

type Particle = { x: number; y: number; dx: number; dy: number; size: number };

const MOUSE_RADIUS = 220;
const ANOMALY_PAD = 110; // the anomaly's clearing — larger, per request
const CARD_PAD = 26;     // the force-field margin around each card
const CARD_SELECTOR = ".nd, .intel, .st-tile, .st-panel, .m-card, .m-editor, .m-ex, .m-idea";

export default function AetherFlow() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = { x: null as number | null, y: null as number | null };
    let particles: Particle[] = [];

    // theme colours, re-read on themechange
    let base = "80 160 255";
    let hot = "150 210 255";
    const readTheme = () => {
      const cs = getComputedStyle(document.documentElement);
      base = cs.getPropertyValue("--aether-rgb").trim() || base;
      hot = cs.getPropertyValue("--aether-hot-rgb").trim() || hot;
    };
    readTheme();
    const onTheme = () => { readTheme(); if (reduced) render(false); };
    addEventListener(THEME_EVENT, onTheme);

    // the anomaly's live circle
    let hubEl: Element | null = null;
    const anomaly = { x: 0, y: 0, r: 0, on: false };
    const readAnomaly = () => {
      if (!hubEl || !hubEl.isConnected) hubEl = document.querySelector(".hub");
      if (!hubEl) { anomaly.on = false; return; }
      const b = hubEl.getBoundingClientRect();
      if (b.width === 0) { anomaly.on = false; return; }
      anomaly.x = b.x + b.width / 2;
      anomaly.y = b.y + b.height / 2;
      anomaly.r = b.width * 0.3 + ANOMALY_PAD;
      anomaly.on = true;
    };

    // the card rects — element list cached, refreshed periodically (rects
    // themselves are re-measured every frame so they track pan/zoom/scroll)
    let cardEls: Element[] = [];
    let cardTick = 0;
    const refreshCards = () => { cardEls = [...document.querySelectorAll(CARD_SELECTOR)]; };
    refreshCards();

    const repelCircle = (p: Particle, cx: number, cy: number, radius: number, strength: number) => {
      const dx = cx - p.x, dy = cy - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < radius + p.size && dist > 0) {
        const force = (radius - dist) / radius;
        p.x -= (dx / dist) * force * strength;
        p.y -= (dy / dist) * force * strength;
      }
    };
    // rectangular keep-out: eject a particle that entered the padded rect to
    // its nearest edge AND reflect its drift on that axis, so it bounces off
    // instead of jittering against the seam between overlapping card pads
    const repelRect = (p: Particle, l: number, t: number, r: number, b: number) => {
      if (p.x <= l || p.x >= r || p.y <= t || p.y >= b) return;
      const dl = p.x - l, dr = r - p.x, dt = p.y - t, db = b - p.y;
      const m = Math.min(dl, dr, dt, db);
      if (m === dl) { p.x = l; if (p.dx > 0) p.dx = -p.dx; }
      else if (m === dr) { p.x = r; if (p.dx < 0) p.dx = -p.dx; }
      else if (m === dt) { p.y = t; if (p.dy > 0) p.dy = -p.dy; }
      else { p.y = b; if (p.dy < 0) p.dy = -p.dy; }
    };

    const segHitsAnomaly = (ax: number, ay: number, bx: number, by: number) => {
      if (!anomaly.on) return false;
      const vx = bx - ax, vy = by - ay;
      const len2 = vx * vx + vy * vy || 1;
      let u = ((anomaly.x - ax) * vx + (anomaly.y - ay) * vy) / len2;
      u = Math.max(0, Math.min(1, u));
      return Math.hypot(ax + u * vx - anomaly.x, ay + u * vy - anomaly.y) < anomaly.r;
    };

    function init() {
      particles = [];
      const count = (canvas!.width * canvas!.height) / 9000;
      for (let i = 0; i < count; i++) {
        const size = Math.random() * 2 + 1;
        particles.push({
          x: Math.random() * (canvas!.width - size * 4) + size * 2,
          y: Math.random() * (canvas!.height - size * 4) + size * 2,
          dx: Math.random() * 0.4 - 0.2,
          dy: Math.random() * 0.4 - 0.2,
          size,
        });
      }
    }

    const resize = () => {
      canvas.width = innerWidth;
      canvas.height = innerHeight;
      init();
      if (reduced) render(false);
    };

    function render(withMouse: boolean) {
      const w = canvas!.width, h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);
      readAnomaly();
      if (cardTick++ % 30 === 0) refreshCards();
      // measure every card once per frame
      const rects = cardEls
        .map((el) => el.getBoundingClientRect())
        .filter((b) => b.width > 0 && b.bottom > 0 && b.top < h && b.right > 0 && b.left < w);

      for (const p of particles) {
        if (p.x > w || p.x < 0) p.dx = -p.dx;
        if (p.y > h || p.y < 0) p.dy = -p.dy;

        if (withMouse && mouse.x !== null && mouse.y !== null) {
          repelCircle(p, mouse.x, mouse.y, MOUSE_RADIUS, 5);
        }
        if (anomaly.on) repelCircle(p, anomaly.x, anomaly.y, anomaly.r, 6);

        p.x += p.dx;
        p.y += p.dy;

        // keep out of every card's padded box (after the drift step)
        for (const b of rects) {
          repelRect(p, b.left - CARD_PAD, b.top - CARD_PAD, b.right + CARD_PAD, b.bottom + CARD_PAD);
        }

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgb(${base} / 0.85)`;
        ctx!.fill();
      }

      const threshold = (w / 7) * (h / 7);
      ctx!.lineWidth = 1;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const ddx = particles[a].x - particles[b].x;
          const ddy = particles[a].y - particles[b].y;
          const distSq = ddx * ddx + ddy * ddy;
          if (distSq >= threshold) continue;
          if (segHitsAnomaly(particles[a].x, particles[a].y, particles[b].x, particles[b].y)) continue;
          const opacity = Math.max(0, Math.min(1, 1 - distSq / 20000));
          let nearMouse = false;
          if (withMouse && mouse.x !== null && mouse.y !== null) {
            nearMouse = Math.hypot(particles[a].x - mouse.x, particles[a].y - mouse.y) < MOUSE_RADIUS;
          }
          if (nearMouse) {
            // intensify to the hot tint + additive glow, not white
            ctx!.strokeStyle = `rgb(${hot} / ${opacity})`;
            ctx!.shadowBlur = 8;
            ctx!.shadowColor = `rgb(${hot})`;
          } else {
            ctx!.strokeStyle = `rgb(${base} / ${opacity * 0.85})`;
            ctx!.shadowBlur = 0;
          }
          ctx!.beginPath();
          ctx!.moveTo(particles[a].x, particles[a].y);
          ctx!.lineTo(particles[b].x, particles[b].y);
          ctx!.stroke();
        }
      }
      ctx!.shadowBlur = 0; // reset so particle fills next frame aren't glowing
    }

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      render(true);
    };

    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onOut = () => { mouse.x = null; mouse.y = null; };

    resize();
    addEventListener("resize", resize);

    if (reduced) {
      render(false);
    } else {
      addEventListener("mousemove", onMove, { passive: true });
      addEventListener("mouseout", onOut, { passive: true });
      render(true);
      raf = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      removeEventListener("mousemove", onMove);
      removeEventListener("mouseout", onOut);
      removeEventListener(THEME_EVENT, onTheme);
    };
  }, []);

  return <canvas ref={ref} className="aether" aria-hidden />;
}
