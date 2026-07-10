import { useEffect, useRef } from "react";

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
};

/**
 * A dramatic "falling star" comet cursor. A bright glowing head follows the
 * pointer while a tail of warm sparks streams behind it, gently pulled downward
 * like a shooting star. Rendered on a full-screen, pointer-transparent canvas.
 */
export default function StarCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Respect users who prefer no motion — fall back to the native cursor.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Skip on touch devices (no meaningful cursor).
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const pointer = { x: width / 2, y: height / 2, seen: false };
    const head = { x: width / 2, y: height / 2 };
    const sparks: Spark[] = [];

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const onMove = (e: MouseEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.seen = true;
      document.body.classList.add("comet-active");
    };

    const spawn = (x: number, y: number, speed: number) => {
      // More sparks when moving fast → longer comet tail.
      const count = Math.min(6, 1 + Math.floor(speed / 6));
      for (let i = 0; i < count; i++) {
        const maxLife = 40 + Math.random() * 35;
        sparks.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2 + 0.4, // slight downward bias
          life: maxLife,
          maxLife,
          size: 1 + Math.random() * 2.6,
          hue: 38 + Math.random() * 18, // warm gold → amber
        });
      }
    };

    let raf = 0;
    const render = () => {
      raf = requestAnimationFrame(render);
      ctx.clearRect(0, 0, width, height);

      // Ease the comet head toward the pointer for a trailing, weighty feel.
      const px = head.x;
      const py = head.y;
      head.x += (pointer.x - head.x) * 0.2;
      head.y += (pointer.y - head.y) * 0.2;
      const speed = Math.hypot(head.x - px, head.y - py);

      if (pointer.seen) spawn(head.x, head.y, speed);

      ctx.globalCompositeOperation = "lighter";

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life -= 1;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.012; // faint gravity
        const t = s.life / s.maxLife;
        const r = s.size * t;
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 4);
        glow.addColorStop(0, `hsla(${s.hue}, 100%, 75%, ${t})`);
        glow.addColorStop(1, `hsla(${s.hue}, 100%, 60%, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // The comet head — a bright core with a soft halo.
      if (pointer.seen) {
        const halo = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 26);
        halo.addColorStop(0, "hsla(45, 100%, 92%, 0.95)");
        halo.addColorStop(0.4, "hsla(40, 100%, 70%, 0.5)");
        halo.addColorStop(1, "hsla(38, 100%, 60%, 0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 26, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "hsla(48, 100%, 97%, 1)";
        ctx.beginPath();
        ctx.arc(head.x, head.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
    };
    render();

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.body.classList.remove("comet-active");
    };
  }, []);

  return <canvas ref={canvasRef} className="star-cursor" aria-hidden="true" />;
}
