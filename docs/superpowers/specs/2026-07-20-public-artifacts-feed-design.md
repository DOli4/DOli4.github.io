# Public artifacts feed + news hot-links — design

**Date:** 2026-07-20
**Status:** approved for planning

## Goal

Change how the dashboard's storage behaves so that:

1. The site **always pulls artifacts from a shared "database"** on load, showing
   only artifacts **not** marked `personal` — no token required.
2. **Personal** artifacts only appear after a **Sync** (which needs the PAT).
3. The **News** window becomes a grid of live **hot links** to news outlets
   instead of the daily AI-news feed.

## Current state (what exists today)

- The site is the **public** GitHub Pages repo `DOli4/DOli4.github.io`
  (`C:\Cluade`). Deploy = Vite `npm run build` of `public/` → `dist/`, published
  to Pages. Files in `public/` are world-readable **as of the last build**.
- **Artifacts** (`src/lib/artifacts.ts`) live in `localStorage` only, mirrored to
  the **private** `DOli4/site-data` repo on sync (`src/lib/git-sync.ts`). A guest,
  or Dieter on a fresh device, sees an **empty** vault until they sync with the PAT.
  Nothing about artifacts is currently pulled publicly.
- Each artifact already has a `personal?: boolean` flag, and
  `visibleArtifacts(list, tier)` already hides personal ones from the `open`
  (guest) tier. Tier (`full` vs `open`) is decided by which encrypted drill
  payload the entered password decrypts (`src/lib/drill-crypto.ts`).
- **News**: `src/pages/drill/canvas/FloatPanel.tsx` fetches `public/news.json`
  (a daily-committed AI-news file) and renders WHAT / WHY / FOR-YOU cards, archiving
  days into the `news-history` localStorage key (also part of the sync payload).

## The constraint that shapes the design

`site-data` is **private** — a browser cannot read it without the PAT. So the
non-personal data that "everyone pulls" must live in a **public** place. And
because the deployed site serves the **build-time** copy of `public/`, a file
written to the repo via the API would not appear on the live site until a rebuild.

**Resolution:** the public feed is a committed file, but the live site **reads it
from the raw GitHub URL of `main`**, which reflects the repo immediately without a
rebuild. The bundled `dist/` copy is only a stale fallback.

## Architecture

```
                    ┌─ PUBLIC feed (non-personal only) ───────────┐
   Everyone,     ──▶│  public/artifacts-public.json (this repo)    │──▶ vault shows
   no token,        │  read LIVE via raw.githubusercontent.com/main│    non-personal
   on load          └─────────────────────────────────────────────┘
                    ┌─ PRIVATE snapshot (full set incl personal) ──┐
   Dieter,       ──▶│  DOli4/site-data  (unchanged)                │──▶ personal
   on Sync (PAT)    └──────────────────────────────────────────────┘    appear too
```

### Feature 1 — public artifacts feed

**Public file** — `public/artifacts-public.json`, committed to `DOli4.github.io`:

```json
{ "savedAt": "2026-07-20T09:00:00.000Z", "items": [ /* Artifact[], personal stripped */ ] }
```

Invariant: **this file never contains an artifact with `personal: true`.** It is
world-readable; that is the whole point (recruiters/guests are meant to see it).

**Constants** (in `src/lib/artifacts.ts`):

- `PUBLIC_REPO = "DOli4/DOli4.github.io"`
- `PUBLIC_FILE_PATH = "public/artifacts-public.json"`
- `PUBLIC_RAW_URL = "https://raw.githubusercontent.com/DOli4/DOli4.github.io/main/public/artifacts-public.json"`

**Read path (everyone, no token), on load:**

1. `fetchPublicArtifacts()` → `GET PUBLIC_RAW_URL` (`cache: "no-store"`). On 404 /
   network error → `[]`. On success → `items` (already non-personal).
   Fallback chain: raw URL → bundled `/artifacts-public.json` → `[]`.
2. `localList = loadArtifacts()` (localStorage — this device's cache, may hold
   personal items from a prior sync and any unsynced local adds).
3. **Display list** = merge by `id`:
   - non-personal: union of remote-public and local non-personal (local wins on a
     shared id, matching the existing `mergeById` "local wins" rule).
   - personal: from `localList` only (guests have none).
   Then `visibleArtifacts(displayList, tier)` applies the tier filter as today.

The remote public feed is authoritative for the non-personal baseline — this is
the "always pull from the database" behaviour. localStorage remains the working
store for add/remove on the current device.

