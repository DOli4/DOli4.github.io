# Public Artifacts Feed + News Hot-Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the artifacts vault always pull its non-personal items from a world-readable public feed on load, reveal personal items only after a Sync, and replace the news feed with a grid of live outlet hot-links.

**Architecture:** A committed `public/artifacts-public.json` holds only non-personal artifacts and is read LIVE via the repo's raw GitHub URL (no token, reflects the file immediately — the deployed `dist/` copy is a stale fallback). `syncNow()` keeps pushing the full set to the private `site-data` repo and additionally writes the personal-stripped subset to the public file via the GitHub Contents API. The news window renders a static curated outlet list instead of fetching `news.json`.

**Tech Stack:** React 18 + TypeScript, Vite, `@xyflow/react`, GitHub Contents API, Vitest (added here for the pure-logic safety tests).

## Global Constraints

- Personal artifacts (`personal: true`) MUST NEVER be written to `public/artifacts-public.json`. This is the invariant the feature rests on.
- Public repo: `DOli4/DOli4.github.io`. Private snapshot repo: `DOli4/site-data` (unchanged).
- Public raw read URL: `https://raw.githubusercontent.com/DOli4/DOli4.github.io/main/public/artifacts-public.json`.
- No empty commits: skip the public PUT when the `items` payload is byte-identical to what's already there.
- A public-feed write failure MUST NOT throw away a successful private sync — surface it, don't abort.
- Keep the existing `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` commit trailer.
- Existing `visibleArtifacts(list, tier)` tier filtering stays the final gate before render.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/lib/artifacts.ts` (modify) | Public-feed constants; `stripPersonal`, `mergeForDisplay`, `fetchPublicArtifacts` |
| `src/lib/artifacts.test.ts` (create) | Unit tests for the two pure helpers (the safety invariant) |
| `vitest.config.ts` (create) | Node-env Vitest config scoped to `src/**/*.test.ts` |
| `src/lib/useArtifacts.ts` (create) | Hook: sync-load local + async-merge remote public feed |
| `src/lib/git-sync.ts` (modify) | `writePublicArtifacts()`; `syncNow()` publishes the non-personal subset |
| `src/pages/drill/Artifacts.tsx` (modify) | Use `useArtifacts` instead of `loadArtifacts` |
| `src/pages/drill/Dashboard.tsx` (modify) | Use `useArtifacts` instead of `loadArtifacts` |
| `src/pages/drill/SyncWidget.tsx` (modify) | Updated token-scope copy; surface public-feed errors |
| `src/lib/news-outlets.ts` (create) | Curated tech outlet list + host helper |
| `src/pages/drill/canvas/FloatPanel.tsx` (modify) | NEWS window renders outlet hot-links; drop `news.json` fetch |
| `src/pages/drill.css` (modify) | Styles for the outlet grid |
| `public/artifacts-public.json` (create) | Seed `{ "savedAt": "", "items": [] }` so the raw URL exists |
| `.github/workflows/deploy.yml` (modify) | `paths-ignore` for the public feed file |
| `package.json` (modify) | `vitest` devDep + `test` script |

---

## Task 1: Public-feed data layer + safety tests

**Files:**
- Modify: `src/lib/artifacts.ts`
- Create: `src/lib/artifacts.test.ts`
- Create: `vitest.config.ts`
- Create: `public/artifacts-public.json`
- Modify: `package.json`

**Interfaces:**
- Produces:
  - `stripPersonal(list: Artifact[]): Artifact[]`
  - `mergeForDisplay(local: Artifact[], remotePublic: Artifact[]): Artifact[]`
  - `fetchPublicArtifacts(): Promise<Artifact[]>`
  - `PUBLIC_REPO`, `PUBLIC_FILE_PATH`, `PUBLIC_RAW_URL` string consts

- [ ] **Step 1: Add Vitest and the test script**

Run: `npm install -D vitest`

Then in `package.json`, add to `"scripts"`:

```json
    "test": "vitest run"
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

// Pure-logic tests only — node env, no DOM. Colocated as src/**/*.test.ts.
export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

- [ ] **Step 3: Write the failing test** (`src/lib/artifacts.test.ts`)

