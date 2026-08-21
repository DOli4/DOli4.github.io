"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wand2,
} from "lucide-react";
import { profile } from "../content";
import "./studio.css";

gsap.registerPlugin(ScrollTrigger);


// The "shop" — websites you can buy, packaged as products. Each mini preview is
// a CSS browser mock tinted with the product's accent, so the card reads as a
// website rather than a stock photo.
const shop = [
  { name: "The Landing", cat: "One-pager", price: "On request",
    blurb: "One page, all conversion. A single sharp story that turns visitors into customers.", accent: "#2f7d4f", featured: false },
  { name: "The Portfolio", cat: "Showcase", price: "On request",
    blurb: "Your work, framed like art. A gallery that makes people stop and stare.", accent: "#2f6f6a", featured: false },
  { name: "The Storefront", cat: "E-commerce", price: "On request",
    blurb: "Commerce that closes. A store built to sell — fast and frictionless.", accent: "#8a3b2e", featured: false },
  { name: "The Web App", cat: "Product", price: "On request",
    blurb: "A real product, built to scale. React + TypeScript, engineered to last.", accent: "#3a4a8a", featured: false },
  { name: "The Bespoke", cat: "Anything", price: "On request",
    blurb: "Anything you can wish for. You dream it, I build it — no template, no limits.", accent: "#a9791b", featured: true },
];

const spells = [
  { k: "01", t: "The brief", d: "We talk. I learn your goal, your audience, and exactly what winning looks like." },
  { k: "02", t: "The sketch", d: "A distinctive direction, then high-fidelity screens you can feel — not just approve." },
  { k: "03", t: "The build", d: "Pixel-perfect, accessible, fast front-end — the design shipped exactly as drawn." },
  { k: "04", t: "The reveal", d: "Launched, tuned and handed over, with everything documented to grow on." },
];

// Full-bleed image bands — the photo is the background, the words sit on top.
const bands = [
  { img: "/work/car.webp", eyebrow: "Performance", h: "Fast, and built to last.",
    sub: "Optimised, accessible, and engineered to perform under pressure.", credit: "Image by Cash Macanaya" },
  { img: "/work/ocean.webp", eyebrow: "Resilience", h: "Calm under load.",
    sub: "Smooth when the traffic surges — resilient by design.", credit: "Image by Callum Mullin" },
  { img: "/work/glass.webp", eyebrow: "Craft", h: "Crafted, not assembled.",
    sub: "Shaped by hand, detail by detail. No templates, ever.", credit: "Image by Resource Database" },
];

const promises = [
  { t: "Custom, always", d: "No templates, no page-builders. Every site is designed and coded from a blank page — yours alone." },
  { t: "Fast by default", d: "Optimised bundles, real accessibility, Core Web Vitals in the green. Speed is a feature." },
  { t: "Motion with meaning", d: "Considered animation that guides the eye and earns the word premium — never decoration for its own sake." },
  { t: "One pair of hands", d: "Design and build, front to back. Nothing lost in translation between a designer and a dev." },
];

/** A single hero-style image stage you flip through (RIVR-ish), the words
 *  and glass cards laid over the photo — not three photos stacked. */
function WorkShowcase({ mail }: { mail: (s: string) => string }) {
  const [i, setI] = useState(0);
  const total = bands.length;
  const cur = bands[i];
  const go = (d: number) => setI((p) => (p + d + total) % total);
  const photographer = cur.credit.replace(/^Image by\s*/, "");

  return (
    <div className="st-show">
      <div className="st-show-stage" style={{ backgroundImage: `url(${cur.img})` }}>
        <button className="st-show-arrow st-show-prev" onClick={() => go(-1)} aria-label="Previous image">
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <button className="st-show-arrow st-show-next" onClick={() => go(1)} aria-label="Next image">
          <ChevronRight className="size-5" aria-hidden />
        </button>

        <div className="st-show-center" key={i}>
          <span className="st-show-pill">
            <Sparkles className="size-3.5" aria-hidden /> {cur.eyebrow}
          </span>
          <h3 className="st-show-h">{cur.h}</h3>
          <p className="st-show-sub">{cur.sub}</p>
        </div>

        <div className="st-show-card st-show-card-l">
          <strong>22</strong>
          <span>distinctions</span>
          <a className="st-show-cardbtn" href={mail("Website commission")}>
            <ArrowUpRight className="size-3.5" aria-hidden /> Commission
          </a>
        </div>
        <div className="st-show-card st-show-card-r" key={photographer}>
          <span>Photograph</span>
          <strong>{photographer}</strong>
        </div>

        <div className="st-show-dots">
          {bands.map((_, k) => (
            <button
              key={k}
              className={k === i ? "is-on" : ""}
              onClick={() => setI(k)}
              aria-label={`Image ${k + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Studio() {
  const root = useRef<HTMLDivElement>(null);

  // Pressing "Choose" retints the whole page to that product's accent — a live
  // preview of the look. Deriving lighter/darker shades via color-mix.
  const applyTheme = (accent: string) => {
    const el = root.current;
    if (!el) return;
    el.style.setProperty("--gold", accent);
    el.style.setProperty("--gold-2", `color-mix(in srgb, ${accent} 66%, white)`);
    el.style.setProperty("--gold-ink", `color-mix(in srgb, ${accent} 82%, black)`);
  };

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
              I design and build custom websites from scratch — anything you can
              imagine, made to look expensive and load fast.
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

        {/* SHOP */}
        <section id="st-shop" className="st-section">
          <header className="st-sec-head" data-reveal>
            <span className="st-sec-num">01 — The shop</span>
            <h2 className="st-h2">Choose your build.</h2>
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
                    <button
                      type="button"
                      className="st-choose"
                      onClick={() => applyTheme(p.accent)}
                      title="Preview this look across the site"
                    >
                      Choose
                      <ArrowUpRight className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* PROCESS */}
        <section id="st-process" className="st-section">
          <header className="st-sec-head" data-reveal>
            <span className="st-sec-num">02 — How it works</span>
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

        {/* WORK — one image stage you flip through, words over the photo */}
        <section id="st-work" className="st-section">
          <header className="st-sec-head" data-reveal>
            <span className="st-sec-num">03 — Selected work</span>
            <h2 className="st-h2">A look that reads as expensive.</h2>
          </header>
          <div data-reveal>
            <WorkShowcase mail={mail} />
          </div>
        </section>

        {/* PROMISE */}
        <section id="st-promise" className="st-section">
          <header className="st-sec-head" data-reveal>
            <span className="st-sec-num">04 — The promise</span>
            <h2 className="st-h2">Why work with me.</h2>
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
          <h2 className="st-final-h">Ready to build something?</h2>
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
          <span>© {new Date().getFullYear()} Dieter Olivier — built from scratch</span>
          <a href="#/">Back to CV</a>
        </footer>
      </main>
    </div>
  );
}
