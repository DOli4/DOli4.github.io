/**
 * Code Mentor ↔ Claude. Direct browser call, deliberately:
 * - The API key is Dieter's own, pasted once, stored ONLY in localStorage.
 * - It is sent to api.anthropic.com and nowhere else — there is no backend.
 * - `anthropic-dangerous-direct-browser-access` is the header that makes the
 *   API accept a browser origin; "dangerous" refers to shipping a key in a
 *   public site, which is fine here because the key never leaves this machine.
 * - Structured outputs (output_config.format) make the response guaranteed
 *   valid JSON — no fence-stripping, no "please return JSON" hope.
 */

export type ChipKind = "smell" | "pattern" | "bug" | "style";

/** one identity per kind, everywhere: workspace chips, donut, legends */
export const KIND_COLOR: Record<ChipKind, string> = {
  bug: "#e05b5b",
  smell: "#d8a94a",
  pattern: "#35e6ff",
  style: "#7bdf8f",
};

export type MentorChip = {
  /** 1-based line in the typed code, or null when it's about the whole thing */
  line: number | null;
  title: string;
  kind: ChipKind;
  /** one short plain sentence */
  short: string;
  /** the expanded explanation — still short lines, no walls */
  more: string;
  /** refactoring.guru / MDN page to read next */
  link: string;
};

export type MentorReview = {
  /** 0–100 */
  score: number;
  /** one genuine, specific compliment */
  praise: string;
  chips: MentorChip[];
};

export const KEY_STORAGE = "mentor-api-key";
const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

export function getApiKey(): string | null {
  return localStorage.getItem(KEY_STORAGE);
}
export function setApiKey(key: string): void {
  localStorage.setItem(KEY_STORAGE, key.trim());
}
export function clearApiKey(): void {
  localStorage.removeItem(KEY_STORAGE);
}

const SYSTEM = `You are CODE MENTOR inside a private training dashboard.
The learner has reading difficulties: short lines, plain words, no jargon walls.
He typed the code himself as deliberate practice. Review it like a kind senior:
- praise one thing he genuinely did well (be specific, never generic)
- score 0-100 for how well the code meets the stated challenge
- chips: the teaching points. kinds: "bug" (will misbehave), "smell" (works but
  fragile), "pattern" (a design pattern used, missed, or misused), "style"
  (naming/readability). 2-6 chips. Each: title <= 5 words, "short" one plain
  sentence, "more" 2-4 short sentences that teach the idea, "line" = the
  1-based line it points at or null for the whole file.
- link: prefer https://refactoring.guru/design-patterns/<pattern> for patterns,
  otherwise a fitting MDN (developer.mozilla.org) or w3schools page.
Never rewrite his code for him. Teach the idea, let him type the fix.`;

const REVIEW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["score", "praise", "chips"],
  properties: {
    score: { type: "integer" },
    praise: { type: "string" },
    chips: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["line", "title", "kind", "short", "more", "link"],
        properties: {
          line: { anyOf: [{ type: "integer" }, { type: "null" }] },
          title: { type: "string" },
          kind: { type: "string", enum: ["smell", "pattern", "bug", "style"] },
          short: { type: "string" },
          more: { type: "string" },
          link: { type: "string" },
        },
      },
    },
  },
} as const;

/** Shared browser→Anthropic call: system + user + schema in, parsed JSON out.
 *  Throws Error with a human-readable message on every failure path. */
async function askClaude<T>(system: string, user: string, schema: object): Promise<T> {
  const key = getApiKey();
  if (!key) throw new Error("No API key yet — open CONNECT CLAUDE first.");

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      signal: AbortSignal.timeout(60_000),
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        // fast + cheap: a short review doesn't need extended reasoning
        thinking: { type: "disabled" },
        system,
        output_config: { format: { type: "json_schema", schema } },
        messages: [{ role: "user", content: user }],
      }),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new Error("Claude took too long — try again.");
    }
    throw new Error("Can't reach api.anthropic.com — check your connection.");
  }

  if (!res.ok) {
    if (res.status === 401) throw new Error("Key rejected — re-paste it in CONNECT CLAUDE.");
    if (res.status === 429) throw new Error("Rate limited — breathe, try again in a minute.");
    if (res.status === 529) throw new Error("Claude is overloaded — try again shortly.");
    let detail = "";
    try { detail = (await res.json())?.error?.message ?? ""; } catch { /* body wasn't json */ }
    throw new Error(`API error ${res.status}${detail ? ` — ${detail}` : ""}`);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Got a garbled reply — try again.");
  }
  if (data.stop_reason === "refusal") throw new Error("Claude declined this one — try different input.");
  if (data.stop_reason === "max_tokens") throw new Error("The answer got cut off — try shorter input.");

  const text = (data.content as { type: string; text?: string }[])
    .find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Empty answer came back — try again.");

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Answer wasn't valid JSON — try again.");
  }
}

/** Ask Claude to review the typed code against the challenge. */
export async function analyseCode(challenge: string, code: string): Promise<MentorReview> {
  const raw = await askClaude<MentorReview>(
    SYSTEM,
    `CHALLENGE:\n${challenge}\n\nMY CODE (numbered from line 1):\n${code}`,
    REVIEW_SCHEMA,
  );
  // Belt and braces: structured outputs enforce shape, we enforce ranges.
  return {
    score: Math.max(0, Math.min(100, Math.round(raw.score ?? 0))),
    praise: raw.praise ?? "",
    chips: (raw.chips ?? []).map((c) => ({
      ...c,
      line: typeof c.line === "number" && c.line >= 1 ? Math.round(c.line) : null,
    })),
  };
}

/* --- the coach scan: Claude reads the whole training history --- */

export type CoachCard = {
  kind: "strength" | "gap" | "next";
  title: string;
  short: string;
  more: string;
};

export type CoachReport = { headline: string; cards: CoachCard[] };

const COACH_SYSTEM = `You are the COACH view of CODE MENTOR, reading a learner's
exercise history (challenges, scores, review-chip titles). He has reading
difficulties: short lines, plain words. Return:
- headline: one warm, specific sentence about his trajectory (<= 18 words)
- cards: 3-5 of kind "strength" (keeps doing well), "gap" (keeps coming up),
  "next" (what to drill next and why it fits his gaps).
  Each: title <= 5 words, short = one plain sentence, more = 2-3 short
  sentences that teach or direct. Base everything on the actual history —
  name real patterns from it, never generic advice.`;

const COACH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "cards"],
  properties: {
    headline: { type: "string" },
    cards: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "title", "short", "more"],
        properties: {
          kind: { type: "string", enum: ["strength", "gap", "next"] },
          title: { type: "string" },
          short: { type: "string" },
          more: { type: "string" },
        },
      },
    },
  },
} as const;

/** Scan the training history and return coaching cards. */
export async function coachScan(historyDigest: string): Promise<CoachReport> {
  const raw = await askClaude<CoachReport>(
    COACH_SYSTEM,
    `MY TRAINING HISTORY (newest first):\n${historyDigest}`,
    COACH_SCHEMA,
  );
  return { headline: raw.headline ?? "", cards: raw.cards ?? [] };
}