```ts
import { describe, it, expect } from "vitest";
import { stripPersonal, mergeForDisplay, type Artifact } from "./artifacts";

const A = (id: string, over: Partial<Artifact> = {}): Artifact => ({
  id, title: id, url: `https://example.com/${id}`, addedAt: "2026-07-20", ...over,
});

describe("stripPersonal", () => {
  it("drops personal artifacts, keeps the rest", () => {
    const out = stripPersonal([A("a"), A("b", { personal: true }), A("c")]);
    expect(out.map((x) => x.id)).toEqual(["a", "c"]);
  });
});

describe("mergeForDisplay", () => {
  it("unions remote + local, local wins on a shared id, newest-first", () => {
    const remote = [A("r", { addedAt: "2026-07-01", title: "remote-r" })];
    const local = [A("l", { addedAt: "2026-07-19" }), A("r", { addedAt: "2026-07-01", title: "local-r" })];
    const out = mergeForDisplay(local, remote);
    expect(out.map((x) => x.id)).toEqual(["l", "r"]);
    expect(out.find((x) => x.id === "r")!.title).toBe("local-r");
  });

  it("keeps a remote-only item that is not in local", () => {
    const out = mergeForDisplay([], [A("r")]);
    expect(out.map((x) => x.id)).toEqual(["r"]);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `stripPersonal`/`mergeForDisplay` are not exported from `./artifacts`.

- [ ] **Step 5: Add the constants and helpers to `src/lib/artifacts.ts`**

Add near the top, after the `KEY` const:

```ts
export const PUBLIC_REPO = "DOli4/DOli4.github.io";
export const PUBLIC_FILE_PATH = "public/artifacts-public.json";
export const PUBLIC_RAW_URL =
  "https://raw.githubusercontent.com/DOli4/DOli4.github.io/main/public/artifacts-public.json";
```

Add these functions (anywhere below `loadArtifacts`):

```ts
/** The only artifacts allowed into the world-readable public feed. */
export function stripPersonal(list: Artifact[]): Artifact[] {
  return list.filter((a) => !a.personal);
}

/** Display list = remote public baseline unioned with this device's local
 *  list. Local wins on a shared id (may hold unsynced edits); newest first. */
export function mergeForDisplay(local: Artifact[], remotePublic: Artifact[]): Artifact[] {
  const byId = new Map<string, Artifact>();
  for (const a of remotePublic) byId.set(a.id, a);
  for (const a of local) byId.set(a.id, a);
  return [...byId.values()].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

/** Pull the public feed (non-personal only). Raw URL first (live), then the
 *  bundled copy, then empty. Personal items are stripped defensively even
 *  though the feed must never contain them. */
export async function fetchPublicArtifacts(): Promise<Artifact[]> {
  const parse = (raw: unknown): Artifact[] => {
    const items = (raw as { items?: unknown } | null)?.items;
    const ok = Array.isArray(items)
      ? (items as Artifact[]).filter((a) => a && typeof a.id === "string" && typeof a.url === "string")
      : [];
    return stripPersonal(ok);
  };
  for (const url of [PUBLIC_RAW_URL, "artifacts-public.json"]) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) return parse(await res.json());
    } catch { /* try the next source */ }
  }
  return [];
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 3 tests green.

- [ ] **Step 7: Seed the public feed file** (`public/artifacts-public.json`)

```json
{
  "savedAt": "",
  "items": []
}
```

- [ ] **Step 8: Typecheck the build**

Run: `npm run build`
Expected: succeeds (tsc + vite), no type errors.

- [ ] **Step 9: Commit**

```bash
git add src/lib/artifacts.ts src/lib/artifacts.test.ts vitest.config.ts public/artifacts-public.json package.json package-lock.json
git commit -m "feat(artifacts): public feed data layer + safety tests

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Read path — merge the public feed on load

**Files:**
- Create: `src/lib/useArtifacts.ts`
- Modify: `src/pages/drill/Artifacts.tsx`
- Modify: `src/pages/drill/Dashboard.tsx`

**Interfaces:**
- Consumes: `fetchPublicArtifacts`, `mergeForDisplay`, `loadArtifacts`, `type Artifact` (Task 1).
- Produces: `useArtifacts(): { all: Artifact[]; setLocal: (list: Artifact[]) => void }`.

- [ ] **Step 1: Create the hook** (`src/lib/useArtifacts.ts`)

```ts
import { useEffect, useState } from "react";
import { fetchPublicArtifacts, loadArtifacts, mergeForDisplay, type Artifact } from "./artifacts";

/**
 * Artifacts for display = this device's localStorage list, sync-loaded for an
 * instant first paint, unioned with the public feed pulled once on mount.
 * `setLocal` takes a new localStorage list (what addArtifact/removeArtifact
 * return); the public baseline is preserved and re-merged automatically.
 */
export function useArtifacts(): { all: Artifact[]; setLocal: (list: Artifact[]) => void } {
  const [local, setLocal] = useState<Artifact[]>(loadArtifacts);
  const [remote, setRemote] = useState<Artifact[]>([]);
  useEffect(() => {
    let alive = true;
    void fetchPublicArtifacts().then((items) => { if (alive) setRemote(items); });
    return () => { alive = false; };
  }, []);
  return { all: mergeForDisplay(local, remote), setLocal };
}
```

- [ ] **Step 2: Wire `Artifacts.tsx`**

Replace the import block (currently lines 4-11) so `loadArtifacts` is dropped and `useArtifacts` is added:

```tsx
import { useState } from "react";
import NeonTitle from "../../components/NeonTitle";
import type { Tier } from "../../lib/drill-crypto";
import {
  hostOf,
  removeArtifact,
  visibleArtifacts,
  type Artifact,
} from "../../lib/artifacts";
import { useArtifacts } from "../../lib/useArtifacts";
import { ArtifactQuickAdd } from "./ArtifactQuickAdd";
```

Replace the component's opening (currently lines 18-21):

```tsx
export default function Artifacts({ tier }: { tier: Tier }) {
  const { all, setLocal } = useArtifacts();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const artifacts = visibleArtifacts(all, tier);
```

Then replace every remaining `setAllArtifacts(` in this file with `setLocal(` (the `onChange={setAllArtifacts}` on `ArtifactQuickAdd` becomes `onChange={setLocal}`, and `setAllArtifacts(removeArtifact(a.id))` becomes `setLocal(removeArtifact(a.id))`).

- [ ] **Step 3: Wire `Dashboard.tsx`**

Change the artifacts import (currently lines 15-19) to drop `loadArtifacts`:

```tsx
import {
  visibleArtifacts,
  type Artifact,
} from "../../lib/artifacts";
import { useArtifacts } from "../../lib/useArtifacts";
```

Replace the state line (currently line 65) with the hook, keeping the downstream names identical so nothing else changes:

```tsx
  const { all: allArtifacts, setLocal: setAllArtifacts } = useArtifacts();
```

(Line 66 `const artifacts = visibleArtifacts(allArtifacts, tier);`, the `chips` filter, and the `onChange: setAllArtifacts` node wiring all stay as-is.)

- [ ] **Step 4: Typecheck the build**

Run: `npm run build`
Expected: succeeds, no unused-import or type errors.

- [ ] **Step 5: Browser-verify the guest read path**

Start the dev server (Browser pane: `preview_start` with the dev config), open the app, unlock as guest, and confirm the Artifacts vault renders the seeded/empty public feed without any token prompt. Add a local artifact and confirm it appears immediately (local union). Check the console (`read_console_messages`) for no fetch errors beyond an expected 404 if the raw file isn't pushed yet.

- [ ] **Step 6: Commit**

```bash
git add src/lib/useArtifacts.ts src/pages/drill/Artifacts.tsx src/pages/drill/Dashboard.tsx
git commit -m "feat(artifacts): pull non-personal artifacts from the public feed on load

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Write path — publish the non-personal subset on Sync

**Files:**
- Modify: `src/lib/git-sync.ts`
- Modify: `src/pages/drill/SyncWidget.tsx`
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `stripPersonal`, `PUBLIC_REPO`, `PUBLIC_FILE_PATH`, `type Artifact` (Task 1); existing module-scoped `headers`, `b64encode`, `b64decode` in `git-sync.ts`.
- Produces: `SyncResult` gains `publicPushed: boolean` and optional `publicError?: string`.

- [ ] **Step 1: Add the public-feed import and constants to `git-sync.ts`**

Extend the artifacts import (currently line 15) and add constants near the other repo consts (after line 23):

```ts
import { PUBLIC_FILE_PATH, PUBLIC_REPO, stripPersonal, type Artifact } from "./artifacts";
```

```ts
const PUBLIC_API_URL = `https://api.github.com/repos/${PUBLIC_REPO}/contents/${PUBLIC_FILE_PATH}`;
```

- [ ] **Step 2: Add `writePublicArtifacts()` to `git-sync.ts`**

Place it above `syncNow`:

```ts
/** Write the non-personal subset to the public repo. Returns true when a push
 *  happened. Compares `items` only (savedAt always differs) so we never make an
 *  empty commit. Throws on a real API failure — the caller keeps it non-fatal. */
async function writePublicArtifacts(token: string, items: Artifact[]): Promise<boolean> {
  let sha: string | undefined;
  let currentItems: string | null = null;
  const get = await fetch(PUBLIC_API_URL, { headers: headers(token), signal: AbortSignal.timeout(30_000) });
  if (get.ok) {
    const body = await get.json();
    sha = body.sha;
    if (body.encoding === "base64" && body.content) {
      try { currentItems = JSON.stringify(JSON.parse(b64decode(body.content)).items ?? null); }
      catch { currentItems = null; }
    }
  } else if (get.status !== 404) {
    throw new Error(`Public feed read failed (${get.status}) — token needs Contents read on ${PUBLIC_REPO}.`);
  }

  const nextItems = JSON.stringify(items);
  if (currentItems === nextItems) return false;

  const at = new Date().toISOString();
  const put = await fetch(PUBLIC_API_URL, {
    method: "PUT",
    headers: { ...headers(token), "content-type": "application/json" },
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({
      message: `public artifacts ${at.slice(0, 16).replace("T", " ")}`,
      content: b64encode(JSON.stringify({ savedAt: at, items }, null, 2)),
      ...(sha ? { sha } : {}),
    }),
  });
  if (!put.ok) throw new Error(`Public feed push failed (${put.status}) — token needs Contents write on ${PUBLIC_REPO}.`);
  return true;
}
```

- [ ] **Step 3: Extend the `SyncResult` type**

Replace the `SyncResult` type (currently lines 148-153):

```ts
export type SyncResult = {
  at: string;
  /** true when the private push happened (something changed) */
  pushed: boolean;
  entries: number;
  /** true when the public feed was updated */
  publicPushed: boolean;
  /** set when the public feed update failed (private sync still succeeded) */
  publicError?: string;
};
```

- [ ] **Step 4: Publish the public subset at the end of `syncNow()`**

Just before the final `return { at, pushed, entries: ... }` (currently lines 242-243), add the publish step and extend the return:

```ts
  // Publish the non-personal subset to the public feed. Non-fatal: the private
  // sync already succeeded, so a failure here is reported, not thrown.
  let publicPushed = false;
  let publicError: string | undefined;
  try {
    publicPushed = await writePublicArtifacts(token, stripPersonal(merged["drill-artifacts"]));
  } catch (e) {
    publicError = e instanceof Error ? e.message : "Public feed update failed.";
  }

  try { localStorage.setItem(META_KEY, JSON.stringify({ lastSync: at } satisfies SyncMeta)); } catch { /* fine */ }
  return { at, pushed, entries: merged["mentor-history"].length, publicPushed, publicError };
```

(Delete the original `localStorage.setItem(META_KEY, ...)` + `return` lines this replaces.)

- [ ] **Step 5: Surface the public result in `SyncWidget.tsx`**

In `run()` (currently lines 27-44), after `setStatus(...)` in the try block, append the public-feed outcome. Replace the success line:

```tsx
      const r = await syncNow();
      setLastSync(r.at);
      setFailed(false);
      const priv = r.pushed ? `synced — ${r.entries} exercises safe in git` : "already up to date";
      const pub = r.publicError
        ? ` · public feed failed: ${r.publicError}`
        : r.publicPushed ? " · public feed updated" : "";
      setStatus(priv + pub);
```

- [ ] **Step 6: Update the token-scope setup copy in `SyncWidget.tsx`**

Replace the `intel-note` paragraph (currently lines 85-87):

```tsx
              <p className="intel-note">
                One-time: GitHub → Settings → Developer settings → Fine-grained tokens.
                Repository access: <b>site-data and DOli4.github.io</b>.
                Permission: <b>Contents — read and write</b> on both.
              </p>
```

- [ ] **Step 7: Add `paths-ignore` to the deploy workflow** (`.github/workflows/deploy.yml`)

Replace the `on:` block (currently the first `on: push: branches: [main]` section):

```yaml
on:
  push:
    branches: [main]
    paths-ignore:
      - public/artifacts-public.json
  workflow_dispatch:
```

- [ ] **Step 8: Typecheck the build**

Run: `npm run build`
Expected: succeeds, no type errors.

- [ ] **Step 9: Commit**

```bash
git add src/lib/git-sync.ts src/pages/drill/SyncWidget.tsx .github/workflows/deploy.yml
git commit -m "feat(sync): publish non-personal artifacts to the public feed on sync

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: News window — hot links to outlets

**Files:**
- Create: `src/lib/news-outlets.ts`
- Modify: `src/pages/drill/canvas/FloatPanel.tsx`
- Modify: `src/pages/drill.css`

**Interfaces:**
- Produces: `type Outlet = { name: string; url: string; blurb: string }`; `NEWS_OUTLETS: Outlet[]`; `outletHost(url: string): string`.

- [ ] **Step 1: Create the outlet list** (`src/lib/news-outlets.ts`)

```ts
export type Outlet = { name: string; url: string; blurb: string };

/** Tech-focused hot links. Edit freely — this is the whole news source now. */
export const NEWS_OUTLETS: Outlet[] = [
  { name: "TechCrunch", url: "https://techcrunch.com", blurb: "Startup & tech business news" },
  { name: "The Verge", url: "https://www.theverge.com", blurb: "Tech, science & culture" },
  { name: "Ars Technica", url: "https://arstechnica.com", blurb: "Deep tech & policy" },
  { name: "Hacker News", url: "https://news.ycombinator.com", blurb: "What devs are reading now" },
  { name: "MIT Technology Review", url: "https://www.technologyreview.com", blurb: "Emerging tech, long view" },
  { name: "Wired", url: "https://www.wired.com", blurb: "Tech & its impact" },
  { name: "The Information", url: "https://www.theinformation.com", blurb: "Inside-tech scoops" },
  { name: "Anthropic", url: "https://www.anthropic.com/news", blurb: "Claude & AI safety" },
];

export function outletHost(url: string): string {
  try { return new URL(url).host; } catch { return url; }
}
```

- [ ] **Step 2: Rewrite the NEWS parts of `FloatPanel.tsx`**

Remove the `news.json` machinery and render outlets instead. Concretely:

1. Replace the top imports (currently lines 1-6) — drop the `NewsItem`/`News` types:

```tsx
import { useEffect, useState } from "react";
import type { Drill } from "../../../lib/drill-crypto";
import { NEWS_OUTLETS, outletHost, type Outlet } from "../../../lib/news-outlets";
import GlassWin, { loadLayout, type Box } from "./GlassWin";
```

2. Delete the news-history block (currently lines 17-30: `NEWS_HIST_KEY`, `NEWS_HIST_DAYS`, `loadNewsHist`). Keep `LAYOUT_KEY`.

3. Delete `NewsBody` (currently lines 51-64) and add an outlet icon component in its place:

```tsx
function OutletIcon({ outlet }: { outlet: Outlet }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="outlet-ico outlet-ico-fallback" aria-hidden>{outlet.name[0]}</span>;
  return (
    <img
      className="outlet-ico"
      src={`https://${outletHost(outlet.url)}/favicon.ico`}
      alt=""
      width={20}
      height={20}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
```

4. In the `FloatPanel` component, delete the news state and fetch effect (currently lines 90-92 news/newsHist/newsDay state, and the `useEffect` at lines 95-109). Keep the `boxes` state and its persistence effect. Delete the `histDays`/`latest`/`shown`/`items` derivation (currently lines 117-120).

5. Replace the NEWS `GlassWin` body (currently lines 135-165) with the outlet grid:

```tsx
      {openNews && (
        <GlassWin id="win-news" title="NEWS" onClose={() => setOpenNews(false)}
          boxes={boxes} setBoxes={setBoxes} resizable
          def={{ x: Math.max(12, innerWidth - 420), y: 70, w: 384, h: 460 }}>
          <p className="intel-date">live feeds — opens in a new tab</p>
          <div className="news-outlets">
            {NEWS_OUTLETS.map((o) => (
              <a key={o.url} className="outlet-card" href={o.url} target="_blank" rel="noopener noreferrer" data-hover>
                <OutletIcon outlet={o} />
                <span className="outlet-name">{o.name}</span>
                <span className="outlet-blurb">{o.blurb}</span>
              </a>
            ))}
          </div>
        </GlassWin>
      )}
```

6. In the popped-out cards `.map` (currently lines 185-214), delete the `if (id.startsWith("n-"))` branch — outlet cards are not poppable. Leave the `d-tips` and prompt-tip branches untouched.

- [ ] **Step 3: Add outlet-grid styles to `src/pages/drill.css`**

Append:

```css
/* News window: outlet hot-links */
.news-outlets { display: grid; grid-template-columns: 1fr; gap: 8px; margin-top: 8px; }
.outlet-card {
  display: grid;
  grid-template-columns: 20px 1fr;
  grid-template-rows: auto auto;
  column-gap: 10px;
  row-gap: 2px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  text-decoration: none;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}
.outlet-card:hover {
  border-color: var(--accent, #35e6ff);
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-1px);
}
.outlet-ico { grid-row: 1 / 3; width: 20px; height: 20px; border-radius: 4px; }
.outlet-ico-fallback {
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 12px;
  color: #05060a;
  background: var(--accent, #35e6ff);
}
.outlet-name { font-weight: 600; font-size: 13px; color: #eef2f6; }
.outlet-blurb { font-size: 11px; color: rgba(238, 242, 246, 0.6); }
```

(If a `--accent` theme variable isn't defined globally, the `#35e6ff` fallback in each `var()` keeps it correct.)

- [ ] **Step 4: Typecheck the build**

Run: `npm run build`
Expected: succeeds — no unused `News`/`NewsItem`/`newsHist` references remain.

- [ ] **Step 5: Browser-verify the NEWS window**

Open the app, click the NEWS tab, and confirm the outlet grid renders with favicons (or letter fallbacks), each card links out to the live outlet in a new tab, and hover styling works. Toggle the theme to confirm the accent color follows.

- [ ] **Step 6: Commit**

```bash
git add src/lib/news-outlets.ts src/pages/drill/canvas/FloatPanel.tsx src/pages/drill.css
git commit -m "feat(news): replace AI-news feed with live outlet hot-links

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- "Always pull non-personal from a public DB, no token" → Task 1 (`fetchPublicArtifacts`, raw URL) + Task 2 (load merge). ✅
- "Personal only after sync" → personal items live in localStorage (post-sync) / private snapshot; never in the public feed; `mergeForDisplay` adds personal from local only. ✅
- "Publish live on sync" → Task 3 (`writePublicArtifacts` + `syncNow`). ✅
- Token-scope widening → Task 3 Step 6. ✅
- Deploy churn avoidance → Task 3 Step 7. ✅
- News hot-links (tech-focused) → Task 4. ✅
- Safety invariant (no personal in public) → Task 1 `stripPersonal` + test; applied on both write (Task 3) and read (Task 1 defensive). ✅

**Placeholder scan:** No TBDs; every code step shows full code. ✅

**Type consistency:** `Artifact` shared from `artifacts.ts`; `useArtifacts` returns `{ all, setLocal }` consumed verbatim in Tasks 2; `SyncResult.publicPushed`/`publicError` produced in Task 3 Step 3 and consumed in Step 5; `Outlet`/`NEWS_OUTLETS`/`outletHost` produced in Task 4 Step 1 and consumed in Step 2. ✅

**Known accepted behavior (out of scope):** locally deleting a *non-personal* artifact lets the public feed re-add it on next load until a sync rewrites the feed — same class as the existing "deletes can resurrect on merge" wart.
