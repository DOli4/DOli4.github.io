import { useEffect, useRef, useState } from "react";
import GlassWin, { loadLayout, type Box } from "./canvas/GlassWin";
import { clearSyncToken, getSyncMeta, getSyncToken, setSyncToken, syncNow } from "../../lib/git-sync";

const LAYOUT_KEY = "sync-layout";

/**
 * The ⇅ SYNC pill (bottom center, every gated page) + its setup window.
 * One press = pull from the private repo, merge, push back. Auto-syncs once
 * on mount when a token is already saved, so each machine starts fresh.
 */
export default function SyncWidget() {
  const [open, setOpen] = useState(false);
  const [boxes, setBoxes] = useState<Record<string, Box>>(() => loadLayout(LAYOUT_KEY));
  const [hasToken, setHasToken] = useState(() => !!getSyncToken());
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  // a failed quiet sync must not stay invisible — the pill turns warning-red
  const [failed, setFailed] = useState(false);
  const [lastSync, setLastSync] = useState(() => getSyncMeta()?.lastSync ?? null);
  const autoRan = useRef(false);

  useEffect(() => { localStorage.setItem(LAYOUT_KEY, JSON.stringify(boxes)); }, [boxes]);

  async function run() {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const r = await syncNow();
      setLastSync(r.at);
      setFailed(false);
      setStatus(r.pushed ? `synced — ${r.entries} exercises safe in git` : "already up to date");
    } catch (err) {
      // quiet runs surface here too: the message waits in the window and the
      // pill flips to its warning look (an expired token must never hide)
      setFailed(true);
      setError(err instanceof Error ? err.message : "Sync broke — try again.");
    } finally {
      setBusy(false);
    }
  }

  // one quiet pull-merge-push per visit, so the other machine's work shows up
  useEffect(() => {
    if (autoRan.current) return; // StrictMode runs effects twice in dev
    autoRan.current = true;
    if (getSyncToken()) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <button
        className={`sync-pill${hasToken ? " is-linked" : ""}${failed ? " is-err" : ""}`}
        onClick={() => setOpen(true)}
        title={failed ? "Sync failed — open to fix" : "Sync your data to the private git repo"}
        data-hover
      >
        <span className="intel-tab-dot" aria-hidden /> {busy ? "SYNCING…" : failed ? "SYNC !" : "SYNC"}
      </button>

      {open && (
        <GlassWin
          id="sync-win"
          title="GIT SYNC"
          onClose={() => setOpen(false)}
          boxes={boxes}
          setBoxes={setBoxes}
          def={{ x: Math.max(12, innerWidth / 2 - 200), y: 130, w: 400, h: 330 }}
          small
        >
          <div className="mini-flow" aria-hidden>
            <div className="mf-box"><span className="mf-k">WHAT</span>history · XP · artifacts · drill ticks · news</div>
            <span className="mf-arrow">↓</span>
            <div className="mf-box"><span className="mf-k">WHERE</span>github.com/DOli4/site-data — PRIVATE repo</div>
            <span className="mf-arrow">↓</span>
            <div className="mf-box mf-box-hot"><span className="mf-k">HOW</span>pull → merge (nothing lost) → push</div>
          </div>

          {!hasToken && (
            <>
              <p className="intel-note">
                One-time: GitHub → Settings → Developer settings → Fine-grained tokens.
                Repository access: <b>only site-data</b>. Permission: <b>Contents — read and write</b>.
              </p>
              <input
                className="gate-input m-key-input"
                type="password"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="github_pat_…"
                aria-label="GitHub fine-grained token"
              />
            </>
          )}

          <div className="m-key-row">
            {!hasToken ? (
              <button
                className="gate-btn m-key-save"
                disabled={draft.trim().length < 10}
                onClick={() => { setSyncToken(draft); setHasToken(true); setDraft(""); void run(); }}
                data-hover
              >
                Save & sync
              </button>
            ) : (
              <>
                <button className="gate-btn m-key-save" disabled={busy} onClick={() => void run()} data-hover>
                  {busy ? "Syncing…" : "SYNC NOW"}
                </button>
                <button className="nd-ghost" onClick={() => { clearSyncToken(); setHasToken(false); setStatus(""); }} data-hover>
                  forget token
                </button>
              </>
            )}
          </div>

          {hasToken && (
            <p className="sync-last">deleted things can come back after a sync — the merge keeps everything</p>
          )}
          {lastSync && <p className="sync-last">last sync {lastSync.slice(0, 16).replace("T", " ")}</p>}
          {status && <p className="sync-ok" role="status">{status}</p>}
          {error && <p className="gate-err m-err" role="alert">{error}</p>}
        </GlassWin>
      )}
    </>
  );
}
