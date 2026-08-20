"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A flip-dot (flip-disk) display: a grid of discs that flip open in a
 * left-to-right wave to spell each word, the way old mechanical station signs
 * do. Self-contained — one canvas, one rAF loop, no dependencies. Rendered as
 * a link so the whole board is the button.
 *
 * Words are rasterised through a tiny offscreen canvas (one pixel per dot), so
 * any short string works; the font auto-shrinks to fit the grid width. Lit
 * discs get a soft glow + specular highlight so the board reads as glossy
 * hardware rather than flat pixels.
 */
export interface FlipDiskMatrixProps {
  words: string[];
  href: string;
  cols?: number;
  rows?: number;
  /** On-dot colour. Defaults to the live theme accent, falling back to gold. */
  color?: string;
  ariaLabel: string;
  className?: string;
}

const CELL = 13; // device-independent px per dot at 1x

function wordToGrid(word: string, cols: number, rows: number): boolean[] {
  const off = document.createElement("canvas");
  // Rasterise at 2× then threshold — cleaner letter edges than a 1px render.
  const S = 2;
  off.width = cols * S;
  off.height = rows * S;
  const octx = off.getContext("2d", { willReadFrequently: true });
  if (!octx) return new Array(cols * rows).fill(false);

  octx.fillStyle = "#000";
  octx.fillRect(0, 0, cols * S, rows * S);
  octx.fillStyle = "#fff";
  octx.textAlign = "center";
  octx.textBaseline = "middle";

  let size = rows * S;
  const font = (s: number) => `800 ${s}px "Arial Narrow", Arial, sans-serif`;
  octx.font = font(size);
  while (octx.measureText(word).width > (cols - 2) * S && size > 2) {
    size -= 1;
    octx.font = font(size);
  }
  octx.fillText(word, (cols * S) / 2, (rows * S) / 2 + S);

  const data = octx.getImageData(0, 0, cols * S, rows * S).data;
  const grid: boolean[] = new Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Sample the centre of each dot's SxS block.
      const px = (r * S + Math.floor(S / 2)) * cols * S + (c * S + Math.floor(S / 2));
      grid[r * cols + c] = data[px * 4] > 110;
    }
  }
  return grid;
}

export function FlipDiskMatrix({
  words,
  href,
  cols = 60,
  rows = 11,
  color,
  ariaLabel,
  className,
}: FlipDiskMatrixProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLAnchorElement | null>(null);
  const [word, setWord] = useState(0);
  const hoverRef = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || words.length < 2) return;
    const id = setInterval(() => setWord((w) => (w + 1) % words.length), 2800);
    return () => clearInterval(id);
  }, [words.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = cols * CELL * dpr;
    canvas.height = rows * CELL * dpr;
    ctx.scale(dpr, dpr);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onColor =
      color ||
      getComputedStyle(wrapRef.current ?? canvas)
        .getPropertyValue("--accent")
        .trim() ||
      "#d0a638";

    const target = wordToGrid(words[word] ?? "", cols, rows);
    const progress = new Float32Array(cols * rows);
    if (reduce) for (let i = 0; i < progress.length; i++) progress[i] = target[i] ? 1 : 0;
    const start = performance.now();
    let raf = 0;
    const r = CELL * 0.4;

    const draw = (now: number) => {
      ctx.clearRect(0, 0, cols * CELL, rows * CELL);
      const speed = hoverRef.current ? 0.3 : 0.17;
      let moving = false;

      for (let c = 0; c < cols; c++) {
        const gate = reduce ? 0 : c * 11; // per-column start delay → flip wave
        const live = now - start > gate;
        for (let row = 0; row < rows; row++) {
          const i = row * cols + c;
          const want = target[i] ? 1 : 0;
          if (live && !reduce) progress[i] += (want - progress[i]) * speed;
          if (Math.abs(want - progress[i]) > 0.01) moving = true;
          const p = progress[i];
          const cx = c * CELL + CELL / 2;
          const cy = row * CELL + CELL / 2;

          if (p < 0.04) {
            // Resting disc — faint, so the whole board is visible like hardware.
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.05)";
            ctx.fill();
            continue;
          }

          // Lit disc: soft glow, accent fill that blooms with the flip, then a
          // small specular highlight top-left — glossy, not flat.
          ctx.globalAlpha = 0.18 * p;
          ctx.beginPath();
          ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = onColor;
          ctx.fill();

          ctx.globalAlpha = 0.2 + 0.8 * p;
          ctx.beginPath();
          ctx.arc(cx, cy, r * (0.55 + 0.45 * p), 0, Math.PI * 2);
          ctx.fillStyle = onColor;
          ctx.fill();

          ctx.globalAlpha = 0.5 * p;
          ctx.beginPath();
          ctx.arc(cx - r * 0.28, cy - r * 0.3, r * 0.32, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      raf = moving ? requestAnimationFrame(draw) : 0;
    };
    draw(performance.now());
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [word, words, cols, rows, color]);

  return (
    <a
      ref={wrapRef}
      href={href}
      aria-label={ariaLabel}
      className={cn("flip-disk", className)}
      onMouseEnter={() => {
        hoverRef.current = true;
        setWord((w) => (words.length > 1 ? (w + 1) % words.length : w));
      }}
      onMouseLeave={() => {
        hoverRef.current = false;
      }}
    >
      <canvas ref={canvasRef} aria-hidden className="flip-disk-canvas" />
    </a>
  );
}

export default FlipDiskMatrix;
