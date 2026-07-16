import { useEffect, useState } from "react";
import GlitchText from "../../components/GlitchText";
import { unlockAny, type Drill, type Tier } from "../../lib/drill-crypto";
import type { Route } from "../../router";
import Dashboard from "./Dashboard";
import DailyDrill from "./DailyDrill";
import Artifacts from "./Artifacts";
import "../drill.css";

const SESSION_KEY = "drill-pass";

/**
 * The single gate for everything private: dashboard, daily drill, artifacts.
 * No view behind it renders anything until the password has decrypted the
 * payload — the sub-pages receive plaintext drills as props, they never fetch
 * or hold ciphertext themselves. Without the password every one of these
 * routes is the same login form.
 */
export default function DrillArea({ route }: { route: Route }) {
  const [drills, setDrills] = useState<Drill[] | null>(null);
  const [tier, setTier] = useState<Tier>("full");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState(false);

  async function unlock(password: string, quiet = false) {
    setBusy(true);
    setError("");
    try {
      const result = await unlockAny(password);
      if (result === "missing") {
        setMissing(true);
        return;
      }
      if (result === "wrong") {
        sessionStorage.removeItem(SESSION_KEY);
        if (!quiet) setError("Wrong password.");
        return;
      }
      setDrills(result.drills);
      setTier(result.tier);
      sessionStorage.setItem(SESSION_KEY, password);
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
      <main className="drill-page">
        <div className="wrap drill-wrap">
          <p className="drill-empty">
            No drills published yet. They appear here after a workday with commits.
          </p>
        </div>
      </main>
    );
  }

  if (!drills) {
    return (
      <main className="drill-page">
        <div className="wrap drill-wrap">
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
        </div>
      </main>
    );
  }

  if (drills.length === 0) {
    return (
      <main className="drill-page">
        <div className="wrap drill-wrap">
          <p className="drill-empty">Unlocked — but nothing is published for this tier yet.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="drill-page">
      <nav className="subnav" aria-label="Drill pages">
        <a href="#/drill" className={`subtab${route === "drill" ? " is-on" : ""}`} data-hover>
          Dashboard
        </a>
        <a
          href="#/drill/today"
          className={`subtab${route === "drill-today" ? " is-on" : ""}`}
          data-hover
        >
          Today&rsquo;s drill
        </a>
        <a
          href="#/drill/artifacts"
          className={`subtab${route === "drill-artifacts" ? " is-on" : ""}`}
          data-hover
        >
          Artifacts
        </a>
        {tier === "open" && <span className="tier-badge">GUEST</span>}
      </nav>

      {route === "drill" && <Dashboard drills={drills} tier={tier} />}
      {route === "drill-today" && <DailyDrill drills={drills} />}
      {route === "drill-artifacts" && <Artifacts tier={tier} />}
    </main>
  );
}
