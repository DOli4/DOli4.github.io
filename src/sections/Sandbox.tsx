import { useRef, useState } from "react";
import { motion } from "framer-motion";
import CyberneticGrid from "../components/CyberneticGrid";
import useReducedMotion from "../hooks/useReducedMotion";
import { usePlayground } from "../playground/ThemeContext";

/**
 * SANDBOX — an interactive "break it yourself" segment. Every block is
 * draggable and individually recolorable, over a live cybernetic-grid
 * shader. It exists to *demonstrate* frontend capability: drag physics,
 * live theming, WebGL, and state management in one playful space.
 *
 * Reduced-motion / narrow viewports skip the WebGL grid (perf) but keep
 * dragging + recoloring fully functional.
 */

interface Block {
  id: string;
  label: string;
  color: string;
  size: "sm" | "lg";
}

const INITIAL_BLOCKS: Block[] = [
  { id: "a", label: "drag me", color: "#ff2d42", size: "lg" },
  { id: "b", label: "React", color: "#1a1416", size: "sm" },
  { id: "c", label: "recolor me →", color: "#1a1416", size: "sm" },
  { id: "d", label: "Three.js", color: "#ff7a00", size: "sm" },
  { id: "e", label: "TypeScript", color: "#1a1416", size: "sm" },
  { id: "f", label: "yours to break", color: "#00e5a0", size: "lg" },
];

export default function Sandbox() {
  const boundsRef = useRef<HTMLDivElement>(null);
  const [blocks, setBlocks] = useState<Block[]>(INITIAL_BLOCKS);
  const [resetKey, setResetKey] = useState(0);

  const osReduced = useReducedMotion();
  const { motion: motionPref } = usePlayground();
  const reduced = osReduced || motionPref === "reduced";
  const showGrid = !reduced;

  const recolor = (id: string, color: string) =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, color } : b)));

  const reset = () => {
    setBlocks(INITIAL_BLOCKS);
    setResetKey((k) => k + 1);
  };

  return (
    <section
      id="sandbox"
      className="relative overflow-hidden bg-black py-32 sm:py-48"
    >
      {showGrid && <CyberneticGrid />}
      {/* readability veil over the shader */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/40" />

      <div className="relative mx-auto max-w-6xl px-6">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-accent">
          05 — Sandbox
        </p>
        <h2 className="max-w-2xl text-4xl font-black uppercase leading-[0.95] tracking-tight text-ink sm:text-6xl">
          This part is yours.
        </h2>
        <p className="mt-5 max-w-xl font-mono text-sm text-ink/60">
          Drag every block. Recolor every block. It resets when you leave — go on,
          make a mess. (Live WebGL grid, drag physics, and per-element theming — a
          little proof of what I build.)
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-6 border border-ink/30 px-5 py-2 font-mono text-xs uppercase tracking-[0.15em] text-ink/70 transition-colors hover:border-accent hover:text-accent"
        >
          Reset layout
        </button>

        {/* Drag arena */}
        <div
          ref={boundsRef}
          className="relative mt-10 h-[440px] w-full rounded-xl border border-ink/10"
        >
          {blocks.map((block, i) => (
            <motion.div
              key={`${block.id}-${resetKey}`}
              drag
              dragConstraints={boundsRef}
              dragMomentum={false}
              dragElastic={0.12}
              whileDrag={{ scale: 1.06, zIndex: 40 }}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`group absolute flex cursor-grab select-none items-center justify-center rounded-lg font-mono uppercase tracking-wide text-white shadow-lg active:cursor-grabbing ${
                block.size === "lg"
                  ? "h-28 w-52 text-lg"
                  : "h-16 w-36 text-xs"
              }`}
              style={{
                backgroundColor: block.color,
                left: `${8 + (i % 3) * 30}%`,
                top: `${10 + Math.floor(i / 3) * 45}%`,
              }}
            >
              {block.label}
              {/* per-block color control */}
              <label
                className="absolute right-2 top-2 h-4 w-4 cursor-pointer rounded-full border border-white/50 opacity-0 transition-opacity group-hover:opacity-100"
                style={{ backgroundColor: block.color }}
                onPointerDown={(e) => e.stopPropagation()}
                title="Recolor this block"
              >
                <input
                  type="color"
                  value={block.color}
                  onChange={(e) => recolor(block.id, e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label={`Recolor ${block.label}`}
                />
              </label>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
