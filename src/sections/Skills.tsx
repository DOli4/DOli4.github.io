import { motion } from "framer-motion";
import siteContent from "../content/site";

/**
 * SKILLS — luxury / corporate style (à la a premium product landing page).
 * Generous whitespace, hairline rules, refined type. Each group SWIPES IN:
 * a left-to-right clip-path wipe with a sweeping accent bar, revealing the
 * row like a high-end product reveal.
 */

function SwipeRow({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      {/* sweeping accent bar */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 z-10 w-full bg-accent"
        initial={{ scaleX: 0, originX: 0 }}
        whileInView={{ scaleX: [0, 1, 0], originX: [0, 0, 1] }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.9, delay: index * 0.12, ease: [0.7, 0, 0.3, 1] }}
        style={{ transformOrigin: "left" }}
      />
      {/* content wipes in behind the bar */}
      <motion.div
        initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}
        whileInView={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7, delay: index * 0.12 + 0.25, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default function Skills() {
  const groups = siteContent.skills;

  return (
    <section id="skills" className="mx-auto w-full max-w-6xl px-6 py-40 sm:py-56">
      <div className="mb-20 max-w-3xl">
        <p className="mb-6 font-mono text-xs uppercase tracking-[0.4em] text-accent">
          02 — Capabilities
        </p>
        <h2 className="text-4xl font-light leading-tight tracking-tight text-ink sm:text-6xl">
          Engineered across the stack, <span className="italic text-ink/50">crafted</span> on the
          front.
        </h2>
      </div>

      <div className="divide-y divide-ink/10 border-y border-ink/10">
        {groups.map((group, i) => (
          <SwipeRow key={group.heading} index={i}>
            <div className="grid grid-cols-1 gap-6 py-12 md:grid-cols-[280px_1fr] md:gap-16">
              <div className="flex items-start gap-4">
                <span className="font-mono text-xs text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3
                  className={`tracking-tight text-ink ${
                    group.lead ? "text-2xl font-medium sm:text-3xl" : "text-xl font-light"
                  }`}
                >
                  {group.heading}
                </h3>
              </div>
              <ul className="flex flex-wrap gap-x-8 gap-y-3">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="text-base font-light text-ink/70 transition-colors hover:text-ink"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </SwipeRow>
        ))}
      </div>
    </section>
  );
}
