import { useEffect, useRef, useState } from "react";
import GlassWin, { loadLayout, type Box } from "../canvas/GlassWin";
import { analyseCode, clearApiKey, getApiKey, KIND_COLOR, setApiKey, type MentorChip, type MentorReview } from "../../../lib/mentor-claude";
import { FINISH_BONUS, FINISH_SCORE } from "./xp";
import { addHistory, type HistoryEntry } from "./history";
import type { Challenge } from "./challenges";

const LAYOUT_KEY = "mentor-layout-v1";
type UidChip = MentorChip & { uid: string };
type UidReview = Omit<MentorReview, "chips"> & { chips: UidChip[] };

/** One teaching chip's body: short line first, expand for the lesson. */
function ChipBody({ chip }: { chip: MentorChip }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="m-chip-bd">
      <p className="m-chip-short">
        <span className="m-kind" style={{ background: KIND_COLOR[chip.kind], boxShadow: `0 0 8px ${KIND_COLOR[chip.kind]}99` }} aria-hidden />
        <span className="m-kind-name" style={{ color: KIND_COLOR[chip.kind] }}>{chip.kind.toUpperCase()}</span>
        {chip.line !== null && <span className="nd-chip m-line">L{chip.line}</span>}
      </p>
      <p className="m-chip-text">{chip.short}</p>
      {!open && (
        <button className="nd-ghost m-chip-more" onClick={() => setOpen(true)} data-hover>
          explain →
        </button>
      )}
      {open && (
        <>
          <p className="intel-note">{chip.more}</p>
          <a className="intel-src" href={chip.link} target="_blank" rel="noopener noreferrer" data-hover>
            read the pattern →
          </a>
        </>
      )}
    </div>
  );
}

/**
 * Screen 2 — the workspace. He TYPES code (paste is blocked — typing is the
 * training), example cards float beside as movable glass windows, ANALYSE
 * sends challenge + code to Claude and the review lands as teaching chips.
 */
