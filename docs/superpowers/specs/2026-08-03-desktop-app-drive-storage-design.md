# Desktop App + Google Drive Storage — Design

**Date:** 2026-08-03
**Author:** Dieter (with Claude)
**Status:** Approved design — ready for implementation planning

## TL;DR

- Split the current single site into two products from **one codebase**:
  - **Web (`doli4.github.io`)** — the **CV only**. Public, for recruiters. No workbench, no password gate.
  - **Desktop (`.exe`)** — the **full private workbench** (dashboard, daily drill, artifacts, mentor), wrapped in Electron.
- The desktop app stores **everything editable** in a **Google Drive folder** the user picks once. Drive for Desktop handles cross-machine sync.
- The existing `git-sync.ts` **merge logic is kept**; only its transport changes — from the GitHub Contents API + a pasted token to **reading/writing a JSON file in the Drive folder**.
- **No passwords, no token, no encryption** on desktop. Drills and news become **plain JSON files** in the Drive folder — adding a drill is "drop a file", killing the encrypt → commit → push chore.

## Why

- Updating drills today is a 3-step chore: build plaintext `drill-data/*.json`, run the encrypt script with two passwords, commit + push the `.enc` files. The user repeatedly hits "did I upload it?" friction.
- The AES-GCM encryption + password gate only exist because **GitHub Pages is public**. On a personal machine writing to the user's **private** Drive, that whole apparatus is unnecessary.
- The dashboard already has a clean, transport-agnostic sync core (pull → merge → write local → push over one JSON snapshot). Swapping the transport is a small, well-bounded change.
- The user wants the private workbench off the public web entirely; the public site should be just the CV.

## Scope

**In scope**
- Electron shell producing a Windows `.exe`.
- A build split: `build:web` (CV only) and `build:desktop` (full workbench).
- A pluggable storage backend; a **Drive-file backend** for desktop.
- First-run Drive-folder picker + folder scaffolding.
- Reading drills and news as plain JSON from the Drive folder (desktop).
- Removing the password/unlock gate and drill decryption from the desktop path.

**Out of scope (YAGNI)**
- Google Drive **API/OAuth** integration (rejected — see Approaches). We rely on Drive for Desktop mounting the folder.
- Code-signing the `.exe` (personal use; SmartScreen warning is acceptable and documented).
- Tauri (rejected in favour of Electron, which the user already knows from the Stash app).
- Any change to the CV content itself.
- Real-time/multi-user collaboration beyond the existing offline-merge safety.
- macOS/Linux packaging (Windows-only for now).

## Approaches considered

1. **Electron + mounted Drive folder (CHOSEN).** Drive for Desktop mounts Drive as a normal folder; the app reads/writes files there. No auth code, no API keys. The user already ships an Electron app (Stash), so the shell is low-risk. Downside: requires Drive for Desktop installed to actually sync (degrades gracefully to a local, non-syncing folder if not).
2. **Electron + Google Drive API (OAuth).** "Proper" programmatic Drive access, no dependency on Drive for Desktop. Rejected: needs a Google Cloud project, an OAuth installed-app flow, token storage/refresh, and possibly app verification — heavy plumbing for a single user, and reintroduces the token-paste UX we are trying to remove.
3. **Tauri + mounted Drive folder.** Same storage model, ~5MB binary instead of ~100MB. Rejected: needs a Rust toolchain and is unfamiliar; Electron is the lower-risk path given the Stash precedent.

## Architecture

### One codebase, two build targets

A Vite build-time flag (e.g. `VITE_TARGET` = `web` | `desktop`) drives two outputs:

- **`web`**: router exposes only the `home` (CV) route. The `drill*` routes, the sync engine, the drill-crypto module, and the password gate are **excluded** (behind a dynamic import / conditional so Vite tree-shakes them out of the web bundle). This is what deploys to GitHub Pages.
- **`desktop`**: router exposes all routes. Uses the Drive-file storage backend. No password gate. Packaged by electron-builder.

Shared, unchanged in both: `AnomalousMatter`, cursors, `Themer`, `GlitchText`, global styles — the common chrome.

### Electron shell (mirrors the Stash app)

- **`electron/main.ts`** — creates the `BrowserWindow`, loads the built `index.html`, and registers IPC handlers:
  - `pickFolder()` — native folder picker, returns the chosen Drive path.
  - `readData()` / `writeData(snapshot)` — read/write `<root>/anomaly-data.json`.
  - `listDrills()` / `readDrill(name)` — enumerate/read `<root>/drills/*.json`.
  - `readNews()` / `writeNews(json)` — read/write `<root>/news.json`.
  - Config (chosen folder path) persisted via `electron-store` (or a small JSON in userData).
