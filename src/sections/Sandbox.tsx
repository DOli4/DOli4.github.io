import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import NebulaShader from "../components/NebulaShader";
import useReducedMotion from "../hooks/useReducedMotion";
import { usePlayground } from "../playground/ThemeContext";

/**
 * SANDBOX — "this part is yours". Draggable blocks over a live quantum-nebula
 * shader. Blocks are connected in order by always-moving energy lines, and
 * each connecting line's color is the BLEND of the two blocks it joins
 * (red + blue = purple, red + yellow = orange, via RGB averaging). Recolor
 * any block and the lines — and the final mixed result — update live.
 *
 * Reduced-motion / narrow viewports drop the WebGL nebula (perf) but keep
 * dragging, connecting, and color-mixing fully functional.
 */

interface Block {
  id: string;
  label: string;
  color: string;
}

const INITIAL: Block[] = [
  { id: "a", label: "red", color: "#ff2d42" },
  { id: "b", label: "blue", color: "#3b82f6" },
  { id: "c", label: "yellow", color: "#ffd400" },
  { id: "d", label: "drag me", color: "#00e5a0" },
];

const BLOCK_W = 128;
const BLOCK_H = 72;

/** Average two hex colors — gives red+blue→purple, red+yellow→orange. */
function blend(a: string, b: string): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round((pa[0] + pb[0]) / 2);
  const g = Math.round((pa[1] + pb[1]) / 2);
  const bl = Math.round((pa[2] + pb[2]) / 2);
  return rgbToHex(r, g, bl);
}
function blendAll(colors: string[]): string {
  return colors.reduce((acc, c) => (acc ? blend(acc, c) : c), "");
}
function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  const f = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
}
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
}

interface Pos { x: number; y: number; }

export default function Sandbox() {
  const arenaRef = useRef<HTMLDivElement>(null);
  const [blocks, setBlocks] = useState<Block[]>(INITIAL);
  const [positions, setPositions] = useState<Pos[]>([]);
  const dragState = useRef<{ index: number; dx: number; dy: number } | null>(null);

  const osReduced = useReducedMotion();
  const { motion: motionPref } = usePlayground();
  const reduced = osReduced || motionPref === "reduced";

  // Lay the blocks out once the arena has measured.
  useLayoutEffect(() => {
    const arena = arenaRef.current;
    if (!arena) return;
    const w = arena.clientWidth;
    const h = arena.clientHeight;
    setPositions(
      INITIAL.map((_, i) => ({
        x: Math.min(24 + (i % 2) * (w * 0.45), w - BLOCK_W - 8),
        y: 24 + Math.floor(i / 2) * (h * 0.42),
      })),
    );
  }, []);

  // Manual pointer dragging (so we always know exact centers for the lines).
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const st = dragState.current;
      const arena = arenaRef.current;
      if (!st || !arena) return;
      const rect = arena.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left - st.dx, rect.width - BLOCK_W));
      const y = Math.max(0, Math.min(e.clientY - rect.top - st.dy, rect.height - BLOCK_H));
      setPositions((prev) => prev.map((p, i) => (i === st.index ? { x, y } : p)));
    };
    const onUp = () => (dragState.current = null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const startDrag = (index: number, e: React.PointerEvent) => {
    const arena = arenaRef.current;
    if (!arena) return;
    const rect = arena.getBoundingClientRect();
    const p = positions[index];
    dragState.current = { index, dx: e.clientX - rect.left - p.x, dy: e.clientY - rect.top - p.y };
  };

  const recolor = (index: number, color: string) =>
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, color } : b)));

  const reset = () => {
    setBlocks(INITIAL);
    const arena = arenaRef.current;
    if (arena) {
      const w = arena.clientWidth;
      const h = arena.clientHeight;
      setPositions(
        INITIAL.map((_, i) => ({
          x: Math.min(24 + (i % 2) * (w * 0.45), w - BLOCK_W - 8),
          y: 24 + Math.floor(i / 2) * (h * 0.42),
        })),
      );
    }
  };

  const center = (i: number): Pos => ({
    x: (positions[i]?.x ?? 0) + BLOCK_W / 2,
    y: (positions[i]?.y ?? 0) + BLOCK_H / 2,
  });

  const mixedResult = blendAll(blocks.map((b) => b.color));

  return (
    <section id="sandbox" className="relative overflow-hidden bg-black py-32 sm:py-48">
      {!reduced && <NebulaShader />}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/30" />

      <div className="relative mx-auto max-w-6xl px-6">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-accent">
          05 — Sandbox
        </p>
        <h2 className="max-w-2xl text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl">
          This part is yours.
        </h2>
        <p className="mt-5 max-w-xl font-mono text-sm text-white/60">
          Drag the blocks. Recolor any of them (hover → dot). The lines between
          them <span className="text-white">blend</span> the colors they connect —
          red + blue = purple, red + yellow = orange — and never stop moving.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="border border-white/30 px-5 py-2 font-mono text-xs uppercase tracking-[0.15em] text-white/70 transition-colors hover:border-accent hover:text-accent"
          >
            Reset
          </button>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-white/50">
            mixed result
            <span
              className="inline-block h-6 w-10 rounded border border-white/30"
              style={{ backgroundColor: mixedResult }}
              title={mixedResult}
            />
          </div>
        </div>

        {/* Arena */}
        <div
          ref={arenaRef}
          className="relative mt-10 h-[460px] w-full touch-none rounded-xl border border-white/10 bg-white/[0.02]"
        >
          {/* connecting energy lines (blended colors, always moving) */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            {positions.length === blocks.length &&
              blocks.slice(0, -1).map((b, i) => {
                const c1 = center(i);
                const c2 = center(i + 1);
                const lineColor = blend(b.color, blocks[i + 1].color);
                return (
                  <motion.line
                    key={`${b.id}-line`}
                    x1={c1.x}
                    y1={c1.y}
                    x2={c2.x}
                    y2={c2.y}
                    stroke={lineColor}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeDasharray="10 8"
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset: [0, -36] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ filter: `drop-shadow(0 0 6px ${lineColor})` }}
                  />
                );
              })}
          </svg>

          {/* blocks */}
          {blocks.map((block, i) => {
            const p = positions[i] ?? { x: 0, y: 0 };
            return (
              <div
                key={block.id}
                onPointerDown={(e) => startDrag(i, e)}
                className="group absolute flex cursor-grab select-none items-center justify-center rounded-lg font-mono text-sm uppercase tracking-wide text-white shadow-lg active:cursor-grabbing"
                style={{
                  left: p.x,
                  top: p.y,
                  width: BLOCK_W,
                  height: BLOCK_H,
                  backgroundColor: block.color,
                  boxShadow: `0 0 24px ${block.color}66`,
                }}
              >
                {block.label}
                <label
                  className="absolute right-2 top-2 h-4 w-4 cursor-pointer rounded-full border border-white/60 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ backgroundColor: block.color }}
                  onPointerDown={(e) => e.stopPropagation()}
                  title="Recolor"
                >
                  <input
                    type="color"
                    value={block.color}
                    onChange={(e) => recolor(i, e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label={`Recolor ${block.label}`}
                  />
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
