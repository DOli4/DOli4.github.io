import { useEffect, useState } from "react";
import type { Drill } from "../../../lib/drill-crypto";
import GlassWin, { loadLayout, type Box } from "./GlassWin";

type NewsItem = { title: string; what: string; why: string; impact: string; source?: string };
type News = { date: string; items: NewsItem[] };

const PROMPT_TIPS: { title: string; steps: string[]; note: string }[] = [
  { title: "The shape of a good prompt", steps: ["ROLE", "CONTEXT", "TASK", "FORMAT"], note: "Who the AI is → what it needs to know → what to do → how the answer should look." },
  { title: "Iterate, don't rewrite", steps: ["DRAFT", "RUN", "POINT AT THE WRONG BIT", "RUN AGAIN"], note: "Fixing one thing beats starting over. The AI keeps the good parts." },
  { title: "Fence it in", steps: ["WANT", "DON'T WANT", "EDGE CASES"], note: "Saying what NOT to do removes the most common failure." },
  { title: "Show, don't tell", steps: ["EXAMPLE IN", "EXAMPLE OUT", "NOW YOURS"], note: "One real example beats three sentences of description." },
  { title: "Big task? Split it", steps: ["BIG TASK", "SPLIT", "ONE PIECE", "STITCH"], note: "Small asks fail small. Huge asks fail huge." },
  { title: "Make it check itself", steps: ["ANSWER", "“NOW VERIFY IT”", "FIXED ANSWER"], note: "A second pass catches what the first pass invented." },
];

const LAYOUT_KEY = "intel-layout-v2";
/** Past news days, archived per browser — news.json only ever holds the
 *  latest run, so without this yesterday's items would be gone. */
const NEWS_HIST_KEY = "news-history";
const NEWS_HIST_DAYS = 30;

