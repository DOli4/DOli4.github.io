import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

type Palette = "magma" | "starlight" | "gold" | "tron";

interface ThermodynamicGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Grid density. Lower = chunky, Higher = smooth.
   * Default: 25
   */
  resolution?: number;
  /**
   * Cooling rate (0 to 1). Higher = trails fade faster.
   * Default: 0.98
   */
  coolingFactor?: number;
  /**
   * Colour theme for the heat. "magma" is the original lava look.
   * Default: "magma"
   */
  palette?: Palette;
  /**
   * Overlay mode: transparent background + additive glow, so the grid can sit
   * on top of other content as an interactive cursor trail. Also listens for
   * pointer movement on `window` so it works even with `pointer-events: none`.
   * Default: false (original opaque behaviour).
   */
  overlay?: boolean;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Multi-stop colour ramps → [r,g,b]. magma keeps the original fast approximation.
const rampColor = (palette: Palette, t: number): string => {
  if (palette === "magma") {
    const r = Math.min(255, Math.max(0, t * 2.5 * 255));
    const g = Math.min(255, Math.max(0, (t * 2.5 - 1) * 255));
    const b = Math.min(255, Math.max(0, (t * 2.5 - 2) * 255 + t * 50));
    return `rgb(${r + 10}, ${g + 10}, ${b + 15})`;
  }

  const stops =
    palette === "starlight"
      ? ([
          [0.0, [10, 15, 42]], // deep navy
          [0.35, [59, 47, 117]], // indigo violet
          [0.65, [106, 139, 216]], // periwinkle
          [1.0, [234, 242, 255]], // blue-white spark
        ] as const)
      : palette === "tron"
        ? ([
            [0.0, [4, 12, 18]], // near-black teal
            [0.4, [0, 110, 140]], // deep cyan
            [0.72, [53, 230, 255]], // neon cyan
            [1.0, [224, 250, 255]], // white-cyan
          ] as const)
        : ([
            [0.0, [40, 22, 8]], // dark ember
            [0.4, [176, 96, 32]], // amber
            [0.7, [232, 193, 74]], // gold
            [1.0, [255, 250, 232]], // white-gold
          ] as const);

  for (let i = 0; i < stops.length - 1; i++) {
    const [pa, ca] = stops[i];
    const [pb, cb] = stops[i + 1];
    if (t <= pb) {
      const k = pb === pa ? 0 : (t - pa) / (pb - pa);
      const r = Math.round(lerp(ca[0], cb[0], k));
      const g = Math.round(lerp(ca[1], cb[1], k));
      const b = Math.round(lerp(ca[2], cb[2], k));
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  const last = stops[stops.length - 1][1];
  return `rgb(${last[0]}, ${last[1]}, ${last[2]})`;
};

const ThermodynamicGrid = ({
  className,
  resolution = 25,
  coolingFactor = 0.98,
  palette = "magma",
  overlay = false,
  style,
  ...props
}: ThermodynamicGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Overlay mode needs an alpha channel so the scene shows through.
    const ctx = canvas.getContext("2d", { alpha: overlay });
    if (!ctx) return;

    // Simulation State
    let grid: Float32Array; // Temperature map (0.0 - 1.0)
    let cols = 0;
    let rows = 0;
    let width = 0;
    let height = 0;

    // Mouse State
    const mouse = { x: -1000, y: -1000, prevX: -1000, prevY: -1000, active: false };

    const getThermalColor = (t: number) => rampColor(palette, t);

    const resize = () => {
      width = container.offsetWidth;
      height = container.offsetHeight;
      canvas.width = width;
      canvas.height = height;
      cols = Math.ceil(width / resolution);
      rows = Math.ceil(height / resolution);
      grid = new Float32Array(cols * rows).fill(0);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    let raf = 0;

    // --- PHYSICS LOOP ---
    const update = () => {
      // 1. INJECT HEAT (Brush)
      if (mouse.active) {
        const dx = mouse.x - mouse.prevX;
        const dy = mouse.y - mouse.prevY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(dist / (resolution / 2));

        for (let s = 0; s <= steps; s++) {
          const t = steps > 0 ? s / steps : 0;
          const x = mouse.prevX + dx * t;
          const y = mouse.prevY + dy * t;
          const col = Math.floor(x / resolution);
          const row = Math.floor(y / resolution);

          const radius = 2;
          for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j <= radius; j++) {
              const c = col + i;
              const r = row + j;
              if (c >= 0 && c < cols && r >= 0 && r < rows) {
                const idx = c + r * cols;
                const d = Math.sqrt(i * i + j * j);
                if (d <= radius) {
                  grid[idx] = Math.min(1.0, grid[idx] + 0.3 * (1 - d / radius));
                }
              }
            }
          }
        }
      }

      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;

      // 2. RENDER & DIFFUSE
      if (overlay) {
        ctx.clearRect(0, 0, width, height);
        ctx.globalCompositeOperation = "lighter";
      } else {
        ctx.fillStyle = "#050505";
        ctx.fillRect(0, 0, width, height);
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = c + r * cols;
          const temp = grid[idx];

          // Cooling
          grid[idx] *= coolingFactor;

          // VISUALIZATION
          if (temp > 0.05) {
            const x = c * resolution;
            const y = r * resolution;
            ctx.fillStyle = getThermalColor(temp);
            const size = resolution * (0.8 + temp * 0.5); // Hotter = Bigger
            const off = (resolution - size) / 2;
            ctx.beginPath();
            ctx.rect(x + off, y + off, size, size);
            ctx.fill();
          } else if (!overlay) {
            // Draw subtle grid for cold areas (opaque mode only)
            if (c % 2 === 0 && r % 2 === 0) {
              const x = c * resolution;
              const y = r * resolution;
              ctx.fillStyle = "#18181b"; // Zinc-900
              ctx.fillRect(x + resolution / 2 - 1, y + resolution / 2 - 1, 2, 2);
            }
          }
        }
      }

      if (overlay) ctx.globalCompositeOperation = "source-over";

      raf = requestAnimationFrame(update);
    };

    // In overlay mode we track the pointer on `window` (works under
    // pointer-events: none); otherwise on the container as originally written.
    const moveTarget: Window | HTMLDivElement = overlay ? window : container;

    // ResizeObserver keeps the backing store matched to the container even if it
    // was 0×0 at mount (e.g. mounted before layout settled) — the original only
    // measured once, which left the canvas blank in that case.
    const ro = new ResizeObserver(() => resize());
    ro.observe(container);

    window.addEventListener("resize", resize);
    moveTarget.addEventListener("mousemove", handleMouseMove as EventListener);
    container.addEventListener("mouseleave", handleMouseLeave);

    resize();
    update();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", resize);
      moveTarget.removeEventListener("mousemove", handleMouseMove as EventListener);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [resolution, coolingFactor, palette, overlay]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 z-0 overflow-hidden",
        overlay ? "bg-transparent" : "bg-[#050505]",
        className,
      )}
      style={style}
      {...props}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default ThermodynamicGrid;
