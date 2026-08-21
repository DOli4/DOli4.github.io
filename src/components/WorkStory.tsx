import React from "react";
import FlowArt, { FlowSection } from "./ui/story-scroll";
import GlitchText from "./GlitchText";
import { profile } from "../content";

/**
 * The Work section as a pinned, rotating scroll-story (FlowArt), carrying the
 * real content — projects, what I build, how I work, the promise — themed dark
 * to match the ANOMALY site. Each panel is a full-screen block that swings in
 * over the last as you scroll.
 */

type Col = { label: string; text: string };
type Panel = {
  bg: string;
  accent: string;
  eyebrow: string;
  title: string[];
  intro: string;
  columns?: Col[];
};

const INK = "#eef2ff";
const GOLD = "#d0a638";
const CYAN = "#8fd8e6";

const panels: Panel[] = [
  {
    bg: "#06070d",
    accent: GOLD,
    eyebrow: "03 — Work",
    title: ["Selected", "Work"],
    intro:
      "A few of the projects and systems I've shipped — mobile apps, full-stack platforms, and the services behind them.",
    columns: [
      { label: "Mobile UI & design system", text: "Two mockups became a whole app — a design system and reusable component library, built from scratch." },
      { label: "E-commerce backend", text: "A scalable Node.js / Express / MongoDB backend with sharding, replication and a clean REST API." },
      { label: "Community platform", text: "A responsive full-stack platform designed and built solo, front to back." },
      { label: "AI interview simulator", text: "Led a ten-person team building a VR mock-interview platform in Unity. Scored a distinction." },
    ],
  },
  {
    bg: "#071318",
    accent: CYAN,
    eyebrow: "What I build",
    title: ["What", "I Build"],
    intro: "Everything a great product needs, in one pair of hands.",
    columns: [
      { label: "Mobile apps", text: "React Native interfaces and design systems — the whole thing, built to feel native." },
      { label: "Full-stack", text: "Java / Spring Boot and Angular — from the database migration to the button you click." },
      { label: "Backend that scales", text: "Well-tested microservices and REST APIs, built to hold up when the load spikes." },
      { label: "Performance", text: "Query tuning, faster reporting, optimised front-ends. Fast is a feature." },
    ],
  },
  {
    bg: "#0a0912",
    accent: GOLD,
    eyebrow: "How I work",
    title: ["How", "I Work"],
    intro: "Calm, considered, and on time. Four moves, no smoke.",
    columns: [
      { label: "Discover", text: "We pin down the goal, the audience, and exactly what winning looks like." },
      { label: "Design", text: "A distinctive direction, then high-fidelity screens you can feel — not just approve." },
      { label: "Build", text: "Clean, accessible, fast front-end — the design shipped exactly as drawn." },
      { label: "Launch", text: "Measured, tuned and handed over, with everything documented to grow on." },
    ],
  },
  {
    bg: "#070d1c",
    accent: CYAN,
    eyebrow: "The promise",
    title: ["The", "Promise"],
    intro: "Why hand your work to me.",
    columns: [
      { label: "Custom, always", text: "No templates, no page-builders. Every project starts from a blank page — yours alone." },
      { label: "One pair of hands", text: "Design and build, front to back. Nothing lost between a designer and a developer." },
      { label: "22 distinctions", text: "A three-year Bachelor of Computing, the final year full-time in industry." },
    ],
  },
];

function Columns({ columns, accent }: { columns: Col[]; accent: string }) {
  return (
    <>
      <hr className="my-[2vw] border-none border-t" style={{ borderColor: `${accent}55` }} />
      <div className="flex flex-wrap gap-[3vw]">
        {columns.map((c) => (
          <div className="min-w-[180px] flex-1" key={c.label}>
            <p className="mb-2 text-sm font-bold uppercase tracking-wider" style={{ color: accent }}>
              {c.label}
            </p>
            <p className="text-[clamp(0.85rem,1.3vw,1.05rem)] leading-relaxed opacity-75">{c.text}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export default function WorkStory() {
  return (
    <FlowArt aria-label="Work">
      {panels.map((p) => (
        <FlowSection key={p.eyebrow} aria-label={p.eyebrow} style={{ backgroundColor: p.bg, color: INK }}>
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: p.accent }}>
            {p.eyebrow}
          </p>
          <hr className="my-[2vw] border-none border-t" style={{ borderColor: `${p.accent}55` }} />
          <div>
            <h2 className="text-[clamp(3rem,11vw,12rem)] font-bold leading-[0.85] uppercase tracking-tight">
              {p.title.map((line, i) => (
                <React.Fragment key={i}>
                  <GlitchText>{line}</GlitchText>
                  {i < p.title.length - 1 && <br />}
                </React.Fragment>
              ))}
            </h2>
          </div>
          <hr className="my-[2vw] border-none border-t" style={{ borderColor: `${p.accent}55` }} />
          <p className="max-w-[50ch] text-[clamp(1rem,2.5vw,2rem)] font-normal leading-relaxed">
            {p.intro}
          </p>
          {p.columns && <Columns columns={p.columns} accent={p.accent} />}
        </FlowSection>
      ))}

      {/* Closing CTA panel → flows into the contact section below */}
      <FlowSection aria-label="Let's build" style={{ backgroundColor: "#05060a", color: INK }}>
        <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
          Let&apos;s build
        </p>
        <hr className="my-[2vw] border-none border-t" style={{ borderColor: `${GOLD}55` }} />
        <div>
          <h2 className="text-[clamp(3rem,11vw,12rem)] font-bold leading-[0.85] uppercase tracking-tight">
            <GlitchText>Ready</GlitchText>
            <br />
            <GlitchText>To</GlitchText>
            <br />
            <GlitchText>Begin?</GlitchText>
          </h2>
        </div>
        <hr className="my-[2vw] border-none border-t" style={{ borderColor: `${GOLD}55` }} />
        <p className="mt-auto max-w-[50ch] text-[clamp(1rem,2.5vw,2rem)] font-normal leading-relaxed">
          Have something in mind? I&apos;d love to hear about it —{" "}
          <a href={`mailto:${profile.email}`} className="underline" style={{ color: GOLD }}>
            {profile.email}
          </a>
          .
        </p>
      </FlowSection>
    </FlowArt>
  );
}
