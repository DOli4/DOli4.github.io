import { useEffect, useRef } from "react";

/**
 * Aether flow — the drill pages' living backdrop. A 2D-canvas flow field:
 * particles drift along a layered-sine angle field leaving short glowing
 * streaks, cyan with violet undertones (the ANOMALY take on the purple
 * "aether" reference). Fixed, pointer-transparent, behind everything.
 * Reduced motion: one static frame, no loop.
 */
export default function AetherFlow() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const g2d = ctx;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0;
    const size = () => {
      w = canvas.width = innerWidth;
      h = canvas.height = innerHeight;
      // resizing clears the bitmap; in reduced mode nothing repaints, so
      // redraw the held frame here (no-op before the first step exists)
      if (reduced && parts.length) step(0);
    };
    size();
    addEventListener("resize", size);

    type P = { x: number; y: number; px: number; py: number; hue: number; speed: number };
    const N = 70;
    const parts: P[] = Array.from({ length: N }, () => spawn());
    function spawn(): P {
      const x = Math.random() * w, y = Math.random() * h;
      return {
        x, y, px: x, py: y,
        // mostly cyan, a violet undercurrent — matches the site, nods to aether
        hue: Math.random() < 0.7 ? 187 : 262,
        speed: 0.35 + Math.random() * 0.55,
      };
    }

    // cheap layered-sine "noise" — good enough for a drifting angle field
    const angle = (x: number, y: number, t: number) =>
      Math.sin(x * 0.0019 + t * 0.00022) * 1.9 +
      Math.cos(y * 0.0016 - t * 0.00017) * 1.7 +
      Math.sin((x + y) * 0.0008 + t * 0.0001) * 1.2;

    let raf = 0;
    function step(t: number) {
      g2d.clearRect(0, 0, w, h);
      g2d.lineCap = "round";
      for (const p of parts) {
        const a = angle(p.x, p.y, t);
        p.px = p.x;
        p.py = p.y;
        p.x += Math.cos(a) * p.speed;
        p.y += Math.sin(a) * p.speed;
        if (p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
          Object.assign(p, spawn());
          continue;
        }
        // a streak along the recent direction — reads as flow without a
        // persistent trail buffer
        const dx = p.x - p.px, dy = p.y - p.py;
        g2d.strokeStyle = `hsla(${p.hue}, 90%, 62%, 0.16)`;
        g2d.lineWidth = 1.2;
        g2d.beginPath();
        g2d.moveTo(p.x - dx * 16, p.y - dy * 16);
        g2d.lineTo(p.x, p.y);
        g2d.stroke();
        g2d.fillStyle = `hsla(${p.hue}, 95%, 70%, 0.35)`;
        g2d.beginPath();
        g2d.arc(p.x, p.y, 1.1, 0, Math.PI * 2);
        g2d.fill();
      }
      if (!reduced) raf = requestAnimationFrame(step);
    }

    if (reduced) {
      // settle the field a little, then hold one calm frame
      for (let i = 0; i < 40; i++) parts.forEach((p) => {
        const a = angle(p.x, p.y, i * 16);
        p.px = p.x; p.py = p.y;
        p.x += Math.cos(a) * p.speed * 4;
        p.y += Math.sin(a) * p.speed * 4;
      });
      step(0);
    } else {
      raf = requestAnimationFrame(step);
    }

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", size);
    };
  }, []);

  return <canvas ref={ref} className="aether" aria-hidden />;
}
