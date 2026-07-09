import { motion } from "framer-motion";
import siteContent from "../content/site";

/**
 * EXPERIENCE — corporate / vertical-timeline style. The most conventional,
 * trust-building segment: a clean spine with accent nodes, each accomplishment
 * revealing in sequence. Anonymized per the confidentiality rules.
 */
export default function Experience() {
  const items = siteContent.experience;

  return (
    <section id="experience" className="mx-auto w-full max-w-3xl px-6 py-28 sm:py-36">
      <div className="mb-14 flex items-baseline justify-between">
        <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          What I Do
        </h2>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">04</p>
      </div>

      <ol className="relative border-l border-ink/15 pl-8">
        {items.map((item, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.45, delay: i * 0.05, ease: "easeOut" }}
            className="relative mb-9 last:mb-0"
          >
            <span className="absolute -left-[41px] top-1.5 h-3 w-3 rounded-full border-2 border-base bg-accent" />
            <p className="text-base leading-relaxed text-ink/80">{item}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
