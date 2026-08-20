"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, ArrowUpRight, Check, Sparkles, Wand2 } from "lucide-react";
import { CoverflowCarousel } from "../components/ui/coverflow-carousel";
import { profile } from "../content";
import "./studio.css";

gsap.registerPlugin(ScrollTrigger);


// The "shop" — websites you can buy, packaged as products. Each mini preview is
// a CSS browser mock tinted with the product's accent, so the card reads as a
// website rather than a stock photo.
const shop = [
  { name: "The Landing", cat: "One-pager", price: "On request",
    blurb: "One page, all conversion. A single sharp story that turns visitors into customers.", accent: "#a9791b", featured: false },
  { name: "The Portfolio", cat: "Showcase", price: "On request",
    blurb: "Your work, framed like art. A gallery that makes people stop and stare.", accent: "#2f6f6a", featured: false },
  { name: "The Storefront", cat: "E-commerce", price: "On request",
    blurb: "Commerce that closes. A store built to sell — fast and frictionless.", accent: "#8a3b2e", featured: false },
  { name: "The Web App", cat: "Product", price: "On request",
    blurb: "A real product, built to scale. React + TypeScript, engineered to last.", accent: "#3a4a8a", featured: false },
  { name: "The Bespoke", cat: "Anything", price: "On request",
    blurb: "Anything you can wish for. You dream it, I conjure it — no template, no limits.", accent: "#a9791b", featured: true },
];

const spells = [
  { k: "01", t: "The brief", d: "We talk. I learn your goal, your audience, and exactly what winning looks like." },
  { k: "02", t: "The sketch", d: "A distinctive direction, then high-fidelity screens you can feel — not just approve." },
  { k: "03", t: "The build", d: "Pixel-perfect, accessible, fast front-end — the design shipped exactly as drawn." },
  { k: "04", t: "The reveal", d: "Launched, tuned and handed over, with everything documented to grow on." },
];

const work = [
  { src: "/work/car.webp", alt: "Widebody sports car under studio light", title: "Momentum", subtitle: "Image by Cash Macanaya" },
  { src: "/work/ocean.webp", alt: "Golden-hour ocean waves", title: "Tide", subtitle: "Image by Callum Mullin" },
  { src: "/work/glass.webp", alt: "Sculptural glass form", title: "Prism", subtitle: "Image by Resource Database" },
];

const promises = [
  { t: "Custom, always", d: "No templates, no page-builders. Every site is designed and coded from a blank page — yours alone." },
  { t: "Fast by default", d: "Optimised bundles, real accessibility, Core Web Vitals in the green. Speed is a feature." },
  { t: "Motion with meaning", d: "Considered animation that guides the eye and earns the word premium — never decoration for its own sake." },
  { t: "One pair of hands", d: "Design and build, front to back. Nothing lost in translation between a designer and a dev." },
];

