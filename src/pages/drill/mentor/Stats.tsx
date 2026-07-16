import { useMemo, useState } from "react";
import { coachScan, getApiKey, KIND_COLOR, type ChipKind, type CoachReport } from "../../../lib/mentor-claude";
import { loadHistory, type HistoryEntry } from "./history";
import { FINISH_SCORE, liveStreak, loadXp, rankOf } from "./xp";

const COACH_COLOR = { strength: "#7bdf8f", gap: "#d8a94a", next: "#35e6ff" } as const;

/** score bars: single series, newest 14 runs, oldest → newest left to right */
function ScoreBars({ entries }: { entries: HistoryEntry[] }) {
  const runs = entries.slice(0, 14).reverse();
  const W = 520, H = 170, PAD = 8, BASE = 150, PLOT = 128;
  const slot = (W - PAD * 2) / Math.max(runs.length, 1);
  const barW = Math.min(26, Math.max(8, slot - 4));
  // direct-label the newest best run only (ties would stack labels)
  const bestIdx = runs.reduce((bi, r, i) => (r.score >= runs[bi].score ? i : bi), 0);
  const y80 = BASE - (FINISH_SCORE / 100) * PLOT;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="st-bars" role="img" aria-label="Score per analysis, newest fourteen runs">
      {/* recessive baseline + bonus threshold */}
      <line x1={PAD} y1={BASE} x2={W - PAD} y2={BASE} stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
      <line x1={PAD} y1={y80} x2={W - 70} y2={y80} stroke="#d8a94a" strokeWidth="1" strokeDasharray="4 5" opacity="0.55" />
      <text x={W - 64} y={y80 + 3} className="st-axis-label">{FINISH_SCORE} · bonus</text>
      {runs.map((r, i) => {
        const h = Math.max(2, (r.score / 100) * PLOT);
        const x = PAD + i * slot + (slot - barW) / 2;
        const rad = Math.min(3, barW / 2, h / 2);
        return (
          <g key={r.id}>
            <path
              d={`M${x},${BASE} v${-(h - rad)} q0,${-rad} ${rad},${-rad} h${barW - rad * 2} q${rad},0 ${rad},${rad} v${h - rad} z`}
              fill="rgba(53, 230, 255, 0.75)"
            />
            <title>{`${r.at.slice(0, 10)} · ${r.challengeTitle} · ${r.score}`}</title>
            {i === bestIdx && (
              <text x={x + barW / 2} y={BASE - h - 6} textAnchor="middle" className="st-bar-label">{r.score}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** chip kinds across the whole history as a donut; legend carries the counts */
function KindDonut({ entries }: { entries: HistoryEntry[] }) {
  const counts = useMemo(() => {
    const c: Record<ChipKind, number> = { bug: 0, smell: 0, pattern: 0, style: 0 };
    entries.forEach((e) => e.chips.forEach((ch) => { if (ch.kind in c) c[ch.kind]++; }));
    return c;
  }, [entries]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const avg = entries.length ? Math.round(entries.reduce((a, e) => a + e.score, 0) / entries.length) : 0;

  const R = 52, C = 2 * Math.PI * R, GAP = 3;
  let offset = 0;
  const kinds = (Object.keys(counts) as ChipKind[]).filter((k) => counts[k] > 0);

  return (
    <div className="st-donut-wrap">
      <svg viewBox="0 0 140 140" className="st-donut" role="img" aria-label={`Review chips by kind, ${total} total`}>
        <g transform="rotate(-90 70 70)">
          {total === 0 && <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />}
          {kinds.map((k) => {
            const frac = counts[k] / total;
            const dash = Math.max(0.5, frac * C - (kinds.length > 1 ? GAP : 0));
            const el = (
              <circle
                key={k}
                cx="70" cy="70" r={R}
                fill="none"
                stroke={KIND_COLOR[k]}
                strokeWidth="14"
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
              >
                <title>{`${k} · ${counts[k]}`}</title>
              </circle>
            );
            offset += frac * C;
            return el;
          })}
        </g>
        <text x="70" y="66" textAnchor="middle" className="st-donut-n">{avg}</text>
        <text x="70" y="84" textAnchor="middle" className="st-donut-sub">avg score</text>
      </svg>
      <ul className="st-legend">
        {(Object.keys(counts) as ChipKind[]).map((k) => (
          <li key={k}>
            <span className="st-dot" style={{ background: KIND_COLOR[k] }} aria-hidden />
            {k} <b>{counts[k]}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The REVIEW DECK — the mentor's stats screen, dashboard-style: KPI tiles,
 * score bars, chip-kind donut, recent exercises, and the AI coach scan that
 * reads the whole history through the same key CONNECT CLAUDE stores.
 */
export default function Stats({
  onOpen,
  onBack,
  nonce,
}: {
  onOpen: (e: HistoryEntry) => void;
  onBack: () => void;
  /** bumped by the HISTORY window's deletes so the deck re-reads storage */
  nonce: number;
}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const entries = useMemo(loadHistory, [nonce]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const xp = useMemo(loadXp, [nonce]);
  const rank = rankOf(xp.xp);
  const streak = liveStreak(xp);
  const [coach, setCoach] = useState<CoachReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const hasKey = !!getApiKey();

  async function scan() {
    setBusy(true);
    setError("");
    try {
      const digest = entries
        .slice(0, 40)
        .map((e) => `${e.at.slice(0, 10)} · ${e.challengeTitle} · score ${e.score} · chips: ${e.chips.map((c) => `${c.kind}:${c.title}`).join("; ") || "none"}`)
        .join("\n")
        .slice(0, 6000);
      setCoach(await coachScan(digest || "no exercises yet"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan broke — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="st">
      <header className="m-head st-head">
        <div>
          <p className="tag tag-dim">CODE MENTOR · REVIEW DECK</p>
          <h1 className="m-h1">YOUR TRAINING</h1>
        </div>
        <button className="nd-ghost m-back" onClick={onBack} data-hover>← challenges</button>
      </header>

      {/* KPI tiles */}
      <div className="st-tiles">
        <div className="st-tile spot">
          <span className="st-tile-k">TOTAL XP</span>
          <b className="st-tile-n st-cyan">{xp.xp}</b>
          <span className="st-tile-sub">{rank.name}{rank.next !== null ? ` · next at ${rank.next}` : " · max rank"}</span>
        </div>
        <div className="st-tile spot">
          <span className="st-tile-k">ANALYSES</span>
          <b className="st-tile-n">{xp.analyses}</b>
          <span className="st-tile-sub">{entries.length} kept in history</span>
        </div>
        <div className="st-tile spot">
          <span className="st-tile-k">BEST SCORE</span>
          <b className="st-tile-n">{xp.best}</b>
          <span className="st-tile-sub">{xp.best >= FINISH_SCORE ? "bonus territory" : `${FINISH_SCORE} pays a bonus`}</span>
        </div>
        <div className="st-tile spot">
          <span className="st-tile-k">STREAK</span>
          <b className={`st-tile-n${streak > 1 ? " st-gold" : ""}`}>×{streak}</b>
          <span className="st-tile-sub">days in a row</span>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="intel-empty st-empty">No exercises yet — pick a challenge, type it, press ANALYSE. Everything lands here.</p>
      ) : (
        <div className="st-grid">
          <section className="st-panel st-panel-wide spot">
            <h2 className="st-panel-h">SCORES · last {Math.min(entries.length, 14)} runs</h2>
            <ScoreBars entries={entries} />
          </section>

          <section className="st-panel spot">
            <h2 className="st-panel-h">WHAT THE CHIPS SAY</h2>
            <KindDonut entries={entries} />
          </section>

          <section className="st-panel st-panel-wide spot">
            <h2 className="st-panel-h">RECENT EXERCISES</h2>
            <div className="st-recent">
              {entries.slice(0, 6).map((e) => (
                <button key={e.id} className="st-row" onClick={() => onOpen(e)} data-hover>
                  <span className="st-row-title">{e.challengeTitle}</span>
                  <span className="st-row-meta">{e.at.slice(0, 10)} · {e.chips.length} chips</span>
                  <b className="st-row-score">{e.score}</b>
                </button>
              ))}
            </div>
          </section>

          <section className="st-panel spot">
            <h2 className="st-panel-h">AI COACH</h2>
            {!coach && (
              <>
                <p className="intel-note">Claude reads your whole history — what you keep nailing, what keeps coming up, what to drill next.</p>
                {hasKey ? (
                  <button className="m-analyse st-scan" onClick={scan} disabled={busy} data-hover>
                    {busy ? "SCANNING…" : "SCAN MY TRAINING"}
                  </button>
                ) : (
                  <p className="intel-note st-nokey">Open a workspace → CONNECT CLAUDE first, then scan from here.</p>
                )}
              </>
            )}
            {coach && (
              <>
                <p className="st-coach-headline">{coach.headline}</p>
                {coach.cards.map((c, i) => (
                  <article key={i} className="st-coach-card">
                    <p className="m-chip-short">
                      <span className="m-kind" style={{ background: COACH_COLOR[c.kind] }} aria-hidden />
                      <span className="m-kind-name" style={{ color: COACH_COLOR[c.kind] }}>{c.kind.toUpperCase()}</span>
                      <span className="st-coach-title">{c.title}</span>
                    </p>
                    <p className="m-chip-text">{c.short}</p>
                    <p className="intel-note">{c.more}</p>
                  </article>
                ))}
                <button className="nd-ghost" onClick={() => void scan()} disabled={busy} data-hover>
                  {busy ? "scanning…" : "scan again"}
                </button>
              </>
            )}
            {error && <p className="gate-err m-err" role="alert">{error}</p>}
          </section>
        </div>
      )}
    </div>
  );
}
