import { motion } from "framer-motion";
import siteContent from "../content/site";

/**
 * WORK — glassmorphism / showcase style. Frosted, layered cards with depth
 * and an accent glow on hover. The first (flagship) project spans full width
 * as a feature card. Confidential projects get a subtle marker, never a
 * company name.
 */
export default function Work() {
  const [flagship, ...rest] = siteContent.projects;

  return (
    <section
      id="work"
      className="relative mx-auto w-full max-w-6xl px-6 py-28 sm:py-36"
    >
      {/* soft accent aura behind the glass */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
        style={{ background: "rgb(var(--accent))" }}
      />

      <div className="mb-14 flex items-baseline justify-between">
        <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Selected Work
        </h2>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">03</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {flagship && <ProjectCard project={flagship} index={0} featured />}
        {rest.map((project, i) => (
          <ProjectCard key={project.title} project={project} index={i + 1} />
        ))}
      </div>
    </section>
  );
}

function ProjectCard({
  project,
  index,
  featured = false,
}: {
  project: (typeof siteContent.projects)[number];
  index: number;
  featured?: boolean;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, delay: index * 0.07, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      className={`group relative overflow-hidden rounded-2xl border border-ink/10 bg-ink/[0.04] p-7 backdrop-blur-md transition-colors hover:border-accent/50 ${
        featured ? "md:col-span-2" : ""
      }`}
    >
      {/* gradient sheen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent opacity-60"
      />
      <div className="relative">
        <div className="mb-3 flex items-center gap-3">
          <span className="font-mono text-xs text-accent">
            {String(index + 1).padStart(2, "0")}
          </span>
          {project.confidential && (
            <span className="rounded-full border border-ink/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink/40">
              confidential
            </span>
          )}
        </div>
        <h3
          className={`font-semibold tracking-tight text-ink ${
            featured ? "text-2xl sm:text-3xl" : "text-xl"
          }`}
        >
          {project.title}
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/60">
          {project.blurb}
        </p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-md bg-accent/10 px-2.5 py-1 font-mono text-[11px] text-accent"
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
}