export default function Studio() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;

    // This page is a position:fixed scroll container, so ScrollTrigger must be
    // told to watch IT — not the window, which never scrolls here.
    const scroller = root.current;
    const ctx = gsap.context(() => {
      if (reduce) return; // leave everything at rest, fully visible
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 42, opacity: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", scroller },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((el) => {
        gsap.from(el.children, {
          y: 30, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 84%", scroller },
        });
      });
    }, root);

    // Count-up for the stat numbers, once, when they scroll in.
    const counters = Array.from(
      root.current?.querySelectorAll<HTMLElement>("[data-count]") ?? [],
    );
    let io: IntersectionObserver | null = null;
    if (reduce) {
      counters.forEach((el) => { el.textContent = String(el.dataset.count); });
    } else {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          io?.unobserve(el);
          const to = Number(el.dataset.count);
          const t0 = performance.now();
          const tick = (now: number) => {
            if (cancelled) return;
            const p = Math.min(1, (now - t0) / 1100);
            el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      }, { threshold: 0.6 });
      counters.forEach((el) => io?.observe(el));
    }

    return () => { cancelled = true; ctx.revert(); io?.disconnect(); };
  }, []);

  const mail = (subject: string) =>
    `mailto:${profile.email}?subject=${encodeURIComponent(subject)}`;

  return (
    <div className="studio-page" ref={root}>
      <header className="st-nav">
        <a className="st-brand" href="#/studio">
          Dieter Olivier
          <span className="st-brand-tag">ATELIER</span>
        </a>
        <nav className="st-links" aria-label="Sections">
          <a href="#st-shop">Shop</a>
          <a href="#st-work">Work</a>
          <a href="#st-process">Process</a>
          <a href="#st-promise">Why me</a>
        </nav>
        <div className="st-nav-actions">
          <a className="st-back" href="#/">Back to CV</a>
          <a className="st-pill st-pill-navy" href={mail("Website commission")}>
            Commission
          </a>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="st-hero">
          <span className="st-spark st-spark-1" aria-hidden>✦</span>
          <span className="st-spark st-spark-2" aria-hidden>✦</span>
          <span className="st-spark st-spark-3" aria-hidden>✦</span>

          <div className="st-hero-copy">
            <p className="st-eyebrow" data-reveal>
              <Sparkles className="size-3.5" aria-hidden /> UI &amp; UX development
            </p>
            <h1 className="st-h1" data-reveal>
              Websites with UI &amp; UX <em>development.</em>
            </h1>
            <p className="st-lede" data-reveal>
              I conjure custom websites from scratch — anything you can dream up.
              Code is magic, after all. Consider me your magician.
            </p>
            <div className="st-hero-cta" data-reveal>
              <a className="st-pill st-pill-navy" href="#st-shop">
                Browse the shop
                <ArrowRight className="size-4" aria-hidden />
              </a>
              <a className="st-pill st-pill-ghost" href={mail("Website commission")}>
                <Wand2 className="size-4" aria-hidden />
                Commission a site
              </a>
            </div>
            <div className="st-hero-meta" data-reveal>
              <div><strong>100% custom</strong><span>no templates</span></div>
              <div><strong>Design + build</strong><span>one pair of hands</span></div>
              <div><strong>Fast</strong><span>vitals in the green</span></div>
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
                  <span className="st-mock-links"><b /><b /><b /></span>
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

        {/* MARQUEE */}
        <div className="st-marquee" aria-hidden>
          <div className="st-marquee-track">
            {Array.from({ length: 2 }).map((_, k) => (
              <span key={k}>
                Landing pages <b>✦</b> Web apps <b>✦</b> E-commerce <b>✦</b> Design systems
                <b>✦</b> Animation <b>✦</b> SEO <b>✦</b> Brand sites <b>✦</b>
              </span>
            ))}
          </div>
        </div>

        {/* SHOP */}
        <section id="st-shop" className="st-section">
          <header className="st-sec-head" data-reveal>
            <span className="st-sec-num">01 — The shop</span>
            <h2 className="st-h2">Pick your spell.</h2>
            <p className="st-sec-lede">
              Websites, packaged. Choose one — or commission something entirely
              your own.
            </p>
          </header>
          <div className="st-shop-grid" data-stagger>
            {shop.map((p) => (
              <article
                key={p.name}
                className={`st-product${p.featured ? " is-featured" : ""}`}
                style={{ ["--pa" as string]: p.accent }}
              >
                <div className="st-product-preview">
                  <span className="st-mini-bar"><i /><i /><i /></span>
                  <span className="st-mini-h" />
                  <span className="st-mini-p" />
                  <span className="st-mini-btn" />
                  <span className="st-mini-orb" />
                  {p.featured && (
                    <span className="st-mini-badge">
                      <Wand2 className="size-3.5" aria-hidden /> bespoke
                    </span>
                  )}
                </div>
                <div className="st-product-body">
                  <span className="st-product-cat">{p.cat}</span>
                  <h3 className="st-product-name">{p.name}</h3>
                  <p className="st-product-blurb">{p.blurb}</p>
                  <div className="st-product-foot">
                    <span className="st-product-price">{p.price}</span>
                    <a className="st-choose" href={mail(`Website: ${p.name}`)}>
                      Choose
                      <ArrowUpRight className="size-4" aria-hidden />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* PROCESS */}
        <section id="st-process" className="st-section">
          <header className="st-sec-head" data-reveal>
            <span className="st-sec-num">02 — How the magic works</span>
            <h2 className="st-h2">Four moves, no smoke.</h2>
          </header>
          <div className="st-steps" data-stagger>
            {spells.map((s) => (
              <article className="st-step" key={s.k}>
                <span className="st-step-k">{s.k}</span>
                <h3 className="st-step-t">{s.t}</h3>
                <p className="st-step-d">{s.d}</p>
              </article>
            ))}
          </div>
        </section>

        {/* WORK */}
        <section id="st-work" className="st-section st-work">
          <header className="st-sec-head" data-reveal>
            <span className="st-sec-num">03 — The spellbook</span>
            <h2 className="st-h2">A look that reads as expensive.</h2>
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

        {/* PROMISE */}
        <section id="st-promise" className="st-section">
          <header className="st-sec-head" data-reveal>
            <span className="st-sec-num">04 — The promise</span>
            <h2 className="st-h2">Why hand it to a magician.</h2>
          </header>
          <div className="st-promise-grid" data-stagger>
            {promises.map((p) => (
              <article className="st-promise-card" key={p.t}>
                <span className="st-promise-mark"><Check className="size-4" aria-hidden /></span>
                <h3 className="st-promise-t">{p.t}</h3>
                <p className="st-promise-d">{p.d}</p>
              </article>
            ))}
          </div>
        </section>

        {/* STATS */}
        <section className="st-stats" data-reveal>
          <div className="st-stat">
            <strong><span data-count="22">0</span></strong>
            <span>distinctions earned</span>
          </div>
          <div className="st-stat">
            <strong><span data-count="100">0</span>%</strong>
            <span>custom-coded</span>
          </div>
          <div className="st-stat">
            <strong><span data-count="0">0</span></strong>
            <span>templates used</span>
          </div>
          <div className="st-stat">
            <strong>∞</strong>
            <span>revisions until right</span>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="st-final" data-reveal>
          <span className="st-final-mark" aria-hidden><Sparkles className="size-6" /></span>
          <h2 className="st-final-h">Ready to make magic?</h2>
          <p className="st-final-p">
            Tell me what you want to build. I&rsquo;ll turn it into a website worth
            bookmarking.
          </p>
          <a className="st-pill st-pill-gold st-pill-lg" href={mail("Let's build my website")}>
            Commission your website
            <ArrowUpRight className="size-5" aria-hidden />
          </a>
        </section>

        <footer className="st-foot">
          <span>© {new Date().getFullYear()} Dieter Olivier — conjured from scratch</span>
          <a href="#/">Back to CV</a>
        </footer>
      </main>
    </div>
  );
}
