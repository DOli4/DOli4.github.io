/**
 * Mentor gamification. All local, all in one localStorage key ("mentor-xp"):
 * - xp: sum of analysis scores (+50 bonus when a run scores >= 80)
 * - streak: consecutive days with at least one analysis
 * - ranks: fixed thresholds, INTERN -> ANOMALY
 */

export type XpState = {
  xp: number;
  analyses: number;
  best: number;
  streak: number;
  /** yyyy-mm-dd of the last analysis */
  lastDay: string;
};

export const XP_STORAGE = "mentor-xp";
export const FINISH_BONUS = 50;
export const FINISH_SCORE = 80;

export const RANKS = [
  { name: "INTERN", min: 0 },
  { name: "JUNIOR", min: 250 },
  { name: "ENGINEER", min: 700 },
  { name: "ANOMALY", min: 1500 },
] as const;

const EMPTY: XpState = { xp: 0, analyses: 0, best: 0, streak: 0, lastDay: "" };

/** yyyy-mm-dd in LOCAL time — a streak day should flip at local midnight. */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function loadXp(): XpState {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(XP_STORAGE) ?? "{}") };
  } catch {
    return { ...EMPTY };
  }
}

/** Record one analysis; returns the new state (already persisted). */
export function awardXp(score: number): XpState {
  const s = loadXp();
  const day = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86_400_000));

  const next: XpState = {
    xp: s.xp + score + (score >= FINISH_SCORE ? FINISH_BONUS : 0),
    analyses: s.analyses + 1,
    best: Math.max(s.best, score),
    // same day keeps the streak, yesterday extends it, a gap restarts it
    streak: s.lastDay === day ? s.streak : s.lastDay === yesterday ? s.streak + 1 : 1,
    lastDay: day,
  };
  localStorage.setItem(XP_STORAGE, JSON.stringify(next));
  return next;
}

export function rankOf(xp: number): { name: string; next: number | null; pct: number } {
  let current: (typeof RANKS)[number] = RANKS[0];
  let next: (typeof RANKS)[number] | null = null;
  for (const r of RANKS) {
    if (xp >= r.min) current = r;
    else { next = r; break; }
  }
  const pct = next === null
    ? 100
    : Math.round(((xp - current.min) / (next.min - current.min)) * 100);
  return { name: current.name, next: next?.min ?? null, pct };
}
