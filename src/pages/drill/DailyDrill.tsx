import { useEffect, useMemo, useState } from "react";
import GlitchText from "../../components/GlitchText";
import type { Drill as DrillType } from "../../lib/drill-crypto";

const SAID_KEY = "drill-said";
/** Dashboard links set this before navigating, so "open that day" lands on it. */
export const JUMP_KEY = "drill-jump-date";

/** Which must-say words he's ticked, across sessions: { "2026-07-15|0|projection": true } */
function loadSaid(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(SAID_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export default function DailyDrill({ drills }: { drills: DrillType[] }) {
  // Read the jump target in the initializer, but CLEAR it in an effect:
  // StrictMode runs initializers twice, so a removeItem here would eat the
  // key on the first pass and the second pass would land on the wrong day.
  const [activeDate, setActiveDate] = useState<string | null>(() => {
    const jump = sessionStorage.getItem(JUMP_KEY);
    return jump && drills.some((d) => d.date === jump) ? jump : (drills[0]?.date ?? null);
  });
  useEffect(() => {
    sessionStorage.removeItem(JUMP_KEY);
  }, []);

  const drill = drills.find((d) => d.date === activeDate) ?? drills[0];

  return (
    <div className="wrap drill-wrap">
      <header className="drill-head">
        <div>
          <p className="tag tag-dim">SPEAK IT · DON'T READ IT</p>
          <h1 className="drill-h1">
            <GlitchText>DRILL</GlitchText>
          </h1>
          <p className="drill-focus">{drill.focus}</p>
        </div>
        <select
          className="drill-date"
          value={drill.date}
          onChange={(e) => setActiveDate(e.target.value)}
          aria-label="Pick a drill day"
        >
          {drills.map((d) => (
            <option key={d.date} value={d.date}>
              {d.date}
            </option>
          ))}
        </select>
      </header>

      <WordOfDay drill={drill} />

      <section className="drill-sec">
        <h2 className="drill-h2">
          <span className="drill-num">01</span> Say it out loud
        </h2>
        <p className="drill-hint">
          Read the question. Answer it out loud, properly, like a real interview. Only then reveal —
          and tick the words you actually said.
        </p>
        {drill.questions.map((q, i) => (
          <Question key={i} q={q} date={drill.date} index={i} />
        ))}
      </section>

      <section className="drill-sec">
        <h2 className="drill-h2">
          <span className="drill-num">02</span> Lingo swap
        </h2>
        <div className="lingo">
          {drill.lingo.map((row, i) => (
            <div className="lingo-row" key={i}>
              <span className="lingo-was">{row.natural}</span>
              <span className="lingo-arrow">→</span>
              <span className="lingo-is">{row.better}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="drill-sec">
        <h2 className="drill-h2">
          <span className="drill-num">03</span> From before
        </h2>
        <p className="drill-hint">
          Older terms, asked cold. You won't remember to revise — so this is the revision.
        </p>
        <ul className="recall">
          {drill.fromBefore.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </section>

      {drill.askSenior && (
        <section className="drill-sec">
          <h2 className="drill-h2">
            <span className="drill-num">04</span> Ask Trevor tomorrow
          </h2>
          <p className="ask">{drill.askSenior}</p>
        </section>
      )}
    </div>
  );
}

function WordOfDay({ drill }: { drill: DrillType }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="word">
      <p className="tag tag-dim">THE ONE WORD FOR {drill.date}</p>
      <h2 className="word-term">{drill.word.term}</h2>
      <p className="word-meaning">{drill.word.meaning}</p>
      {open ? (
        <div className="word-more">
          <p className="word-label">Say exactly this</p>
          <p className="word-say">“{drill.word.sentence}”</p>
          <p className="word-label">How they know you mean it</p>
          <p className="word-give">{drill.word.giveaway}</p>
        </div>
      ) : (
        <button className="word-btn" onClick={() => setOpen(true)}>
          Say it first, then reveal
        </button>
      )}
    </section>
  );
}

function Question({
  q,
  date,
  index,
}: {
  q: DrillType["questions"][number];
  date: string;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const [said, setSaid] = useState<Record<string, boolean>>(loadSaid);

  const keyFor = (w: string) => `${date}|${index}|${w}`;
  const hitCount = useMemo(
    () => q.mustSay.filter((w) => said[keyFor(w)]).length,
    [said, q.mustSay, date, index],
  );

  function toggle(w: string) {
    // Re-read before writing: sync (or another Question) may have updated
    // the map since this component mounted — never stomp it with stale state.
    const next = { ...loadSaid(), [keyFor(w)]: !said[keyFor(w)] };
    setSaid(next);
    localStorage.setItem(SAID_KEY, JSON.stringify(next));
  }

  return (
    <article className={`q${open ? " is-open" : ""}`}>
      <p className="q-text">{q.q}</p>

      {!open ? (
        <button className="q-btn" onClick={() => setOpen(true)}>
          I answered it out loud — reveal
        </button>
      ) : (
        <div className="q-body">
          <p className="q-label">
            Words it needed{" "}
            <span className="q-score">
              {hitCount}/{q.mustSay.length} said
            </span>
          </p>
          <div className="chips">
            {q.mustSay.map((w) => (
              <button
                key={w}
                className={`chip${said[keyFor(w)] ? " is-said" : ""}`}
                onClick={() => toggle(w)}
                aria-pressed={!!said[keyFor(w)]}
              >
                {w}
              </button>
            ))}
          </div>
          <p className="q-label">The shape</p>
          <p className="q-shape">{q.shape}</p>
        </div>
      )}
    </article>
  );
}
