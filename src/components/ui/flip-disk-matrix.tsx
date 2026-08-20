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
 * any short string works; the font auto-shrinks to fit the grid width.
 */
export interface FlipDiskMatrixProps {
  words: string[];
  href: string;
  /** Grid size. Defaults suit a wide, short banner. */
  cols?: number;
  rows?: number;
  /** On-dot colour. Defaults to the live theme accent, falling back to gold. */
  color?: string;
  ariaLabel: string;
  className?: string;
}

const CELL = 16; // device-independent px per dot at 1x

function wordToGrid(word: string, cols: number, rows: number): boolean[] {
  const off = document.createElement("canvas");
  off.width = cols;
  off.height = rows;
  const octx = off.getContext("2d", { willReadFrequently: true });
  if (!octx) return new Array(cols * rows).fill(false);

  octx.fillStyle = "#000";
  octx.fillRect(0, 0, cols, rows);
  octx.fillStyle = "#fff";
  octx.textAlign = "center";
  octx.textBaseline = "middle";

  // Shrink the font until the word fits the grid width (minus a 1-dot margin).
  let size = rows;
  const font = (s: number) => `bold ${s}px "Arial Narrow", Arial, sans-serif`;
  octx.font = font(size);
  while (octx.measureText(word).width > cols - 2 && size > 1) {
    size -= 0.5;
    octx.font = font(size);
  }
  octx.fillText(word, cols / 2, rows / 2 + 0.5);

  const data = octx.getImageData(0, 0, cols, rows).data;
  const grid: boolean[] = new Array(cols * rows);
  for (let i = 0; i < cols * rows; i++) grid[i] = data[i * 4] > 128; // red channel
  return grid;
}

export function FlipDiskMatrix({
  words,
  href,
  cols = 48,
  rows = 9,
  color,
  ariaLabel,
  className,
}: FlipDiskMatrixProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLAnchorElement | null>(null);
  const [word, setWord] = useState(0);
  const hoverRef = useRef(false);

  // Advance through the words on a gentle loop; hover nudges to the next.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || words.length < 2) return;
    const id = setInterval(() => setWord((w) => (w + 1) % words.length), 2600);
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
    // The accent only changes on a (rare) theme switch, which re-runs this
    // effect via the word cycle anyway — so read it once, not every frame.
    const onColor =
      color ||
      getComputedStyle(wrapRef.current ?? canvas)
        .getPropertyValue("--accent")
        .trim() ||
      "#d0a638";

    const target = wordToGrid(words[word] ?? "", cols, rows);
    // progress[i] eases 0..1 toward its target; the per-column start delay
    // makes the flip sweep across the board instead of all at once. Reduced
    // motion snaps straight to the target — one frame, no loop.
    const progress = new Float32Array(cols * rows);
    if (reduce) for (let i = 0; i < progress.length; i++) progress[i] = target[i] ? 1 : 0;
    const start = performance.now();
    let raf = 0;

    const draw = (now: number) => {
      ctx.clearRect(0, 0, cols * CELL, rows * CELL);
      const r = CELL * 0.42;
      const speed = hoverRef.current ? 0.28 : 0.16;
      let moving = false;

      for (let c = 0; c < cols; c++) {
        const gate = reduce ? 0 : c * 12; // ms before this column starts flipping
        const live = now - start > gate;
        for (let row = 0; row < rows; row++) {
          const i = row * cols + c;
          const want = target[i] ? 1 : 0;
          if (live && !reduce) progress[i] += (want - progress[i]) * speed;
          if (Math.abs(want - progress[i]) > 0.01) moving = true;
          const p = progress[i];

          const cx = c * CELL + CELL / 2;
          const cy = row * CELL + CELL / 2;
          // Off discs are faint; on discs bloom to full accent as they flip.
          ctx.beginPath();
          ctx.arc(cx, cy, r * (0.62 + 0.38 * p), 0, Math.PI * 2);
          if (p < 0.04) {
            ctx.fillStyle = "rgba(255,255,255,0.06)";
          } else {
            ctx.globalAlpha = 0.14 + 0.86 * p;
            ctx.fillStyle = onColor;
          }
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      // Idle once every disc has settled — no perpetual 60fps loop.
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
