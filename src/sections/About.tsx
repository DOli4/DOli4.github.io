import { motion } from "framer-motion";
import siteContent from "../content/site";

/**
 * ABOUT — editorial / kinetic-typography style. The bridge out of the
 * brutalist hero into something more composed: oversized lead statement
 * that reveals word-by-word on scroll, then a drop-cap body paragraph.
 */
const LEAD = "Full-stack developer who leans frontend.";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const word = {
  hidden: { opacity: 0, y: "0.4em" },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function About() {
  return (
    <section id="about" className="relative mx-auto w-full max-w-5xl px-6 py-28 sm:py-40">
      <p className="mb-10 font-mono text-xs uppercase tracking-[0.3em] text-accent">
        01 — About
      </p>

      <motion.h2
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        className="max-w-4xl text-4xl font-light leading-[1.1] tracking-tight text-ink sm:text-6xl"
      >
        {LEAD.split(" ").map((w, i) => (
          <motion.span key={i} variants={word} className="mr-[0.25em] inline-block">
            {w}
          </motion.span>
        ))}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="mt-12 max-w-2xl text-lg leading-relaxed text-ink/70 [&::first-letter]:float-left [&::first-letter]:mr-3 [&::first-letter]:font-serif [&::first-letter]:text-6xl [&::first-letter]:font-bold [&::first-letter]:leading-[0.8] [&::first-letter]:text-accent"
      >
        {siteContent.about}
      </motion.p>

      <p className="mt-10 font-mono text-sm text-ink/50">{siteContent.location}</p>
    </section>
  );
}