function loadNewsHist(): Record<string, News> {
  try {
    const raw = JSON.parse(localStorage.getItem(NEWS_HIST_KEY) ?? "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

/** Card with a pop-out switch on its title. */
function Card({ id, title, popped, setPopped, children }: {
  id: string; title: string; popped: string[];
  setPopped: React.Dispatch<React.SetStateAction<string[]>>;
  children: React.ReactNode;
}) {
  if (popped.includes(id)) return null;
  return (
    <article className="intel-card">
      <h3>
        {title}
        <button className="intel-x card-pop" title="Pop out into its own window"
          onClick={() => setPopped((p) => [...p, id])} data-hover>⧉</button>
      </h3>
      {children}
    </article>
  );
}

function NewsBody({ it }: { it: NewsItem }) {
  return (
    <>
      <div className="mini-flow">
        <div className="mf-box"><span className="mf-k">WHAT</span>{it.what}</div>
        <span className="mf-arrow" aria-hidden>↓</span>
        <div className="mf-box"><span className="mf-k">WHY IT MATTERS</span>{it.why}</div>
        <span className="mf-arrow" aria-hidden>↓</span>
        <div className="mf-box mf-box-hot"><span className="mf-k">FOR YOU</span>{it.impact}</div>
      </div>
      {it.source && <a className="intel-src" href={it.source} target="_blank" rel="noopener noreferrer" data-hover>source →</a>}
    </>
  );
}

function TipBody({ tip }: { tip: (typeof PROMPT_TIPS)[number] }) {
  return (
    <>
      <div className="chain">
        {tip.steps.map((s, j) => (
          <span key={j} className="chain-step">
            <span className="chain-box">{s}</span>
            {j < tip.steps.length - 1 && <span className="chain-arrow" aria-hidden>→</span>}
          </span>
        ))}
      </div>
      <p className="intel-note">{tip.note}</p>
    </>
  );
}

/**
 * INTEL as a small window system: News and Intel are separate detachable
 * windows, and every card inside can pop out into its own movable glass div.
 */
export default function FloatPanel({ drills }: { drills: Drill[] }) {
  const [openNews, setOpenNews] = useState(false);
  const [openIntel, setOpenIntel] = useState(false);
  const [popped, setPopped] = useState<string[]>([]);
  const [news, setNews] = useState<News | null | "none">(null);
  const [newsHist, setNewsHist] = useState<Record<string, News>>(loadNewsHist);
  const [newsDay, setNewsDay] = useState<string | null>(null); // null = newest
  const [boxes, setBoxes] = useState<Record<string, Box>>(() => loadLayout(LAYOUT_KEY));

  useEffect(() => {
    fetch("news.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((n: News) => {
        setNews(n);
        // archive the day; keep the newest NEWS_HIST_DAYS. Computed outside
        // the updater (updaters must stay pure) and best-effort on quota.
        const merged = { ...loadNewsHist(), [n.date]: n };
        const keep = Object.keys(merged).sort().reverse().slice(0, NEWS_HIST_DAYS);
        const next = Object.fromEntries(keep.map((d) => [d, merged[d]]));
        try { localStorage.setItem(NEWS_HIST_KEY, JSON.stringify(next)); } catch { /* archive is best-effort */ }
        setNewsHist(next);
      })
      .catch(() => setNews("none"));
  }, []);
  useEffect(() => { localStorage.setItem(LAYOUT_KEY, JSON.stringify(boxes)); }, [boxes]);

  const drillTips = drills
    .map((d) => (d as Drill & { promptTip?: string }).promptTip)
    .filter((t): t is string => !!t);
  // What the NEWS window shows: the picked archive day, else the freshest we
  // have — today's fetch, or the newest archived day when the fetch failed.
  const histDays = Object.keys(newsHist).sort().reverse();
  const latest = news !== null && news !== "none" ? news : histDays.length > 0 ? newsHist[histDays[0]] : null;
  const shown = (newsDay ? newsHist[newsDay] : null) ?? latest;
  const items = shown ? shown.items : [];

  return (
    <>
      {!openNews && (
        <button className="intel-tab" style={{ top: "34%" }} onClick={() => setOpenNews(true)} data-hover>
          <span className="intel-tab-dot" /> NEWS
        </button>
      )}
      {!openIntel && (
        <button className="intel-tab" style={{ top: "52%" }} onClick={() => setOpenIntel(true)} data-hover>
          <span className="intel-tab-dot" /> INTEL
        </button>
      )}

      {openNews && (
        <GlassWin id="win-news" title="NEWS" onClose={() => setOpenNews(false)}
          boxes={boxes} setBoxes={setBoxes} resizable
          def={{ x: Math.max(12, innerWidth - 420), y: 70, w: 384, h: 460 }}>
          {news === null && !shown && <p className="intel-empty">loading…</p>}
          {news === "none" && !shown && <p className="intel-empty">No news yet — the 16:30 run fetches the day&rsquo;s AI news.</p>}
          {shown && (
            <>
              {histDays.length > 1 ? (
                <select
                  className="drill-date intel-days"
                  value={shown.date}
                  onChange={(e) => setNewsDay(e.target.value)}
                  aria-label="Pick a news day"
                >
                  {histDays.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              ) : (
                <p className="intel-date">{shown.date}</p>
              )}
              {items.map((it, i) => (
                <Card key={`${shown.date}-${i}`} id={`n-${shown.date}-${i}`} title={it.title} popped={popped} setPopped={setPopped}>
                  <NewsBody it={it} />
                </Card>
              ))}
            </>
          )}
        </GlassWin>
      )}

      {openIntel && (
        <GlassWin id="win-intel" title="INTEL" onClose={() => setOpenIntel(false)}
          boxes={boxes} setBoxes={setBoxes} resizable
          def={{ x: Math.max(12, innerWidth - 830), y: 70, w: 384, h: 460 }}>
          {drillTips.length > 0 && (
            <Card id="d-tips" title="From your drills" popped={popped} setPopped={setPopped}>
              {drillTips.map((t, i) => <p className="intel-note" key={i}>{t}</p>)}
            </Card>
          )}
          {PROMPT_TIPS.map((tip, i) => (
            <Card key={i} id={`t-${i}`} title={tip.title} popped={popped} setPopped={setPopped}>
              <TipBody tip={tip} />
            </Card>
          ))}
        </GlassWin>
      )}

      {/* popped-out cards: each its own small movable window */}
      {popped.map((id, k) => {
        const close = () => setPopped((p) => p.filter((x) => x !== id));
        const def = { x: 120 + k * 40, y: 120 + k * 40, w: 330, h: 340 };
        if (id.startsWith("n-")) {
          // day-qualified id "n-<yyyy-mm-dd>-<i>": a popped card stays pinned
          // to ITS day even when the NEWS window shows another one.
          const date = id.slice(2, 12);
          const it = newsHist[date]?.items[Number(id.slice(13))];
          if (!it) return null;
          return (
            <GlassWin key={id} id={id} title={it.title} onClose={close} boxes={boxes} setBoxes={setBoxes} def={def} resizable small>
              <NewsBody it={it} />
            </GlassWin>
          );
        }
        if (id === "d-tips") {
          return (
            <GlassWin key={id} id={id} title="From your drills" onClose={close} boxes={boxes} setBoxes={setBoxes} def={def} resizable small>
              {drillTips.map((t, i) => <p className="intel-note" key={i}>{t}</p>)}
            </GlassWin>
          );
        }
        const tip = PROMPT_TIPS[Number(id.slice(2))];
        if (!tip) return null;
        return (
          <GlassWin key={id} id={id} title={tip.title} onClose={close} boxes={boxes} setBoxes={setBoxes} def={def} resizable small>
            <TipBody tip={tip} />
          </GlassWin>
        );
      })}
    </>
  );
}
