import { useEffect, useRef, useState } from "react";
import type { Drill } from "../../../lib/drill-crypto";

type NewsItem = { title: string; what: string; why: string; impact: string; source?: string };
type News = { date: string; items: NewsItem[] };

/** Prompting technique cards, drawn as step-chains — diagrams, not prose. */
const PROMPT_TIPS: { title: string; steps: string[]; note: string }[] = [
  {
    title: "The shape of a good prompt",
    steps: ["ROLE", "CONTEXT", "TASK", "FORMAT"],
    note: "Who the AI is → what it needs to know → what to do → how the answer should look.",
  },
  {
    title: "Iterate, don't rewrite",
    steps: ["DRAFT", "RUN", "POINT AT THE WRONG BIT", "RUN AGAIN"],
    note: "Fixing one thing beats starting over. The AI keeps the good parts.",
  },
  {
    title: "Fence it in",
    steps: ["WANT", "DON'T WANT", "EDGE CASES"],
    note: "Saying what NOT to do removes the most common failure.",
  },
  {
    title: "Show, don't tell",
    steps: ["EXAMPLE IN", "EXAMPLE OUT", "NOW YOURS"],
    note: "One real example beats three sentences of description.",
  },
  {
    title: "Big task? Split it",
    steps: ["BIG TASK", "SPLIT", "ONE PIECE", "STITCH"],
    note: "Small asks fail small. Huge asks fail huge.",
  },
  {
    title: "Make it check itself",
    steps: ["ANSWER", "“NOW VERIFY IT”", "FIXED ANSWER"],
    note: "A second pass catches what the first pass invented.",
  },
];

const POS_KEY = "intel-panel";

/**
 * The INTEL panel — frosted glass (heavy blur + dark tint so text keeps
 * WCAG contrast on any background), floating above the canvas. Drag it by
 * the header, resize from the corner grip, close it back into the edge tab.
 * Position and size persist per browser.
 */
export default function FloatPanel({ drills }: { drills: Drill[] }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"news" | "prompts">("news");
  const [news, setNews] = useState<News | null | "none">(null);
  const [box, setBox] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(POS_KEY) ?? "null");
      if (saved && typeof saved.x === "number") {
        // Clamp on restore: the saved spot may be off-screen on a smaller window.
        return {
          w: Math.min(saved.w, innerWidth - 24),
          h: Math.min(saved.h, innerHeight - 40),
          x: Math.min(Math.max(8, saved.x), innerWidth - 80),
          y: Math.min(Math.max(8, saved.y), innerHeight - 60),
        };
      }
    } catch { /* fall through to default */ }
    return { x: Math.max(12, innerWidth - 420), y: 90, w: 384, h: 520 };
  });
  const boxRef = useRef(box);
  boxRef.current = box;

  useEffect(() => {
    fetch("news.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((n: News) => setNews(n))
      .catch(() => setNews("none"));
  }, []);

  useEffect(() => {
    localStorage.setItem(POS_KEY, JSON.stringify(box));
  }, [box]);

  // One shared pointer-drag helper for both moving and resizing.
  function startDrag(e: React.PointerEvent, mode: "move" | "size") {
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY;
    const start = { ...boxRef.current };
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (mode === "move") {
        setBox({
          ...start,
          x: Math.min(Math.max(8 - start.w + 60, start.x + dx), innerWidth - 60),
          y: Math.min(Math.max(8, start.y + dy), innerHeight - 48),
        });
      } else {
        setBox({
          ...start,
          w: Math.min(Math.max(300, start.w + dx), innerWidth - 24),
          h: Math.min(Math.max(260, start.h + dy), innerHeight - 40),
        });
      }
    };
    const onUp = () => {
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerup", onUp);
    };
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerup", onUp, { passive: true });
  }

  const drillTips = drills
    .map((d) => (d as Drill & { promptTip?: string }).promptTip)
    .filter((t): t is string => !!t);

  if (!open) {
    return (
      <button className="intel-tab" onClick={() => setOpen(true)} data-hover>
        <span className="intel-tab-dot" /> INTEL
      </button>
    );
  }

  return (
    <section
      className="intel"
      style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
      aria-label="Intel panel — AI news and prompting tips"
    >
      <header className="intel-hd" onPointerDown={(e) => startDrag(e, "move")}>
        <span className="intel-glowline" aria-hidden />
        <span className="intel-title">INTEL</span>
        <nav className="intel-tabs">
          <button className={tab === "news" ? "is-on" : ""} onClick={() => setTab("news")} data-hover>
            News
          </button>
          <button className={tab === "prompts" ? "is-on" : ""} onClick={() => setTab("prompts")} data-hover>
            Intel
          </button>
        </nav>
        <button className="intel-x" onClick={() => setOpen(false)} aria-label="Close panel" data-hover>
          ✕
        </button>
      </header>

      <div className="intel-bd nowheel">
        {tab === "news" && (
          <>
            {news === null && <p className="intel-empty">loading…</p>}
            {news === "none" && (
              <p className="intel-empty">No news yet — the 16:30 run fetches the day&rsquo;s AI news.</p>
            )}
            {news !== null && news !== "none" && (
              <>
                <p className="intel-date">{news.date}</p>
                {news.items.map((it, i) => (
                  <article className="intel-card" key={i}>
                    <h3>{it.title}</h3>
                    <div className="mini-flow">
                      <div className="mf-box">
                        <span className="mf-k">WHAT</span>
                        {it.what}
                      </div>
                      <span className="mf-arrow" aria-hidden>↓</span>
                      <div className="mf-box">
                        <span className="mf-k">WHY IT MATTERS</span>
                        {it.why}
                      </div>
                      <span className="mf-arrow" aria-hidden>↓</span>
                      <div className="mf-box mf-box-hot">
                        <span className="mf-k">FOR YOU</span>
                        {it.impact}
                      </div>
                    </div>
                    {it.source && (
                      <a className="intel-src" href={it.source} target="_blank" rel="noopener noreferrer" data-hover>
                        source →
                      </a>
                    )}
                  </article>
                ))}
              </>
            )}
          </>
        )}

        {tab === "prompts" && (
          <>
            {drillTips.length > 0 && (
              <article className="intel-card">
                <h3>From your drills</h3>
                {drillTips.map((t, i) => (
                  <p className="intel-note" key={i}>{t}</p>
                ))}
              </article>
            )}
            {PROMPT_TIPS.map((tip, i) => (
              <article className="intel-card" key={i}>
                <h3>{tip.title}</h3>
                <div className="chain">
                  {tip.steps.map((s, j) => (
                    <span key={j} className="chain-step">
                      <span className="chain-box">{s}</span>
                      {j < tip.steps.length - 1 && <span className="chain-arrow" aria-hidden>→</span>}
                    </span>
                  ))}
                </div>
                <p className="intel-note">{tip.note}</p>
              </article>
            ))}
          </>
        )}
      </div>

      <button
        className="intel-grip"
        onPointerDown={(e) => startDrag(e, "size")}
        aria-label="Resize panel"
      />
    </section>
  );
}