export default function Workspace({
  challenge,
  initial,
  onBack,
  onScored,
}: {
  challenge: Challenge;
  /** a past exercise reopened from HISTORY — code + review restored */
  initial?: HistoryEntry;
  onBack: () => void;
  onScored: (score: number) => void;
}) {
  // Typed code drafts to localStorage as he types: leaving via ANY exit
  // (back, STATS tab, closing the tab) can never destroy typed work.
  const draftKey = `mentor-draft-${challenge.id}`;
  const [code, setCode] = useState(
    () => initial?.code ?? localStorage.getItem(draftKey) ?? "",
  );
  // only real typing writes the draft — merely REOPENING an old exercise
  // must not overwrite a half-typed draft for the same challenge
  const typed = useRef(false);
  useEffect(() => {
    if (!typed.current) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(draftKey, code); } catch { /* drafts are best-effort */ }
    }, 350);
    return () => clearTimeout(t);
  }, [code, draftKey]);
  const [boxes, setBoxes] = useState<Record<string, Box>>(() => loadLayout(LAYOUT_KEY));
  // examples live DOCKED in the rail beside the editor; ⧉ pops one out into
  // a floating GlassWin, ✕ on the float sends it back to the dock
  const [popped, setPopped] = useState<string[]>([]);
  const [hasKey, setHasKey] = useState(() => !!getApiKey());
  const [keyOpen, setKeyOpen] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Chips get stable uids when a review lands — index-keying would make
  // remaining chips adopt a closed neighbour's persisted box.
  const [review, setReview] = useState<UidReview | null>(() =>
    initial
      ? {
          score: initial.score,
          praise: initial.praise,
          chips: initial.chips.map((c, i) => ({ ...c, uid: `chip-${initial.id}-${i}` })),
        }
      : null,
  );
  const [pasteHint, setPasteHint] = useState(false);
  const pasteTimer = useRef(0);
  // Persist via effect — updaters must stay pure (StrictMode runs them twice),
  // and startDrag calls setBoxes on every pointermove.
  useEffect(() => { localStorage.setItem(LAYOUT_KEY, JSON.stringify(boxes)); }, [boxes]);
  useEffect(() => () => window.clearTimeout(pasteTimer.current), []);

  const blockPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    setPasteHint(true);
    window.clearTimeout(pasteTimer.current);
    pasteTimer.current = window.setTimeout(() => setPasteHint(false), 2200);
  };

  async function analyse() {
    if (!hasKey) { setKeyOpen(true); return; }
    setBusy(true);
    setError("");
    try {
      const result = await analyseCode(`${challenge.title} — ${challenge.goal}`, code);
      const stamp = Date.now();
      setReview({ ...result, chips: result.chips.map((c, i) => ({ ...c, uid: `chip-${stamp}-${i}` })) });
      // fresh review = fresh chip positions; drop stale chip boxes
      setBoxes((bs) => Object.fromEntries(Object.entries(bs).filter(([k]) => !k.startsWith("chip-"))));
      // every exercise lands in the history — the code AND the lesson
      addHistory({
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        goal: challenge.goal,
        code,
        score: result.score,
        praise: result.praise,
        chips: result.chips,
      });
      onScored(result.score);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something broke — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="m-work">
      <header className="m-work-hd">
        <button className="nd-ghost m-back" onClick={onBack} data-hover>← challenges</button>
        <div className="m-work-title">
          <h1 className="m-h1 m-h1-small">{challenge.title}</h1>
          <span className="chain m-goal-chain" aria-hidden>
            {challenge.flow.map((f, i) => (
              <span key={i} className="chain-step">
                <span className="chain-box">{f}</span>
                {i < challenge.flow.length - 1 && <span className="chain-arrow">→</span>}
              </span>
            ))}
          </span>
        </div>
        <button
          className={`m-connect${hasKey ? " is-linked" : ""}`}
          onClick={() => { setKeyOpen(true); setKeyDraft(""); }}
          data-hover
        >
          <span className="intel-tab-dot" aria-hidden /> {hasKey ? "CLAUDE LINKED" : "CONNECT CLAUDE"}
        </button>
      </header>

      <p className="m-goal">{challenge.goal}</p>

      <div className="m-editor-grid">
        {/* the editor: a node-style panel, header like a file tab */}
        <div className="m-editor spot">
          <div className="m-editor-hd">
            <span className="m-editor-dots" aria-hidden><i /><i /><i /></span>
            <span className="m-editor-file">{challenge.id}.ts</span>
            <span className="m-editor-meta">{code === "" ? "empty" : `${code.split("\n").length} lines`}</span>
          </div>
          <div className="m-code-zone">
            <textarea
              className="m-code"
              value={code}
              onChange={(e) => { typed.current = true; setCode(e.target.value); }}
              onPaste={blockPaste}
              spellCheck={false}
              placeholder={"// type it — the examples beside you show the technique,\n// never the answer"}
              aria-label="Your code"
            />
            {pasteHint && <p className="m-paste-hint" role="status">typing IS the training — no paste here</p>}
          </div>
        </div>

        {/* docked example rail: related snippets, never the solution */}
        <aside className="m-ex-rail" aria-label="Related examples">
          {challenge.examples.map((ex) =>
            popped.includes(ex.title) ? null : (
              <article key={ex.title} className="m-ex spot">
                <h3 className="m-ex-hd">
                  <span className="m-card-dot" aria-hidden />
                  {ex.title}
                  <button
                    className="intel-x card-pop"
                    title="Pop out into its own window"
                    onClick={() => setPopped((p) => [...p, ex.title])}
                    data-hover
                  >
                    ⧉
                  </button>
                </h3>
                <p className="intel-note">{ex.note}</p>
                <pre className="m-snippet"><code>{ex.code}</code></pre>
              </article>
            ),
          )}
        </aside>
      </div>

      <footer className="m-work-ft">
        <button className="m-analyse" onClick={analyse} disabled={busy || code.trim().length < 10} data-hover>
          {busy ? "ANALYSING…" : "ANALYSE"}
        </button>
        {review && (
          <div className="m-verdict" role="status">
            <span className="m-score">{review.score}</span>
            <span className="m-verdict-txt">
              {review.praise}
              {review.score >= FINISH_SCORE && <b className="m-bonus"> +{FINISH_BONUS} FINISH BONUS</b>}
            </span>
          </div>
        )}
        {error && <p className="gate-err m-err" role="alert">{error}</p>}
      </footer>

      {/* popped-out example cards — floating glass; ✕ docks them back */}
      {challenge.examples.map((ex, i) =>
        popped.includes(ex.title) ? (
          <GlassWin
            key={ex.title}
            id={`ex-${challenge.id}-${i}`}
            title={ex.title}
            onClose={() => setPopped((p) => p.filter((t) => t !== ex.title))}
            boxes={boxes}
            setBoxes={setBoxes}
            def={{ x: Math.max(12, innerWidth - 420), y: 96 + i * 320, w: 396, h: 300 }}
            resizable
            small
          >
            <p className="intel-note">{ex.note}</p>
            <pre className="m-snippet"><code>{ex.code}</code></pre>
          </GlassWin>
        ) : null,
      )}

      {/* the review lands as movable teaching chips pinned near the code */}
      {review?.chips.map((chip, i) => (
        <GlassWin
          key={chip.uid}
          id={chip.uid}
          title={chip.title}
          onClose={() => setReview((r) => (r ? { ...r, chips: r.chips.filter((c) => c.uid !== chip.uid) } : r))}
          boxes={boxes}
          setBoxes={setBoxes}
          def={{ x: 80 + i * 44, y: 150 + i * 56, w: 300, h: 210 }}
          resizable
          small
        >
          <ChipBody chip={chip} />
        </GlassWin>
      ))}

      {/* connect-Claude window: the key lives in localStorage, nowhere else */}
      {keyOpen && (
        <GlassWin
          id="key-win"
          title="CONNECT CLAUDE"
          onClose={() => setKeyOpen(false)}
          boxes={boxes}
          setBoxes={setBoxes}
          def={{ x: Math.max(12, innerWidth / 2 - 190), y: 160, w: 380, h: 250 }}
          small
        >
          <div className="mini-flow" aria-hidden>
            <div className="mf-box"><span className="mf-k">1</span>console.anthropic.com → API keys</div>
            <span className="mf-arrow">↓</span>
            <div className="mf-box"><span className="mf-k">2</span>paste it here — saved in THIS browser only</div>
            <span className="mf-arrow">↓</span>
            <div className="mf-box mf-box-hot"><span className="mf-k">3</span>it is sent to api.anthropic.com, nowhere else</div>
          </div>
          <input
            className="gate-input m-key-input"
            type="password"
            value={keyDraft}
            onChange={(e) => setKeyDraft(e.target.value)}
            placeholder="sk-ant-…"
            aria-label="Anthropic API key"
          />
          <div className="m-key-row">
            <button
              className="gate-btn m-key-save"
              disabled={keyDraft.trim().length < 10}
              onClick={() => { setApiKey(keyDraft); setHasKey(true); setKeyDraft(""); setKeyOpen(false); setError(""); }}
              data-hover
            >
              Save key
            </button>
            {hasKey && (
              <button className="nd-ghost" onClick={() => { clearApiKey(); setHasKey(false); }} data-hover>
                forget key
              </button>
            )}
          </div>
        </GlassWin>
      )}
    </div>
  );
}
