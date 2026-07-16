import { useState } from "react";
import { CHALLENGES, customChallenge, type Challenge } from "./challenges";

/**
 * Screen 1 — the challenge picker. Six node-style diagram cards around a
 * center glass input where a free-typed idea becomes its own challenge.
 * Diagrams over sentences: each card is a mini-flow of WHAT to build.
 */
export default function Picker({ onPick }: { onPick: (c: Challenge) => void }) {
  const [idea, setIdea] = useState("");

  const submitIdea = () => {
    if (idea.trim().length < 3) return;
    onPick(customChallenge(idea));
  };

  const top = CHALLENGES.slice(0, 3);
  const bottom = CHALLENGES.slice(3, 6);

  const card = (c: Challenge) => (
    <button key={c.id} className="m-card spot" onClick={() => onPick(c)} data-hover>
      <span className="m-card-hd">
        <span className="m-card-dot" aria-hidden />
        {c.title}
      </span>
      <span className="m-card-sub">{c.subtitle}</span>
      <span className="mini-flow m-card-flow" aria-hidden>
        {c.flow.map((f, i) => (
          <span key={i} className="m-flow-step">
            <span className="mf-box m-flow-box">{f}</span>
            {i < c.flow.length - 1 && <span className="mf-arrow">↓</span>}
          </span>
        ))}
      </span>
      <span className="m-card-goal">{c.goal}</span>
      <a
        className="intel-src"
        href={c.link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        data-hover
      >
        {c.linkLabel} →
      </a>
    </button>
  );

  return (
    <div className="m-picker">
      <header className="m-head">
        <p className="tag tag-dim">CODE MENTOR · TYPE IT YOURSELF</p>
        <h1 className="m-h1">PICK A CHALLENGE</h1>
      </header>

      <div className="m-grid">
        {top.map(card)}

        <form
          className="m-idea spot"
          onSubmit={(e) => { e.preventDefault(); submitIdea(); }}
        >
          <span className="m-idea-label tag tag-dim">OR YOUR OWN IDEA</span>
          <input
            className="m-idea-input"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="type something you want to code…"
            aria-label="Your own challenge idea"
          />
          <button className="m-idea-go" disabled={idea.trim().length < 3} data-hover>
            OPEN WORKSPACE →
          </button>
        </form>

        {bottom.map(card)}
      </div>
    </div>
  );
}