**Write path (Dieter, on Sync)** — extend `syncNow()` in `git-sync.ts`:

1. Existing behaviour unchanged: pull → merge → push the **full** set (incl.
   personal) to the private `site-data` snapshot.
2. **New step:** derive `nonPersonal = merged["drill-artifacts"].filter(a => !a.personal)`,
   then write `{ savedAt, items: nonPersonal }` to `PUBLIC_FILE_PATH` in
   `PUBLIC_REPO` via the GitHub Contents API (GET current sha → PUT). Skip the PUT
   when the content is unchanged (no empty commits), same discipline as the private push.
3. A public-write failure is **non-fatal** to the private sync: report it in the
   sync status but don't throw away the successful private push. (Surface a
   distinct message like "synced privately, public feed update failed — retry".)

**Token scope change:** the single fine-grained PAT must now grant **Contents
read/write on BOTH** `site-data` **and** `DOli4.github.io`. Update the setup copy
in `SyncWidget.tsx` accordingly ("Repository access: site-data and
DOli4.github.io. Permission: Contents — read and write").

**Deploy tweak:** add `paths-ignore: ['public/artifacts-public.json']` to the
`push` trigger in `.github/workflows/deploy.yml`, so a sync-only commit to the
public feed does not trigger a full site rebuild. The live read uses the raw URL,
so it needs no redeploy; the bundled copy refreshes on the next real deploy.

### Feature 2 — news hot links to outlets

Replace the AI-news feed **inside the NEWS window** with a curated grid of live
outlet cards. No fetching, no CORS.

- New data: `src/lib/news-outlets.ts` exporting
  `{ name: string; url: string; blurb: string }[]` — tech-focused starter set:
  **TechCrunch, The Verge, Ars Technica, Hacker News, MIT Technology Review,
  Wired, The Information, Anthropic blog.** Editable in one place.
- Each card: favicon + outlet name + one-line blurb; the whole card links to the
  outlet (`target="_blank"`, `rel="noopener noreferrer"`), styled with the site's
  existing glass/neon card aesthetic and hover.
- **Favicon:** load the outlet's own `https://<host>/favicon.ico` via `<img>`, with
  an `onError` fallback to a letter tile (first letter of the outlet). Keeps
  requests first-party to each outlet (no third-party favicon service, so no extra
  domain leak).
- Retire the `news.json` fetch + `news-history` archival **in `FloatPanel.tsx`**.
  Leave `public/news.json` in place (still the `LiveStats` ping target) and leave
  the `news-history` sync plumbing untouched (harmless; out of scope to remove).

## Files touched

| File | Change |
|------|--------|
| `src/lib/artifacts.ts` | Public feed constants; `fetchPublicArtifacts()`; display-merge helper |
| `src/lib/git-sync.ts` | `syncNow()` writes the non-personal subset to the public repo |
| `src/pages/drill/Artifacts.tsx` | Load = merge remote public + local, then tier-filter |
| `src/pages/drill/Dashboard.tsx` | Same merge where the dashboard shows artifacts (if it does) |
| `src/pages/drill/SyncWidget.tsx` | Updated token-scope setup copy |
| `src/pages/drill/canvas/FloatPanel.tsx` | NEWS window renders outlet hot-links; drop news.json fetch |
| `src/lib/news-outlets.ts` | **new** — curated outlet list |
| `.github/workflows/deploy.yml` | `paths-ignore` for the public feed file |
| `public/artifacts-public.json` | **new** — seeded `{ "savedAt": "", "items": [] }` so the raw URL exists |

## Testing

- **Unit:** public/personal split — `fetchPublicArtifacts` parse + 404→[]; the
  display-merge (remote non-personal ∪ local, personal local-only, ids dedup);
  the non-personal derivation used for the public write never includes a personal item.
- **Manual (guest path):** load with an empty localStorage + a seeded public feed →
  only non-personal artifacts show, no token prompt needed.
- **Manual (Dieter path):** add a personal + a non-personal artifact → Sync →
  private snapshot has both, public feed has only the non-personal one, and a
  second browser (no token) sees only the non-personal one after the raw URL updates.
- **News:** NEWS window shows the outlet grid; each card opens the live outlet;
  favicon fallback tile renders when `/favicon.ico` fails.

## Out of scope

- Fixing the existing "deletes can resurrect on merge" behaviour (documented wart).
- Removing `news-history` from the sync payload / `public/news.json`.
- Any server-side / scheduled news fetching (explicitly chose hot links instead).
- Per-artifact editing UI beyond the current add/remove.
