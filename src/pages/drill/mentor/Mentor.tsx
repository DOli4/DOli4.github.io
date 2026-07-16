import { useEffect, useMemo, useState } from "react";
import GlassWin, { loadLayout, type Box } from "../canvas/GlassWin";
import Picker from "./Picker";
import Stats from "./Stats";
import Workspace from "./Workspace";
import { CHALLENGES, customChallenge, type Challenge } from "./challenges";
import { loadHistory, removeHistory, type HistoryEntry } from "./history";
import { awardXp, liveStreak, loadXp, rankOf, type XpState } from "./xp";
import "./mentor.css";

const HIST_LAYOUT_KEY = "mentor-layout-hub";

/** nonce forces a Workspace remount even when the same entry/challenge is
 *  opened twice in a row — "reopen" must always restore the saved state. */
type Session = { challenge: Challenge; initial?: HistoryEntry; nonce: number };

/** A history entry's challenge, restored: seed challenges come back with
 *  their example cards; custom ideas are rebuilt around the saved goal. */
function challengeOf(entry: HistoryEntry): Challenge {
  return (
    CHALLENGES.find((c) => c.id === entry.challengeId) ?? {
      ...customChallenge(entry.goal),
      title: entry.challengeTitle,
      subtitle: "from history",
    }
  );
}

/**
 * CODE MENTOR — the gamified teacher screen behind the gate.
 * Picker ⇄ Workspace state machine; XP/rank bar and the exercise HISTORY
 * live at this level so they exist on both screens. Everything glitch-boots
 * in on mount (reduced-motion safe in CSS).
 */
export default function Mentor() {
  const [session, setSession] = useState<Session | null>(null);
  // with no session open, the base screen is the picker or the review deck
  const [view, setView] = useState<"picker" | "stats">("picker");
  const [xp, setXp] = useState<XpState>(loadXp);
  const [booting, setBooting] = useState(true);
  const [histOpen, setHistOpen] = useState(false);
  const [histBoxes, setHistBoxes] = useState<Record<string, Box>>(() => loadLayout(HIST_LAYOUT_KEY));
  // deletions bump this so the list re-reads localStorage
  const [histNonce, setHistNonce] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 2200);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => { localStorage.setItem(HIST_LAYOUT_KEY, JSON.stringify(histBoxes)); }, [histBoxes]);

  const rank = rankOf(xp.xp);
  // xp changes after every analysis, so an open list picks up new runs too;
  // memoized so window-dragging renders don't re-parse the archive.
  const entries = useMemo(
    () => (histOpen ? loadHistory() : []),
    [histOpen, histNonce, xp],
  );

  return (
    <div className={`mentor${booting ? " m-boot" : ""}`}>
      {session === null ? (
        view === "picker" ? (
          <Picker onPick={(challenge) => setSession({ challenge, nonce: Date.now() })} />
        ) : (
          <Stats
            onOpen={(e) => setSession({ challenge: challengeOf(e), initial: e, nonce: Date.now() })}
            onBack={() => setView("picker")}
            nonce={histNonce}
          />
        )
      ) : (
        <Workspace
          key={`${session.initial?.id ?? session.challenge.id}:${session.nonce}`}
          challenge={session.challenge}
          initial={session.initial}
          onBack={() => setSession(null)}
          onScored={(score) => setXp(awardXp(score))}
        />
      )}

      <button
        className="intel-tab"
        style={{ top: "58%" }}
        onClick={() => { setSession(null); setView("stats"); }}
        data-hover
      >
        <span className="intel-tab-dot" /> STATS
      </button>
      {!histOpen && (
        <button className="intel-tab" style={{ top: "70%" }} onClick={() => setHistOpen(true)} data-hover>
          <span className="intel-tab-dot" /> HISTORY
        </button>
      )}
      {histOpen && (
        <GlassWin
          id="win-hist"
          title="EXERCISE HISTORY"
          onClose={() => setHistOpen(false)}
          boxes={histBoxes}
          setBoxes={setHistBoxes}
          def={{ x: Math.max(12, innerWidth - 430), y: 90, w: 400, h: 440 }}
          resizable
        >
          {entries.length === 0 && (
            <p className="intel-empty">Nothing yet — every ANALYSE run lands here: your code, the score, the chips.</p>
          )}
          {entries.map((e) => (
            <article key={e.id} className="m-hist">
              <div className="m-hist-hd">
                <span className="m-hist-date">{e.at.slice(0, 10)}</span>
                <span className="m-hist-title">{e.challengeTitle}</span>
                <b className="m-hist-score">{e.score}</b>
              </div>
              <div className="m-hist-row">
                <span className="m-hist-meta">{e.chips.length} chips · {e.code.split("\n").length} lines typed</span>
                <button
                  className="nd-chip nd-chip-btn"
                  onClick={() => { setSession({ challenge: challengeOf(e), initial: e, nonce: Date.now() }); setHistOpen(false); }}
                  data-hover
                >
                  reopen →
                </button>
                <button
                  className="art-del"
                  onClick={() => { removeHistory(e.id); setHistNonce((n) => n + 1); }}
                  aria-label={`Delete ${e.challengeTitle} from history`}
                >
                  ✕
                </button>
              </div>
            </article>
          ))}
        </GlassWin>
      )}

      <aside className="m-xp" aria-label="Your rank and XP">
        <div className="m-xp-top">
          <b className="m-rank">{rank.name}</b>
          <span className="m-xp-n">{xp.xp} XP</span>
        </div>
        <div className="m-xp-bar" role="progressbar" aria-valuenow={rank.pct} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${rank.pct}%` }} />
        </div>
        <div className="m-xp-sub">
          {rank.next !== null ? <span>next rank at {rank.next}</span> : <span>max rank</span>}
          {liveStreak(xp) > 1 && <span className="m-streak">streak ×{liveStreak(xp)}</span>}
        </div>
      </aside>
    </div>
  );
}
