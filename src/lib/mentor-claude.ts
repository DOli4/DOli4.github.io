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

/** Ask Claude to review the typed code against the challenge. Throws Error
 *  with a human-readable message on every failure path. */
export async function analyseCode(challenge: string, code: string): Promise<MentorReview> {
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
        system: SYSTEM,
        output_config: { format: { type: "json_schema", schema: REVIEW_SCHEMA } },
        messages: [
          {
            role: "user",
            content: `CHALLENGE:\n${challenge}\n\nMY CODE (numbered from line 1):\n${code}`,
          },
        ],
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
  if (data.stop_reason === "refusal") throw new Error("Claude declined this one — try different code.");
  if (data.stop_reason === "max_tokens") throw new Error("Review got cut off — try shorter code.");

  const text = (data.content as { type: string; text?: string }[])
    .find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Empty review came back — try again.");

  let raw: MentorReview;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Review wasn't valid JSON — try again.");
  }

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