- **`electron/preload.ts`** — `contextBridge` exposes a minimal, typed `window.desktop` API. `contextIsolation: true`, `nodeIntegration: false`.
- **First run**: if no folder is configured, show a one-screen prompt → `pickFolder()` → scaffold `<root>/anomaly/` containing `anomaly-data.json` (empty snapshot), `drills/` (seeded with the current drill set as plain JSON), and `news.json`.

### Storage backend abstraction

Introduce a small interface so the sync core is transport-agnostic:

```
interface SyncBackend {
  load(): Promise<Snapshot | null>;   // "remote" read
  save(snapshot: Snapshot): Promise<void>;   // "remote" write
}
```

- **`driveFileBackend`** (desktop): `load` = read `anomaly-data.json` via `window.desktop.readData`; `save` = write it back. The file lives in the Drive folder, so Drive for Desktop syncs it.
- `git-sync.ts` is refactored so its **`merge`, `sanitize`, `readLocal`, `writeLocal` logic is unchanged** and it calls the backend for the two I/O ends. The GitHub-specific code (base64 over the Contents API, token handling, SHA/409 races) is **removed from the desktop path**.
- The web build has **no sync at all** (the CV has no personal state), so no backend ships there.

### Sync behaviour on desktop

- **On launch and on window focus**: `load()` → `merge` with local → `writeLocal`. This adopts anything Drive pulled in from the other machine.
- **On change (debounced)**: `writeLocal` already happens; also `save()` the merged snapshot to the Drive file.
- The existing offline-merge (`merge` / `mergeById`, local-wins-on-same-id, xp-grows, caps) protects against Drive "conflict copies" and two-machine edits — same guarantees as today, minus the token.
- The `SyncWidget` UI simplifies from "paste token + SYNC" to a small **status pill** (e.g. "Synced · 14:32" / "Drive folder not set"). A manual "Sync now" stays available but is no longer required.

### Drills & news as plain files

- Desktop **`drill-crypto` is not used**. Drills load as plain JSON from `<root>/drills/*.json` via `listDrills`/`readDrill`, sorted newest-first (same shape the app already expects).
- The two-tier personal/open split and `askSenior` stripping are **not needed** on desktop (no shareable guest tier here) — a single set of drills.
- News loads from `<root>/news.json`, editable directly.
- The `drill-data/` → encrypt → `drills.enc` pipeline is **retired for desktop** (the web build no longer has drills at all, so it retires there too).

## Data model (on Drive)

```
<Google Drive>/anomaly/
  anomaly-data.json     # the synced snapshot (SyncData: mentor-history, mentor-xp,
                        #   drill-artifacts, drill-said, news-history)
  drills/
    drill-2026-08-03.json    # plain-JSON drills (Drill shape from drill-crypto.ts)
    drill-2026-07-28.json
    ...
  news.json             # the news feed
```

`SyncData` and the `Drill` type are unchanged from today's `git-sync.ts` / `drill-crypto.ts` definitions.

## Error handling

- **No Drive folder set** → app runs, workbench visible, a clear banner "Point me at your Drive folder to save your progress"; `save`/`load` are no-ops until set.
- **Drive for Desktop not installed** → the chosen folder is just a local folder; the app works, nothing syncs; a one-line note explains why.
- **`anomaly-data.json` malformed** → the existing `sanitize()` already tolerates a bad remote key-by-key; a fully unreadable file falls back to local and does **not** overwrite until the next clean write (never destroy on a parse failure).
- **A drill file is invalid JSON** → skip it with a console warning (same tolerance as the encryptor's per-file skip), never crash the drill list.
- **File write fails (permissions/locked)** → surface a plain-language toast; local state is retained so nothing is lost.

## Testing

- **Merge logic** (`merge`, `mergeById`, `sanitize`) — keep/extend the existing unit coverage; it is the highest-risk logic and is transport-independent.
- **`driveFileBackend`** — unit test `load`/`save` against a temp directory (fs), including the malformed-file fallback path.
- **Drill loader** — given a folder with valid + one invalid JSON, returns only the valid drills, newest-first.
- **Build split** — assert the web bundle excludes drill/sync/crypto modules (e.g. the built web `index` has no reference to the workbench routes).
- **Electron IPC** — smoke test that `pickFolder`/`readData`/`writeData` round-trip through the preload bridge.

## Rollout / safety

- The web (CV) build and the desktop build come from one repo; shipping the web CV is unaffected by desktop work until the split flag is wired.
- First real use: pick the Drive folder, let the app scaffold it, confirm `anomaly-data.json` appears in Drive and syncs to the second machine before trusting it as the only home for progress.
- Keep the current GitHub-PAT sync working until the Drive backend is verified end-to-end, then remove it.

## Open questions / decisions deferred to the plan

- Exact build-flag mechanism (Vite mode vs env var) and how the router conditionally excludes workbench routes cleanly.
- Whether to auto-seed `drills/` from the current `drill-data/` set on first run, or ship them inside the app and copy on first launch.
- electron-builder target: NSIS installer vs portable single `.exe` (portable is likely simpler for personal use).
