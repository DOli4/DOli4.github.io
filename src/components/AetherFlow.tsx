import { useEffect, useRef } from "react";

/**
 * Aether flow v2 — the drill pages' living backdrop, now the particle
 * NETWORK from the aether-flow-hero reference: drifting particles, lines
 * connecting close neighbours, and a mouse field that pushes particles away
 * (lines whiten near the cursor). Ported from the 21st.dev component,
 * adapted to this codebase: TypeScript, transparent clear instead of a black
 * fill (the page's own void gradient stays visible), full cleanup, and one
 * calm static frame under prefers-reduced-motion.
 */

type Particle = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
};

const PARTICLE_COLOR = "rgba(80, 160, 255, 0.85)";
const LINE_COLOR = "120, 180, 255"; // rgb for the connecting lines
const MOUSE_RADIUS = 200;
/** the anomaly clears its own space: particles keep out of a ring around it */
const ANOMALY_PAD = 40;

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

    // The anomaly's live screen circle, re-read each frame so it holds
    // through canvas pan/zoom. Cached element, re-queried if it drops out.
    let hubEl: Element | null = null;
    const anomaly = { x: 0, y: 0, r: 0, on: false };
    const readAnomaly = () => {
      if (!hubEl || !hubEl.isConnected) hubEl = document.querySelector(".hub");
      if (!hubEl) { anomaly.on = false; return; }
      const b = hubEl.getBoundingClientRect();
      if (b.width === 0) { anomaly.on = false; return; }
      anomaly.x = b.x + b.width / 2;
      anomaly.y = b.y + b.height / 2;
      // the visible mass fills ~50% of the hub box (bloom mask), + a pad
      anomaly.r = b.width * 0.25 + ANOMALY_PAD;
      anomaly.on = true;
    };

    // shared repulsion: push a particle out of a circular field
    const repel = (p: Particle, cx: number, cy: number, radius: number, strength: number) => {
      const dx = cx - p.x, dy = cy - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < radius + p.size && dist > 0) {
        const force = (radius - dist) / radius;
        p.x -= (dx / dist) * force * strength;
        p.y -= (dy / dist) * force * strength;
      }
    };

    // does the segment a→b pass within radius r of the anomaly centre? (used
    // to drop lines that would otherwise cross the cleared mass)
    const segHitsAnomaly = (ax: number, ay: number, bx: number, by: number) => {
      if (!anomaly.on) return false;
      const vx = bx - ax, vy = by - ay;
      const len2 = vx * vx + vy * vy || 1;
      let t = ((anomaly.x - ax) * vx + (anomaly.y - ay) * vy) / len2;
      t = Math.max(0, Math.min(1, t));
      const px = ax + t * vx, py = ay + t * vy;
      return Math.hypot(px - anomaly.x, py - anomaly.y) < anomaly.r;
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
      if (reduced) render(false); // hold a repainted static frame
    };

    function render(withMouse: boolean) {
      const w = canvas!.width, h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);
      readAnomaly();

      for (const p of particles) {
        if (p.x > w || p.x < 0) p.dx = -p.dx;
        if (p.y > h || p.y < 0) p.dy = -p.dy;

        // the mouse field pushes particles away
        if (withMouse && mouse.x !== null && mouse.y !== null) {
          repel(p, mouse.x, mouse.y, MOUSE_RADIUS, 5);
        }
        // the anomaly holds its own clearing — a stronger nudge so particles
        // never drift onto the mass
        if (anomaly.on) repel(p, anomaly.x, anomaly.y, anomaly.r, 6);

        p.x += p.dx;
        p.y += p.dy;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = PARTICLE_COLOR;
        ctx!.fill();
      }

      // connect close neighbours; lines whiten near the cursor
      const threshold = (w / 7) * (h / 7);
      ctx!.lineWidth = 1;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const ddx = particles[a].x - particles[b].x;
          const ddy = particles[a].y - particles[b].y;
          const distSq = ddx * ddx + ddy * ddy;
          if (distSq < threshold) {
            // never draw a web strand across the anomaly's clearing
            if (segHitsAnomaly(particles[a].x, particles[a].y, particles[b].x, particles[b].y)) continue;
            const opacity = Math.max(0, Math.min(1, 1 - distSq / 20000));
            let nearMouse = false;
            if (withMouse && mouse.x !== null && mouse.y !== null) {
              nearMouse = Math.hypot(particles[a].x - mouse.x, particles[a].y - mouse.y) < MOUSE_RADIUS;
            }
            ctx!.strokeStyle = nearMouse
              ? `rgba(255, 255, 255, ${opacity})`
              : `rgba(${LINE_COLOR}, ${opacity})`;
            ctx!.beginPath();
            ctx!.moveTo(particles[a].x, particles[a].y);
            ctx!.lineTo(particles[b].x, particles[b].y);
            ctx!.stroke();
          }
        }
      }
    }

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      render(true);
    };

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onOut = () => {
      mouse.x = null;
      mouse.y = null;
    };

    resize();
    addEventListener("resize", resize);

    if (reduced) {
      render(false); // one calm frame, no loop, no mouse field
    } else {
      addEventListener("mousemove", onMove, { passive: true });
      addEventListener("mouseout", onOut, { passive: true });
      render(true); // paint the first frame synchronously
      raf = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      removeEventListener("mousemove", onMove);
      removeEventListener("mouseout", onOut);
    };
  }, []);

  return <canvas ref={ref} className="aether" aria-hidden />;
}
