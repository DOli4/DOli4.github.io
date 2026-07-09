import { motion } from "framer-motion";
import siteContent from "../content/site";

/**
 * CONTACT — playful / interactive send-off. Oversized mailto that fills on
 * hover, with a mono terminal-style callback line nodding back to the
 * brutalist opening. Closes the style journey where it began.
 */
export default function Contact() {
  const { email, linkedin, github } = siteContent.contact;

  return (
    <section id="contact" className="mx-auto w-full max-w-5xl px-6 py-32 sm:py-44 text-center">
      <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-accent">
        06 — Contact
      </p>
      <p className="font-mono text-sm text-ink/50">
        <span className="text-accent">&gt;</span> looking for a frontend-leaning full-stack dev?
      </p>

      <motion.a
        href={`mailto:${email}`}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="group mx-auto mt-6 block break-words text-4xl font-black uppercase tracking-tight text-ink transition-colors hover:text-accent sm:text-6xl"
      >
        {email}
      </motion.a>

      <div className="mt-14 flex flex-wrap justify-center gap-4 font-mono text-sm uppercase tracking-[0.15em]">
        <a
          href={linkedin}
          target="_blank"
          rel="noreferrer noopener"
          className="border border-ink/25 px-6 py-3 text-ink transition-colors hover:border-accent hover:text-accent"
        >
          LinkedIn
        </a>
        <a
          href={github}
          target="_blank"
          rel="noreferrer noopener"
          className="border border-ink/25 px-6 py-3 text-ink transition-colors hover:border-accent hover:text-accent"
        >
          GitHub
        </a>
      </div>
    </section>
  );
}
