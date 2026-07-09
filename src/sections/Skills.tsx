import { motion } from "framer-motion";
import siteContent from "../content/site";

/**
 * SKILLS — clean product / bento-grid style. Deliberately calm and precise
 * after the editorial About: thin borders, generous padding, restrained
 * motion. The lead group (Frontend & Mobile) spans a larger cell.
 */
export default function Skills() {
  const groups = siteContent.skills;

  return (
    <section id="skills" className="mx-auto w-full max-w-6xl px-6 py-28 sm:py-36">
      <div className="mb-14 flex items-baseline justify-between">
        <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Skills
        </h2>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">02</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {groups.map((group, i) => (
          <motion.div
            key={group.heading}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
            className={`rounded-xl border border-ink/10 bg-ink/[0.02] p-6 transition-colors hover:border-accent/40 ${
              group.lead ? "md:col-span-2 md:row-span-1" : ""
            }`}
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <h3 className={`font-medium text-ink ${group.lead ? "text-xl" : "text-base"}`}>
                {group.heading}
              </h3>
            </div>
            <ul className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-ink/10 px-3 py-1.5 font-mono text-xs text-ink/70"
                >
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
