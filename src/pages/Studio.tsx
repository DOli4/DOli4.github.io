"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Gauge,
  Layout,
  Sparkles,
} from "lucide-react";
import { CoverflowCarousel } from "../components/ui/coverflow-carousel";
import { profile } from "../content";
import "./studio.css";

gsap.registerPlugin(ScrollTrigger);

const IMG = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=900&h=900&fit=crop&q=75&auto=format`;

const services = [
  {
    icon: Layout,
    title: "Landing pages",
    body: "Pages that convert — a clear story, one strong call to action, and a first paint that lands in a blink.",
  },
  {
    icon: Boxes,
    title: "Web apps",
    body: "Products that scale — React and TypeScript, componentised and maintainable long after launch day.",
  },
  {
    icon: Sparkles,
    title: "Design systems",
    body: "One consistent language — tokens, reusable components and docs, so the tenth screen looks like the first.",
  },
  {
    icon: Gauge,
    title: "Performance & SEO",
    body: "Fast, found, flawless — optimised bundles, real accessibility, and Core Web Vitals in the green.",
  },
];

const work = [
  { src: IMG("1441974231531-c6227db76b6e"), alt: "Editorial brand site", title: "Lumen", subtitle: "Editorial studio" },
  { src: IMG("1500534314209-a25ddb2bd429"), alt: "Product marketplace", title: "Carza", subtitle: "Car marketplace" },
  { src: IMG("1519681393784-d120267933ba"), alt: "Luxury landing page", title: "Aurora", subtitle: "Luxury rental" },
  { src: IMG("1470071459604-3b5ec3a7fe05"), alt: "Fintech dashboard", title: "Meridian", subtitle: "Fintech dashboard" },
  { src: IMG("1465101162946-4377e57745c3"), alt: "Fashion lookbook", title: "Vanta", subtitle: "Fashion lookbook" },
  { src: IMG("1493246507139-91e8fad9978e"), alt: "Wellness brand", title: "Halo", subtitle: "Wellness brand" },
];

const steps = [
  { k: "01", t: "Discover", d: "We pin down the goal, the audience and what a win looks like — before a single pixel." },
  { k: "02", t: "Design", d: "A distinctive direction, then high-fidelity screens you can feel, not just approve." },
  { k: "03", t: "Build", d: "Clean, accessible, fast front-end — the design shipped exactly as drawn." },
  { k: "04", t: "Launch", d: "Measured, tuned and handed over — with everything documented to grow on." },
];

const logos = ["AETHER", "NORDIC", "LUMEN", "VANTA", "MERIDIAN", "HALO"];

export default function Studio() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 42,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((el) => {
        gsap.from(el.children, {
          y: 28,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 82%" },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const mail = `mailto:${profile.email}?subject=Website%20project`;

  return (
    <div className="studio-page" ref={root}>
      <div className="st-bg" aria-hidden />

      <header className="st-nav">
        <a className="st-brand" href="#/studio">
          Dieter Olivier
          <span className="st-brand-tag">STUDIO</span>
        </a>
        <nav className="st-links" aria-label="Sections">
          <a href="#st-services">Services</a>
          <a href="#st-work">Work</a>
          <a href="#st-process">Process</a>
        </nav>
        <div className="st-nav-actions">
          <a className="st-back" href="#/">Back to CV</a>
          <a className="st-pill st-pill-dark" href={mail}>
            Get in touch
          </a>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="st-hero">
          <div className="st-hero-copy">
            <p className="st-eyebrow" data-reveal>
              Web design &amp; development
            </p>
            <h1 className="st-h1" data-reveal>
              Websites that make you the <em>obvious</em> choice.
            </h1>
            <p className="st-lede" data-reveal>
              I design and build fast, refined websites that turn visitors into
              customers — from the first pixel to production.
            </p>
            <div className="st-hero-cta" data-reveal>
              <a className="st-pill st-pill-dark" href={mail}>
                Start a project
                <ArrowRight className="size-4" aria-hidden />
              </a>
              <a className="st-pill st-pill-ghost" href="#st-work">
                See the work
              </a>
            </div>
            <div className="st-hero-meta" data-reveal>
              <div>
                <strong>22</strong>
                <span>distinctions</span>
              </div>
              <div>
                <strong>Full-stack</strong>
                <span>design &amp; build</span>
              </div>
              <div>
                <strong>Production</strong>
                <span>shipped daily</span>
              </div>
            </div>
          </div>

          <div className="st-hero-visual">
            <div className="st-browser" data-float>
              <div className="st-browser-bar">
                <i /><i /><i />
                <span className="st-url">dieterolivier.studio</span>
              </div>
              <div className="st-browser-body">
                <div className="st-mock-nav">
                  <span className="st-mock-logo" />
                  <span className="st-mock-links">
                    <b /><b /><b />
                  </span>
                  <span className="st-mock-cta" />
                </div>
                <div className="st-mock-hero">
                  <div className="st-mock-h1" />
                  <div className="st-mock-h2" />
                  <div className="st-mock-p" />
                  <div className="st-mock-btn" />
                </div>
                <div className="st-mock-orb" />
                <div className="st-mock-card st-mock-card-a" />
                <div className="st-mock-card st-mock-card-b" />
              </div>
            </div>
          </div>
        </section>

        {/* TRUST */}
        <section className="st-trust" data-reveal>
          <p>Built for teams who sweat the details</p>
          <ul className="st-logos" data-stagger>
            {logos.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </section>

        {/* SERVICES */}
        <section id="st-services" className="st-section">
          <header className="st-sec-head" data-reveal>
            <span className="st-sec-num">01 — Services</span>
            <h2 className="st-h2">Everything a great site needs, in one pair of hands.</h2>
          </header>
          <div className="st-grid" data-stagger>
            {services.map((s) => (
              <article className="st-card" key={s.title}>
                <span className="st-card-icon">
                  <s.icon className="size-5" aria-hidden />
                </span>
                <h3 className="st-card-title">{s.title}</h3>
                <p className="st-card-body">{s.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* WORK */}
        <section id="st-work" className="st-section st-work">
          <header className="st-sec-head" data-reveal>
            <span className="st-sec-num">02 — Selected work</span>
            <h2 className="st-h2">A look and feel that reads as expensive.</h2>
          </header>
          <div className="st-work-flow" data-reveal>
            <CoverflowCarousel
              slides={work}
              showCaption
              showNavigation
              showPagination
              cardWidth="clamp(220px, 34vw, 400px)"
              rotate={40}
              label="Selected work"
            />
          </div>
        </section>

        {/* PROCESS */}
        <section id="st-process" className="st-section">
          <header className="st-sec-head" data-reveal>
            <span className="st-sec-num">03 — Process</span>
            <h2 className="st-h2">Calm, considered, and on time.</h2>
          </header>
          <div className="st-steps" data-stagger>
            {steps.map((s) => (
              <article className="st-step" key={s.k}>
                <span className="st-step-k">{s.k}</span>
                <h3 className="st-step-t">{s.t}</h3>
                <p className="st-step-d">{s.d}</p>
              </article>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="st-final" data-reveal>
          <h2 className="st-final-h">Let&rsquo;s build something worth bookmarking.</h2>
          <p className="st-final-p">
            Have a project in mind? I&rsquo;d love to hear about it.
          </p>
          <a className="st-pill st-pill-dark st-pill-lg" href={mail}>
            Get in touch
            <ArrowUpRight className="size-5" aria-hidden />
          </a>
        </section>

        <footer className="st-foot">
          <span>© {new Date().getFullYear()} Dieter Olivier — designed &amp; built from scratch</span>
          <a href="#/">Back to CV</a>
        </footer>
      </main>
    </div>
  );
}
