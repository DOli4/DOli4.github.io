import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import siteContent from "../content/site";
import useReducedMotion from "../hooks/useReducedMotion";

const ChromeScene = lazy(() => import("../components/ChromeScene"));

interface ChromeSceneBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ChromeSceneBoundaryState {
  hasError: boolean;
}

/**
 * Suspense only covers the *pending* state of the lazy import — it does not
 * catch thrown errors. Two realistic failure modes bypass it entirely:
 * WebGLRenderer's constructor throwing synchronously (WebGL disabled/
 * blocklisted), and the lazy chunk 404ing after a redeploy invalidates the
 * old hashed URL while a tab is still open. Either would otherwise unmount
 * all the way to the app root and blank the whole page. This boundary keeps
 * a WebGL failure scoped to the hero, degrading to the same static fallback
 * used for reduced-motion/mobile instead.
 */
class ChromeSceneBoundary extends Component<ChromeSceneBoundaryProps, ChromeSceneBoundaryState> {
  state: ChromeSceneBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ChromeSceneBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const MOBILE_BREAKPOINT = 768;

/**
 * True when the viewport is narrower than the mobile breakpoint. Tracked
 * live (resize listener) rather than read once, so rotating a tablet or
 * resizing a desktop window swaps the WebGL scene in/out correctly.
 */
function useIsNarrowViewport(): boolean {
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setIsNarrow(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isNarrow;
}

/** Static red radial-glow gradient, used when WebGL is skipped. */
function StaticGlowFallback() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 60% 55% at 65% 45%, rgba(255,45,66,0.35), rgba(255,45,66,0.08) 45%, transparent 70%)",
      }}
    />
  );
}

const nameGlitch = {
  hidden: { opacity: 0, x: -6, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const isNarrowViewport = useIsNarrowViewport();
  const useStaticFallback = prefersReducedMotion || isNarrowViewport;

  return (
    <section
      id="hero"
      className="relative flex min-h-screen w-full items-center overflow-hidden bg-base"
    >
      <div aria-hidden="true" className="absolute inset-0">
        {useStaticFallback ? (
          <StaticGlowFallback />
        ) : (
          <ChromeSceneBoundary fallback={<StaticGlowFallback />}>
            <Suspense fallback={<StaticGlowFallback />}>
              <ChromeScene />
            </Suspense>
          </ChromeSceneBoundary>
        )}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
          {siteContent.role} · frontend-leaning · {siteContent.location}
        </p>

        {prefersReducedMotion ? (
          <h1 className="mt-6 text-5xl font-black uppercase leading-[0.9] tracking-tight text-accent sm:text-7xl md:text-8xl">
            {siteContent.name}
          </h1>
        ) : (
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={nameGlitch}
            className="mt-6 text-5xl font-black uppercase leading-[0.9] tracking-tight text-accent sm:text-7xl md:text-8xl"
          >
            {siteContent.name}
          </motion.h1>
        )}

        <p className="mt-8 max-w-xl border-l-2 border-accent pl-4 text-lg text-ink/85 sm:text-xl">
          {siteContent.hook}
        </p>

        <div className="mt-10 flex flex-wrap gap-4 font-mono text-sm uppercase tracking-[0.15em]">
          <a
            href="#work"
            className="border border-accent px-6 py-3 text-ink transition-colors hover:bg-accent hover:text-base"
          >
            View Work
          </a>
          <a
            href="#contact"
            className="border border-ink/30 px-6 py-3 text-ink transition-colors hover:border-ink hover:text-ink"
          >
            Contact
          </a>
          <a
            href={siteContent.contact.github}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="GitHub (opens in a new tab)"
            className="border border-ink/30 px-6 py-3 text-ink transition-colors hover:border-ink hover:text-ink"
          >
            GitHub
          </a>
        </div>
      </div>
    </section>
  );
}

export default Hero;
