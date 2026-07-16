import type { MentorChip } from "../../../lib/mentor-claude";

/**
 * Mentor exercise history — every ANALYSE run is kept: the challenge, the
 * code he typed, and Claude's full review. localStorage ("mentor-history"),
 * newest first, capped so one giant paste-of-life never fills the quota.
 */

export type HistoryEntry = {
  id: string;
  /** ISO datetime of the analysis */
  at: string;
  challengeId: string;
  challengeTitle: string;
  goal: string;
  code: string;
  score: number;
  praise: string;
  chips: MentorChip[];
};

const KEY = "mentor-history";
const MAX_ENTRIES = 100;

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as HistoryEntry[];
    if (!Array.isArray(raw)) return [];
    // one malformed entry must not crash the list or a reopen
    return raw.filter(
      (e) => e && typeof e.id === "string" && typeof e.at === "string"
        && typeof e.code === "string" && Array.isArray(e.chips),
    );
  } catch {
    return [];
  }
}

/** History is best-effort persistence — a quota failure must never veto the
 *  review or the XP award, so writes swallow their own errors. */
function save(list: HistoryEntry[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* best-effort */ }
}

export function addHistory(entry: Omit<HistoryEntry, "id" | "at">): HistoryEntry[] {
  const item: HistoryEntry = {
    ...entry,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
  };
  const next = [item, ...loadHistory()].slice(0, MAX_ENTRIES);
  save(next);
  return next;
}

export function removeHistory(id: string): HistoryEntry[] {
  const next = loadHistory().filter((e) => e.id !== id);
  save(next);
  return next;
}
