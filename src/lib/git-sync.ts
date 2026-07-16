/**
 * Git-backed sync — the dashboard's localStorage, mirrored to a PRIVATE repo
 * (DOli4/site-data, file data/anomaly-data.json) through the GitHub API.
 *
 * - The fine-grained PAT is pasted once and lives ONLY in localStorage
 *   ("sync-token"), same pattern as the Claude key. Scope it to the one repo,
 *   Contents: read/write.
 * - Sync = pull remote → merge with local (nothing is ever thrown away by a
 *   dumb overwrite) → write merged back to localStorage → push, but only
 *   when something actually changed (no empty commits).
 * - API keys and tokens are NEVER part of the snapshot. Window layouts stay
 *   per-device on purpose.
 */

import type { Artifact } from "./artifacts";
import type { HistoryEntry } from "../pages/drill/mentor/history";
import type { XpState } from "../pages/drill/mentor/xp";

export const SYNC_TOKEN_KEY = "sync-token";
const META_KEY = "sync-meta";
const REPO = "DOli4/site-data";
const FILE_PATH = "data/anomaly-data.json";
const API_URL = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

/** what travels; layouts and every kind of key/token stay home */
const NEWS_DAYS_CAP = 30;
const HISTORY_CAP = 100;

type NewsDay = { date: string; items: unknown[] };

export type SyncData = {
  "mentor-history": HistoryEntry[];
  "mentor-xp": XpState | null;
  "drill-artifacts": Artifact[];
  "drill-said": Record<string, boolean>;
  "news-history": Record<string, NewsDay>;
};

type Snapshot = { savedAt: string; data: SyncData };

export type SyncMeta = { lastSync: string };

export function getSyncToken(): string | null {
  return localStorage.getItem(SYNC_TOKEN_KEY);
}
export function setSyncToken(t: string): void {
  localStorage.setItem(SYNC_TOKEN_KEY, t.trim());
}
export function clearSyncToken(): void {
  localStorage.removeItem(SYNC_TOKEN_KEY);
}
export function getSyncMeta(): SyncMeta | null {
  try { return JSON.parse(localStorage.getItem(META_KEY) ?? "null"); } catch { return null; }
}

function readKey<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function readLocal(): SyncData {
  return {
    "mentor-history": readKey<HistoryEntry[]>("mentor-history", []),
    "mentor-xp": readKey<XpState | null>("mentor-xp", null),
    "drill-artifacts": readKey<Artifact[]>("drill-artifacts", []),
    "drill-said": readKey<Record<string, boolean>>("drill-said", {}),
    "news-history": readKey<Record<string, NewsDay>>("news-history", {}),
  };
}

function writeLocal(data: SyncData): void {
  try {
    localStorage.setItem("mentor-history", JSON.stringify(data["mentor-history"]));
    if (data["mentor-xp"]) localStorage.setItem("mentor-xp", JSON.stringify(data["mentor-xp"]));
    localStorage.setItem("drill-artifacts", JSON.stringify(data["drill-artifacts"]));
    localStorage.setItem("drill-said", JSON.stringify(data["drill-said"]));
    localStorage.setItem("news-history", JSON.stringify(data["news-history"]));
  } catch { /* quota — merged state still lives in the pushed snapshot */ }
}

/** union two id'd lists; on the same id the LOCAL copy wins */
function mergeById<T extends { id: string }>(
  local: T[], remote: T[], newest: (t: T) => string, cap: number,
): T[] {
  const byId = new Map<string, T>();
  for (const e of remote) byId.set(e.id, e);
  for (const e of local) byId.set(e.id, e);
  return [...byId.values()].sort((a, b) => newest(b).localeCompare(newest(a))).slice(0, cap);
}

function merge(local: SyncData, remote: SyncData): SyncData {
  const news = { ...remote["news-history"], ...local["news-history"] };
  const newsKeep = Object.keys(news).sort().reverse().slice(0, NEWS_DAYS_CAP);
  const lx = local["mentor-xp"], rx = remote["mentor-xp"];
  return {
    "mentor-history": mergeById(local["mentor-history"], remote["mentor-history"], (e) => e.at, HISTORY_CAP),
    // xp only ever grows — the bigger total is the truer one
    "mentor-xp": lx && rx ? (rx.xp > lx.xp ? rx : lx) : lx ?? rx,
    "drill-artifacts": mergeById(local["drill-artifacts"], remote["drill-artifacts"], (a) => a.addedAt, 500),
    "drill-said": { ...remote["drill-said"], ...local["drill-said"] },
    "news-history": Object.fromEntries(newsKeep.map((d) => [d, news[d]])),
  };
}

/** Shape-check remote data key by key; anything malformed falls back to the
 *  local value (an older snapshot missing a key behaves the same way). */
