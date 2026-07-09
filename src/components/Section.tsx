import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface SectionProps {
  id: string;
  title?: string;
  children: ReactNode;
}

/**
 * Reusable page section: semantic <section>, centered max-width
 * container, and a scroll-triggered fade/rise reveal via Framer Motion.
 * `whileInView` + `viewport={{ once: true }}` animates opacity/transform.
 * Framer Motion drives this with JS (not CSS transitions), so the global
 * `prefers-reduced-motion` CSS rule in src/index.css can't reach it —
 * `useReducedMotion` is used here to swap in a no-op animation instead.
 */
function Section({ id, title, children }: SectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const hidden = prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 };
  const visible = { opacity: 1, y: 0 };

  return (
    <motion.section
      id={id}
      className="mx-auto w-full max-w-4xl px-6 py-24 sm:py-32"
      initial={hidden}
      whileInView={visible}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: "easeOut" }}
    >
      {title && (
        <header className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            {id}
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {title}
          </h2>
        </header>
      )}
      {children}
    </motion.section>
  );
}

export default Section;
