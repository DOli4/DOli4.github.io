import { useEffect, useMemo, useState } from "react";
import GlitchText from "../components/GlitchText";
import { decryptDrills, fetchPayload, type Drill as DrillType } from "../lib/drill-crypto";
import "./drill.css";

const SESSION_KEY = "drill-pass";
const SAID_KEY = "drill-said";

/** Which must-say words he's ticked, across sessions: { "2026-07-15|0|projection": true } */
function loadSaid(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(SAID_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export default function Drill() {
  const [drills, setDrills] = useState<DrillType[] | null>(null);
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState(false);
  const [activeDate, setActiveDate] = useState<string | null>(null);

  async function unlock(password: string, quiet = false) {
    setBusy(true);
    setError("");
    try {
      const payload = await fetchPayload();
      if (!payload) {
        setMissing(true);
        return;
      }
      const result = await decryptDrills(payload, password);
      setDrills(result);
      setActiveDate(result[0]?.date ?? null);
      sessionStorage.setItem(SESSION_KEY, password);
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      if (!quiet) setError("Wrong password.");
    } finally {
      setBusy(false);
    }
  }

  // Stay unlocked across reloads within the tab, so a refresh isn't a re-login.
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) void unlock(saved, true);
  }, []);

  if (missing) {
    return (
      <Shell>
        <p className="drill-empty">
          No drills published yet. They appear here after a workday with commits.
        </p>
      </Shell>
    );
  }

  if (!drills) {
    return (
      <Shell>
        <form
          className="gate"
          onSubmit={(e) => {
            e.preventDefault();
            void unlock(pass);
          }}
        >
          <p className="tag tag-dim">ENCRYPTED · AES-GCM</p>
          <h1 className="drill-h1">
            <GlitchText>DRILL</GlitchText>
          </h1>
          <p className="gate-sub">
            Private. The payload is ciphertext until the password decrypts it.
          </p>
          <input
            className="gate-input"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="password"
            aria-label="Password"
            autoFocus
          />
          <button className="gate-btn" disabled={busy || !pass}>
            {busy ? "Decrypting…" : "Unlock"}
          </button>
          {error && <p className="gate-err">{error}</p>}
        </form>
      </Shell>
    );
  }

  const drill = drills.find((d) => d.date === activeDate) ?? drills[0];

  return (
    <Shell>
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
        <p className="drill-hint">Older terms, asked cold. You won't remember to revise — so this is the revision.</p>
        <ul className="recall">
          {drill.fromBefore.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="drill-sec">
        <h2 className="drill-h2">
          <span className="drill-num">04</span> Ask Trevor tomorrow
        </h2>
        <p className="ask">{drill.askSenior}</p>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="drill-page">
      <div className="wrap drill-wrap">{children}</div>
    </main>
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

function Question({ q, date, index }: { q: DrillType["questions"][number]; date: string; index: number }) {
  const [open, setOpen] = useState(false);
  const [said, setSaid] = useState<Record<string, boolean>>(loadSaid);

  const keyFor = (w: string) => `${date}|${index}|${w}`;
  const hitCount = useMemo(
    () => q.mustSay.filter((w) => said[keyFor(w)]).length,
    [said, q.mustSay, date, index],
  );

  function toggle(w: string) {
    const next = { ...said, [keyFor(w)]: !said[keyFor(w)] };
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
