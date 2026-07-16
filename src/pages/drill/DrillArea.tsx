import { useEffect, useState } from "react";
import GlitchText from "../../components/GlitchText";
import AnomalyHub from "../../components/AnomalyHub";
import { unlockAny, type Drill, type Tier } from "../../lib/drill-crypto";
import type { Route } from "../../router";
import Dashboard from "./Dashboard";
import DailyDrill from "./DailyDrill";
import Artifacts from "./Artifacts";
import Mentor from "./mentor/Mentor";
import SyncWidget from "./SyncWidget";
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
  // Edge-nav layout: vertical or horizontal, and foldable behind its switch.
  const [navH, setNavH] = useState(() => localStorage.getItem("nav-h") === "1");
  const [navHidden, setNavHidden] = useState(() => localStorage.getItem("nav-hide") === "1");
  // Persist via effect - updaters must stay pure (StrictMode runs them twice).
  const flipNav = () => setNavH((v) => !v);
  const foldNav = () => setNavHidden((v) => !v);
  useEffect(() => {
    localStorage.setItem("nav-h", navH ? "1" : "0");
    localStorage.setItem("nav-hide", navHidden ? "1" : "0");
  }, [navH, navHidden]);
  const [drills, setDrills] = useState<Drill[] | null>(null);
  const [tier, setTier] = useState<Tier>("full");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [booting, setBooting] = useState(false);

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
      sessionStorage.setItem(SESSION_KEY, password);
      if (quiet) {
        setDrills(result.drills);
        setTier(result.tier);
        return;
      }
      // The anomaly accepts: gate fades and zooms away, then the UI
      // glitch-loads in around it.
      setLeaving(true);
      setTimeout(() => {
        setDrills(result.drills);
        setTier(result.tier);
        setBooting(true);
        setTimeout(() => setBooting(false), 2600);
      }, 2200);
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
          <div className={`gate-anomaly${leaving ? " is-leaving" : ""}`} aria-hidden>
            <AnomalyHub nodes={[]} hint="" spinning={leaving} />
          </div>
          <form
            className={`gate${leaving ? " is-leaving" : ""}`}
            onSubmit={(e) => {
              e.preventDefault();
              void unlock(pass);
            }}
          >
            <p className="tag tag-dim">ENCRYPTED · AES-GCM</p>
            <h1 className="drill-h1">
              <GlitchText>DASHBOARD</GlitchText>
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
    <main className={`drill-page${booting ? " is-booting" : ""}`}>
      <nav className={`edge-nav${navH ? " is-h" : ""}${navHidden ? " is-hidden" : ""}`} aria-label="Pages">
        <button className="edge-tab edge-switch" onClick={foldNav} title={navHidden ? "Show menu" : "Hide menu"} data-hover>
          {navHidden ? "☰" : "✕"}
        </button>
        {!navHidden && (
          <button className="edge-tab edge-switch" onClick={flipNav} title="Flip menu direction" data-hover>
            ⇄
          </button>
        )}
        {!navHidden && <a href="#/" className="edge-tab edge-ext" data-hover>CV</a>}
        {!navHidden && <a href="#/drill" className={`edge-tab${route === "drill" ? " is-on" : ""}`} data-hover>Dashboard</a>}
        {!navHidden && <a href="#/drill/today" className={`edge-tab${route === "drill-today" ? " is-on" : ""}`} data-hover>Today&rsquo;s drill</a>}
        {!navHidden && <a href="#/drill/artifacts" className={`edge-tab${route === "drill-artifacts" ? " is-on" : ""}`} data-hover>Artifacts</a>}
        {!navHidden && <a href="#/drill/mentor" className={`edge-tab${route === "drill-mentor" ? " is-on" : ""}`} data-hover>Mentor</a>}
        {!navHidden && <a href="#/shake" className="edge-tab edge-ext" data-hover>Shake</a>}
        {!navHidden && tier === "open" && <span className="tier-badge edge-badge">GUEST</span>}
      </nav>

      {route === "drill" && <Dashboard drills={drills} tier={tier} />}
      {route === "drill-today" && <DailyDrill drills={drills} />}
      {route === "drill-artifacts" && <Artifacts tier={tier} />}
      {route === "drill-mentor" && <Mentor />}

      {/* git-backed sync pill: only on the personal tier — guests never
          see the token flow or the private repo */}
      {tier === "full" && <SyncWidget />}
    </main>
  );
}