function sanitize(local: SyncData, raw: Partial<SyncData>): SyncData {
  const arr = <T,>(v: unknown, fb: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fb);
  const obj = <T extends object>(v: unknown, fb: T): T =>
    v && typeof v === "object" && !Array.isArray(v) ? (v as T) : fb;
  return {
    "mentor-history": arr(raw["mentor-history"], local["mentor-history"]).filter(
      (e) => e && typeof e.id === "string" && typeof e.at === "string",
    ),
    "mentor-xp": raw["mentor-xp"] && typeof raw["mentor-xp"].xp === "number" ? raw["mentor-xp"] : local["mentor-xp"],
    "drill-artifacts": arr(raw["drill-artifacts"], local["drill-artifacts"]).filter(
      (a) => a && typeof a.id === "string" && typeof a.addedAt === "string",
    ),
    "drill-said": obj(raw["drill-said"], local["drill-said"]),
    "news-history": obj(raw["news-history"], local["news-history"]),
  };
}

/* --- base64 that survives unicode (btoa alone is latin-1 only) --- */
function b64encode(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
function b64decode(s: string): string {
  const bin = atob(s.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

function headers(token: string): Record<string, string> {
  return {
    authorization: `Bearer ${token}`,
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
  };
}

export type SyncResult = {
  at: string;
  /** true when the push happened (something changed) */
  pushed: boolean;
  entries: number;
};

/** Pull → merge → write local → push (only if changed). Throws Error with a
 *  plain-language message on every failure path. */
export async function syncNow(): Promise<SyncResult> {
  const token = getSyncToken();
  if (!token) throw new Error("No sync token yet — follow the steps above.");

  // 1. pull
  let remote: Snapshot | null = null;
  let sha: string | undefined;
  let res: Response;
  try {
    res = await fetch(API_URL, { headers: headers(token), signal: AbortSignal.timeout(30_000) });
  } catch {
    throw new Error("Can't reach github.com — check your connection.");
  }
  if (res.status === 401) throw new Error("Token rejected — paste a fresh one.");
  if (res.status === 403) throw new Error("Token has no access — it needs Contents read/write on DOli4/site-data.");
  if (res.status === 404) {
    remote = null; // first sync ever — the file doesn't exist yet
  } else if (res.ok) {
    const body = await res.json();
    sha = body.sha;
    let text: string;
    if (body.encoding === "base64" && (body.content || body.size === 0)) {
      text = b64decode(body.content ?? "");
    } else {
      // files over ~1MB come back without inline content — refetch raw.
      // NEVER fall through to "no remote": pushing local-only over a real
      // snapshot is exactly the data loss sync exists to prevent.
      let rawRes: Response;
      try {
        rawRes = await fetch(API_URL, {
          headers: { ...headers(token), accept: "application/vnd.github.raw+json" },
          signal: AbortSignal.timeout(30_000),
        });
      } catch {
        throw new Error("Snapshot fetch dropped mid-way — try again.");
      }
      if (!rawRes.ok) throw new Error(`Couldn't read the remote snapshot (${rawRes.status}) — not overwriting it.`);
      text = await rawRes.text();
    }
    try {
      remote = JSON.parse(text);
    } catch {
      throw new Error("Remote snapshot is unreadable — not overwriting it. Check data/anomaly-data.json in site-data.");
    }
  } else {
    throw new Error(`GitHub said ${res.status} — try again in a bit.`);
  }

  // 2. merge + adopt locally. Remote arrays/maps are sanitized so a
  //    hand-edited snapshot can't crash the merge with a raw TypeError.
  const local = readLocal();
  const merged = remote?.data ? merge(local, sanitize(local, remote.data)) : local;
  writeLocal(merged);

  // 3. push — but never an empty commit
  const mergedJson = JSON.stringify(merged);
  const remoteJson = remote?.data ? JSON.stringify(remote.data) : null;
  const at = new Date().toISOString();
  let pushed = false;
  if (mergedJson !== remoteJson) {
    const snapshot: Snapshot = { savedAt: at, data: merged };
    let put: Response;
    try {
      put = await fetch(API_URL, {
        method: "PUT",
        headers: { ...headers(token), "content-type": "application/json" },
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          message: `sync ${at.slice(0, 16).replace("T", " ")}`,
          content: b64encode(JSON.stringify(snapshot, null, 2)),
          ...(sha ? { sha } : {}),
        }),
      });
    } catch {
      throw new Error("Pulled fine, push lost connection — try again.");
    }
    // 409 = sha raced; 422 without a sha = the file appeared between our GET
    // and PUT (another device's first sync) — both heal with one more press.
    if (put.status === 409 || (put.status === 422 && !sha)) {
      throw new Error("Another device synced at the same moment — press SYNC once more.");
    }
    if (!put.ok) throw new Error(`Push failed (${put.status}) — check the token's Contents permission.`);
    pushed = true;
  }

  try { localStorage.setItem(META_KEY, JSON.stringify({ lastSync: at } satisfies SyncMeta)); } catch { /* fine */ }
  return { at, pushed, entries: merged["mentor-history"].length };
}
