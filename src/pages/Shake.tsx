import { useEffect, useRef, useState } from "react";
import GlitchText from "../components/GlitchText";
import "./shake.css";

const SPARKS = ["✦", "✧", "✶", "✷", "★", "◆"];

/**
 * The 16:30 reminder, opened by Windows Task Scheduler at #/shake.
 *
 * The site's thesis is "the object owns the void" — so this is the void, and
 * the shake is the object. It's the one warm thing on a cold site, which is
 * the point: strawberry is the only colour here that isn't in the palette.
 */
export default function Shake() {
  const [downed, setDowned] = useState(false);
  const glassRef = useRef<HTMLDivElement>(null);
  const burstLayer = useRef<HTMLDivElement>(null);

  // Ambient starfield — generated once, drifting forever.
  const [stars] = useState(() =>
    Array.from({ length: 34 }, (_, i) => ({
      id: i,
      char: SPARKS[(Math.random() * SPARKS.length) | 0],
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 7 + Math.random() * 13,
      delay: Math.random() * 5,
      dur: 3 + Math.random() * 4,
    })),
  );

  const [bubbles] = useState(() =>
    Array.from({ length: 11 }, (_, i) => ({
      id: i,
      left: 8 + Math.random() * 76,
      size: 3 + Math.random() * 7,
      delay: 1 + Math.random() * 3.5,
      dur: 2.2 + Math.random() * 2.6,
    })),
  );

  // Sparkle cursor. The CV page has the Tron cursor; here the pointer trails
  // stars, because body sets `cursor: none` site-wide and this page should
  // still feel like it's celebrating.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let last = 0;
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - last < 55) return; // throttle: a trail, not a firehose
      last = now;
      spawn(e.clientX, e.clientY, 1, 34);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  function spawn(x: number, y: number, count: number, spread: number) {
    const layer = burstLayer.current;
    if (!layer) return;
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = "spark";
      s.textContent = SPARKS[(Math.random() * SPARKS.length) | 0];
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      const angle = Math.random() * Math.PI * 2;
      const dist = spread * (0.4 + Math.random());
      s.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      s.style.setProperty("--dy", `${Math.sin(angle) * dist - 18}px`);
      s.style.setProperty("--rot", `${Math.random() * 540 - 270}deg`);
      s.style.setProperty("--sz", `${8 + Math.random() * 12}px`);
      s.style.animationDelay = `${Math.random() * 0.12}s`;
      layer.appendChild(s);
      window.setTimeout(() => s.remove(), 1400);
    }
  }

  function downIt() {
    if (downed) return;
    setDowned(true);
    const r = glassRef.current?.getBoundingClientRect();
    if (r) spawn(r.left + r.width / 2, r.top + r.height / 2, 40, 190);
    window.setTimeout(() => spawn(window.innerWidth / 2, window.innerHeight / 2, 30, 260), 620);
  }

  // Esc closes the popup window. Harmless no-op in a normal browser tab.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") window.close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className={`shake-page${downed ? " is-downed" : ""}`}>
      <div className="shake-stars" aria-hidden="true">
        {stars.map((s) => (
          <span
            key={s.id}
            className="star"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              fontSize: `${s.size}px`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.dur}s`,
            }}
          >
            {s.char}
          </span>
        ))}
      </div>

      <div className="shake-burst" ref={burstLayer} aria-hidden="true" />

      <div className="shake-inner">
        <div className="shake-object" ref={glassRef}>
          <div className="glass-glow" aria-hidden="true" />
          <div className="glass" aria-hidden="true">
            <div className="lid" />
            <div className="liquid">
              <div className="surface" />
              <div className="surface foam" />
              {bubbles.map((b) => (
                <span
                  key={b.id}
                  className="bubble"
                  style={{
                    left: `${b.left}%`,
                    width: `${b.size}px`,
                    height: `${b.size}px`,
                    animationDelay: `${b.delay}s`,
                    animationDuration: `${b.dur}s`,
                  }}
                />
              ))}
            </div>
            <div className="sheen" />
          </div>
        </div>

        <div className="shake-copy">
          <p className="tag" style={{ color: "var(--straw)" }}>
            16:30 · DAILY · NON-NEGOTIABLE
          </p>

          {downed ? (
            <>
              <h1 className="shake-title">
                <GlitchText>NICE.</GlitchText>
              </h1>
              <p className="shake-sub">Same time tomorrow.</p>
            </>
          ) : (
            <>
              <h1 className="shake-title">
                <GlitchText>SHAKE</GlitchText>
                <span className="shake-title-2">
                  <GlitchText>O'CLOCK</GlitchText>
                </span>
              </h1>
              <p className="shake-sub">You lifted. Now feed it.</p>
              <button className="shake-btn" onClick={downIt} autoFocus>
                Down it
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
