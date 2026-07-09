import { motion } from "framer-motion";

/**
 * Infinite scrolling text ticker used as a transition "seam" between
 * segments, so each section reads as its own chapter. Two duplicated tracks
 * translate continuously; MotionConfig freezes it under reduced motion.
 */
export default function Marquee({
  text,
  direction = "left",
  className = "",
}: {
  text: string;
  direction?: "left" | "right";
  className?: string;
}) {
  const items = Array.from({ length: 6 }, (_, i) => i);
  const from = direction === "left" ? "0%" : "-50%";
  const to = direction === "left" ? "-50%" : "0%";

  return (
    <div
      className={`relative flex overflow-hidden border-y border-ink/10 py-5 ${className}`}
      aria-hidden="true"
    >
      <motion.div
        className="flex shrink-0 whitespace-nowrap"
        initial={{ x: from }}
        animate={{ x: to }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        {items.map((i) => (
          <span
            key={`a-${i}`}
            className="mx-8 font-mono text-sm uppercase tracking-[0.3em] text-ink/40"
          >
            {text} <span className="text-accent">/</span>
          </span>
        ))}
      </motion.div>
      <motion.div
        className="absolute left-0 flex shrink-0 whitespace-nowrap"
        initial={{ x: direction === "left" ? "100%" : "50%" }}
        animate={{ x: direction === "left" ? "50%" : "100%" }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        {items.map((i) => (
          <span
            key={`b-${i}`}
            className="mx-8 font-mono text-sm uppercase tracking-[0.3em] text-ink/40"
          >
            {text} <span className="text-accent">/</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
