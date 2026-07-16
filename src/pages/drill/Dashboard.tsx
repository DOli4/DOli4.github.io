import { useMemo, useState } from "react";
import AnomalyHub, { type HubNode } from "../../components/AnomalyHub";
import { LampHeader } from "../../components/ui/lamp";
import type { Drill } from "../../lib/drill-crypto";
import {
  addArtifact,
  hostOf,
  loadArtifacts,
  normalizeUrl,
  removeArtifact,
  type Artifact,
} from "../../lib/artifacts";
import { JUMP_KEY } from "./DailyDrill";

const SAID_KEY = "drill-said";

function loadSaid(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(SAID_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/**
 * The command view: everything the drills have ever asked, in one place,
 * plus the numbers that tell him whether the system is working. The anomaly
 * hub is the door to the two sub-pages; artifacts are manageable right here
 * as well as on their own page.
 */
export default function Dashboard({ drills }: { drills: Drill[] }) {
  const [artifacts, setArtifacts] = useState<Artifact[]>(loadArtifacts);

  const stats = useMemo(() => {
    const said = loadSaid();
    const questions = drills.flatMap((d) => d.questions);
    const terms = new Set<string>();
    drills.forEach((d) => {
      d.questions.forEach((q) => q.mustSay.forEach((w) => terms.add(w.toLowerCase())));
      terms.add(d.word.term.toLowerCase());
    });
    const saidCount = Object.values(said).filter(Boolean).length;
    const mustSayTotal = questions.reduce((n, q) => n + q.mustSay.length, 0);
    return {
      days: drills.length,
      questions: questions.length,
      terms: terms.size,
      saidCount,
      mustSayTotal,
    };
  }, [drills]);

  const nodes = useMemo<HubNode[]>(() => {
    const base: HubNode[] = [
      { id: "today", label: "TODAY'S DRILL", href: "#/drill/today" },
      { id: "bank", label: "QUESTION BANK", href: "#bank" },
      { id: "vault", label: "ARTIFACTS", href: "#/drill/artifacts" },
    ];
    const pinned = artifacts.slice(0, 3).map((a) => ({
      id: a.id,
      label: a.title.length > 18 ? `${a.title.slice(0, 17)}…` : a.title,
      href: a.url,
      external: true,
    }));
    return [...base, ...pinned];
  }, [artifacts]);

  const latest = drills[0];

  return (
    <>
      <LampHeader
        eyebrow={`${stats.days} ${stats.days === 1 ? "DAY" : "DAYS"} · ${stats.questions} QUESTIONS · ${stats.terms} TERMS`}
        title="DASHBOARD"
        sub={latest ? `latest drill ${latest.date} — ${latest.focus}` : undefined}
      />

      <div className="wrap drill-wrap dash-wrap">
        <section className="dash-grid">
          <div className="dash-hub">
            <AnomalyHub nodes={nodes} />
          </div>

          <div className="dash-side">
            <div className="stat-card">
              <p className="tag tag-dim">THE ONE WORD · {latest?.date}</p>
              <p className="stat-word">{latest?.word.term}</p>
              <p className="stat-word-sub">{latest?.word.meaning}</p>
              <a className="stat-link" href="#/drill/today" data-hover>
                drill it →
              </a>
            </div>

            <div className="stat-row">
              <div className="stat-card stat-mini">
                <p className="stat-num">{stats.saidCount}</p>
                <p className="stat-cap">words said out loud</p>
              </div>
              <div className="stat-card stat-mini">
                <p className="stat-num">
                  {stats.mustSayTotal === 0
                    ? "—"
                    : `${Math.round((stats.saidCount / stats.mustSayTotal) * 100)}%`}
                </p>
                <p className="stat-cap">of must-say words ticked</p>
              </div>
            </div>

            <div className="stat-card">
              <p className="tag tag-dim">ASK TREVOR</p>
              <p className="stat-ask">{latest?.askSenior}</p>
            </div>
          </div>
        </section>

        <section className="drill-sec" id="bank">
          <h2 className="drill-h2">
            <span className="drill-num">01</span> Question bank — every question, one place
          </h2>
          <p className="drill-hint">
            Reading is browsing. Answering out loud is training — press a day to train it.
          </p>
          {drills.map((d) => (
            <BankDay key={d.date} drill={d} />
          ))}
        </section>

        <section className="drill-sec">
          <h2 className="drill-h2">
            <span className="drill-num">02</span> Artifacts
          </h2>
          <p className="drill-hint">
            Save a link (a shared Claude artifact, a doc, anything). It's stored in this browser
            only. Full manager on the{" "}
            <a className="stat-link" href="#/drill/artifacts" data-hover>
              artifacts page →
            </a>
          </p>
          <ArtifactQuickAdd onChange={setArtifacts} />
          {artifacts.length > 0 && (
            <ul className="art-list art-list-compact">
              {artifacts.slice(0, 5).map((a) => (
                <li key={a.id} className="art-row">
                  <a href={a.url} target="_blank" rel="noopener noreferrer" data-hover>
                    {a.title}
                  </a>
                  <span className="art-host">{hostOf(a.url)}</span>
                  <button
                    className="art-del"
                    onClick={() => setArtifacts(removeArtifact(a.id))}
                    aria-label={`Delete ${a.title}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function BankDay({ drill }: { drill: Drill }) {
  const openDay = () => {
    sessionStorage.setItem(JUMP_KEY, drill.date);
    window.location.hash = "#/drill/today";
  };
  return (
    <article className="bank-day">
      <header className="bank-head">
        <div>
          <p className="bank-date">{drill.date}</p>
          <p className="bank-focus">{drill.focus}</p>
        </div>
        <button className="q-btn bank-open" onClick={openDay} data-hover>
          train this day →
        </button>
      </header>
      <ul className="bank-qs">
        {drill.questions.map((q, i) => (
          <li key={i}>
            <span className="bank-q">{q.q}</span>
            <span className="bank-words">{q.mustSay.join(" · ")}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function ArtifactQuickAdd({ onChange }: { onChange: (list: Artifact[]) => void }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = normalizeUrl(url);
    if (!clean) {
      setErr("That doesn't look like a link.");
      return;
    }
    setErr("");
    onChange(addArtifact(title, clean));
    setTitle("");
    setUrl("");
  }

  return (
    <form className="art-add" onSubmit={submit}>
      <input
        className="gate-input art-in"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="name (optional)"
        aria-label="Artifact name"
      />
      <input
        className="gate-input art-in art-in-url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="paste the link"
        aria-label="Artifact link"
        required
      />
      <button className="gate-btn art-btn" disabled={!url.trim()}>
        Save
      </button>
      {err && <p className="gate-err">{err}</p>}
    </form>
  );
}
