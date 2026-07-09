import { motion } from "framer-motion";
import siteContent from "../content/site";
import FlowShader from "../components/FlowShader";
import useReducedMotion from "../hooks/useReducedMotion";
import { usePlayground } from "../playground/ThemeContext";

/**
 * CONTACT — the closing segment, over a flowing shader background ("ends with
 * something cool"). Oversized mailto that shifts on hover, with a mono
 * terminal-style callback nodding back to the brutalist opening.
 */
export default function Contact() {
  const { email, linkedin, github } = siteContent.contact;
  const osReduced = useReducedMotion();
  const { motion: motionPref } = usePlayground();
  const reduced = osReduced || motionPref === "reduced";

  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-black py-32 text-center sm:py-52"
    >
      {!reduced && <FlowShader />}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/40" />

      <div className="relative mx-auto max-w-5xl px-6">
        <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-accent">
          06 — Contact
        </p>
        <p className="font-mono text-sm text-white/60">
          <span className="text-accent">&gt;</span> looking for a frontend-leaning full-stack dev?
        </p>

        <motion.a
          href={`mailto:${email}`}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="group mx-auto mt-6 block break-words text-4xl font-black uppercase tracking-tight text-white transition-colors hover:text-accent sm:text-6xl"
        >
          {email}
        </motion.a>

        <div className="mt-14 flex flex-wrap justify-center gap-4 font-mono text-sm uppercase tracking-[0.15em]">
          <a
            href={linkedin}
            target="_blank"
            rel="noreferrer noopener"
            className="border border-white/30 bg-black/30 px-6 py-3 text-white backdrop-blur transition-colors hover:border-accent hover:text-accent"
          >
            LinkedIn
          </a>
          <a
            href={github}
            target="_blank"
            rel="noreferrer noopener"
            className="border border-white/30 bg-black/30 px-6 py-3 text-white backdrop-blur transition-colors hover:border-accent hover:text-accent"
          >
            GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
