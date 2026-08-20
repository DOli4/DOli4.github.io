"use client";

import { useEffect } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Mail } from "lucide-react";
import { capabilities, profile } from "../content";
import { useHireSlug } from "../router";
import "./hire.css";

/**
 * The corporate "what you get if you hire me" screen (#/hire/<slug>). A clean,
 * white, professional world — a deliberate contrast to the dark CV — reached
 * from the coverflow preview on the CV page. Each capability is its own URL.
 */
export default function Hire() {
  const slug = useHireSlug();
  const found = capabilities.findIndex((c) => c.slug === slug);
  const index = found < 0 ? 0 : found;
  const cap = capabilities[index];
  const total = capabilities.length;

  const go = (i: number) => {
    const n = ((i % total) + total) % total;
    window.location.hash = `#/hire/${capabilities[n].slug}`;
  };

  // Land at the top when the capability changes.
  useEffect(() => {
    document.querySelector(".hire-screen")?.scrollTo(0, 0);
  }, [index]);

  return (
    <div className="hire-screen">
      <header className="hire-top">
        <a href="#/" className="hire-back">
          <ArrowLeft className="size-4" aria-hidden />
          Back to CV
        </a>
        <span className="hire-brand">{profile.name}</span>
      </header>

      <main className="hire-main">
        <p className="hire-kicker">What you get</p>
        <h1 className="hire-title">Hire me — here's what lands.</h1>
        <p className="hire-lede">
          Five things I bring to a team from the first commit. Take a look at
          any of them.
        </p>

        <nav className="hire-pills" aria-label="Capabilities">
          {capabilities.map((c, i) => (
            <button
              key={c.slug}
              type="button"
              className={`hire-pill${i === index ? " is-on" : ""}`}
              aria-current={i === index}
              onClick={() => go(i)}
            >
              {c.title}
            </button>
          ))}
        </nav>

        <section className="hire-detail" key={cap.slug}>
          <div className="hire-copy">
            <p className="hire-cap-sub">{cap.subtitle}</p>
            <h2 className="hire-cap-title">{cap.title}</h2>
            <p className="hire-cap-pitch">{cap.pitch}</p>
            <ul className="hire-points">
              {cap.points.map((p) => (
                <li key={p}>
                  <Check className="size-4" aria-hidden />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <div className="hire-nav">
              <button type="button" className="hire-navbtn" onClick={() => go(index - 1)}>
                <ArrowLeft className="size-4" aria-hidden />
                Prev
              </button>
              <span className="hire-count">
                {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
              <button type="button" className="hire-navbtn" onClick={() => go(index + 1)}>
                Next
                <ArrowRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="hire-visual">
            <img src={cap.image} alt="" className="hire-img" loading="lazy" />
          </div>
        </section>

        <section className="hire-cta">
          <h3 className="hire-cta-title">Like what you see?</h3>
          <p className="hire-cta-sub">
            I'm available for remote, hybrid or on-site work.
          </p>
          <div className="hire-cta-actions">
            <a className="hire-btn hire-btn-primary" href={`mailto:${profile.email}`}>
              <Mail className="size-4" aria-hidden />
              Get in touch
            </a>
            <a className="hire-btn" href={profile.linkedin.url} target="_blank" rel="noreferrer">
              LinkedIn
              <ArrowUpRight className="size-4" aria-hidden />
            </a>
            <a className="hire-btn" href={profile.github.url} target="_blank" rel="noreferrer">
              GitHub
              <ArrowUpRight className="size-4" aria-hidden />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
