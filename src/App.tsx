import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AnomalousMatter from "./components/AnomalousMatter";
import GlitchText from "./components/GlitchText";
import ThermodynamicGrid from "./components/ui/interactive-thermodynamic-grid";
import { CircularCarousel } from "./components/ui/circular-carousel";
import { FlipDiskMatrix } from "./components/ui/flip-disk-matrix";
import { about, skills, projects, profile } from "./content";

gsap.registerPlugin(ScrollTrigger);

// Static — hoisted so a re-render can't hand FlipDiskMatrix a new array
// reference and restart the flip animation.
const STUDIO_WORDS = ["BUILD", "PROFESSIONAL", "LOOKING", "WEBSITES"];

export default function App() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Reveal each [data-reveal] block as it enters — staggered, spring-ish ease.
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 40,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });
      // Stagger children of [data-stagger].
      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((el) => {
        gsap.from(el.children, {
          y: 24,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.06,
          scrollTrigger: { trigger: el, start: "top 80%" },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root}>
      <AnomalousMatter />

      {/* The top chrome and the cursor now live in main.tsx, shared by all
          three pages. Only the CV page's own furniture stays here. */}

      <div className="rail rail-left">
        <a href={profile.github.url} target="_blank" rel="noreferrer" data-hover>
          GitHub
        </a>
        <a href={profile.linkedin.url} target="_blank" rel="noreferrer" data-hover>
          LinkedIn
        </a>
      </div>
      <div className="rail rail-right">
        <span>ANOMALY</span>
        <span className="rail-line" />
        <span>2026</span>
      </div>

      <main id="top">
        {/* HERO — the object owns the void */}
        <header className="hero-x">
          <div className="wrap hero-x-inner">
            <p className="tag" data-reveal>
              SOFTWARE DEVELOPER · ANOMALY-CLASS
            </p>
            <h1 className="hero-x-title" data-reveal>
              <GlitchText>DIETER</GlitchText>
              <span className="hero-x-frame">
                <GlitchText>OLIVIER</GlitchText>
              </span>
            </h1>
            <p className="hero-x-sub" data-reveal>
              {profile.tagline}
            </p>
          </div>
          <div className="hero-x-scroll tag tag-dim">
            SCROLL TO DESCEND <span className="hero-x-arrow">↓</span>
          </div>
        </header>

        {/* ABOUT */}
        <section id="about" className="section panel">
          <div className="wrap">
            <div className="sec-head" data-reveal>
              <span className="section-num">01 — SIGNAL</span>
              <h2 className="sec-title">
                <GlitchText>About</GlitchText>
              </h2>
            </div>
            <div className="about-grid" data-reveal>
              <div className="about-copy">
                {about.map((p, i) => (
                  <p key={i} className="about-p">
                    {p}
                  </p>
                ))}
              </div>
              <ul className="spec">
                <li>
                  <span className="tag tag-dim">ROLE</span>
                  <span>Full-stack · frontend-leaning</span>
                </li>
                <li>
                  <span className="tag tag-dim">LOCATION</span>
                  <span>{profile.location}</span>
                </li>
                <li>
                  <span className="tag tag-dim">STACK</span>
                  <span>React · RN · TypeScript · Java</span>
                </li>
                <li>
                  <span className="tag tag-dim">STATUS</span>
                  <span className="ok">Available for good work</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SKILLS */}
        <section id="skills" className="section panel">
          <div className="wrap">
            <div className="sec-head" data-reveal>
              <span className="section-num">02 — CAPABILITIES</span>
              <h2 className="sec-title">
                <GlitchText>Skills</GlitchText>
              </h2>
            </div>
            <div className="skill-matrix" data-stagger>
              {skills.map((group, i) => (
                <div className="skill-cell" key={group.title} data-hover>
                  <span className="skill-idx tag">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="skill-h">{group.title}</h3>
                  <ul className="skill-list">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRON zone — object goes cyan, interactive grid ignites */}
        <section className="section tron" data-tron>
          <div className="tron-grid" aria-hidden="true">
            <ThermodynamicGrid overlay palette="tron" resolution={22} coolingFactor={0.95} />
          </div>
          <div className="wrap tron-inner">
            <p className="tag" data-reveal>
              SYSTEMS ONLINE · MOVE TO ENERGIZE
            </p>
            <h2 className="tron-title" data-reveal>
              <GlitchText>Energy dances along unseen frontiers.</GlitchText>
            </h2>
            <p className="tron-sub" data-reveal>
              Interfaces that stay quiet until you need them — and systems underneath that hold up
              when the load spikes.
            </p>
          </div>
        </section>

        {/* WORK */}
        <section id="work" className="section panel">
          <div className="wrap">
            <div className="sec-head" data-reveal>
              <span className="section-num">03 — ARTIFACTS</span>
              <h2 className="sec-title">
                <GlitchText>Work</GlitchText>
              </h2>
            </div>
            {/* The projects now orbit as 3D cards — the cards are what move,
                the void behind them stays put. */}
            <div className="work-carousel" data-reveal>
              <CircularCarousel
                items={projects.map((project, i) => ({
                  id: String(i),
                  title: project.title,
                  description: project.blurb,
                  tag: project.tags[0],
                }))}
                autoPlayInterval={5000}
              />
            </div>
          </div>
        </section>

        {/* STUDIO — the doorway to the polished, white web-design demo page. */}
        <section id="studio-cta" className="section panel studio-cta">
          <div className="wrap">
            <div className="sec-head" data-reveal>
              <span className="section-num">04 — SIDEBAND</span>
              <h2 className="sec-title">
                <GlitchText>Code is magic.</GlitchText>
              </h2>
            </div>
            <p className="studio-cta-lede" data-reveal>
              Beyond the fleet software, I build professional, custom websites —
              anything you can dream up. Code is magic; think of me as your
              magician. Tap the board to step into the studio.
            </p>
            <div className="studio-cta-row" data-reveal>
              <FlipDiskMatrix
                words={STUDIO_WORDS}
                href="#/studio"
                ariaLabel="Build a professional looking website — open the web design studio"
              />
            </div>
            <p className="studio-cta-hint" data-reveal>
              tap the board →
            </p>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="section panel contact-x">
          <div className="wrap">
            <div className="sec-head" data-reveal>
              <span className="section-num">05 — UPLINK</span>
              <h2 className="sec-title contact-title">
                <GlitchText>Get in touch.</GlitchText>
              </h2>
            </div>
            <div className="contact-cols" data-reveal>
              <div className="contact-block">
                <span className="tag tag-dim">TRANSMISSION</span>
                <a className="contact-line" href={`mailto:${profile.email}`} data-hover>
                  {profile.email}
                </a>
                <a className="contact-line" href={profile.linkedin.url} target="_blank" rel="noreferrer" data-hover>
                  linkedin / {profile.linkedin.label}
                </a>
                <a className="contact-line" href={profile.github.url} target="_blank" rel="noreferrer" data-hover>
                  github / {profile.github.label}
                </a>
              </div>
              <div className="contact-block">
                <span className="tag tag-dim">COORDINATES</span>
                <p className="contact-meta">{profile.location}</p>
                <p className="contact-meta">Open to remote & hybrid</p>
                <p className="contact-meta ok">◉ Available</p>
              </div>
            </div>
            <footer className="foot">
              <span className="tag tag-dim">© {new Date().getFullYear()} DIETER OLIVIER</span>
              <span className="tag tag-dim">ANOMALY-CLASS // NO SIGNAL LOST</span>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
