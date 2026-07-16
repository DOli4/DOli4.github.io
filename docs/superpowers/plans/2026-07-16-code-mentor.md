# Code Mentor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gamified Code Mentor screen at `#/drill/mentor`: challenge picker (diagram cards) → typed-code workspace with movable example cards → Claude-key ANALYSE → movable teaching chips + XP/ranks.

**Architecture:** New route behind the existing DrillArea password gate. Screen state machine lives in `Mentor.tsx` (picker ⇄ workspace). GlassWin is extracted from FloatPanel into a shared module and reused for example cards, the API-key window, and result chips. The Claude call is a direct browser `fetch` to `api.anthropic.com/v1/messages` with structured outputs so the response is guaranteed-valid JSON.

**Tech Stack:** React 18 + TypeScript + Vite, plain CSS (drill.css tokens), Claude API (`claude-sonnet-5`), localStorage.

## Global Constraints

- Route: `#/drill/mentor`, route id `drill-mentor`, behind the same gate (`isDrillRoute`).
- API key stored ONLY in localStorage key `mentor-api-key`; sent only to `https://api.anthropic.com`. Never committed.
- XP stored in localStorage key `mentor-xp`; ranks INTERN → JUNIOR → ENGINEER → ANOMALY; +bonus when score ≥ 80.
- Model `claude-sonnet-5`, headers `anthropic-version: 2023-06-01`, `anthropic-dangerous-direct-browser-access: true`, `x-api-key`.
- Challenge/teaching copy is ORIGINAL wording; link out to refactoring.guru / MDN (no copied text).
- All info as diagrams (mini-flow boxes / step chains), short lines, never paragraphs.
- Everything movable via GlassWin; glitch-in on load (`glitch-in` keyframes pattern); reduced-motion safe.
- No test framework exists in this repo; verification = `tsc -b && vite build` + browser walkthrough on dev server `lofi-cv` (port 5199, password IAMDIETER).
- Never commit the API key or anything from the Drive employer repos.

---

### Task 1: Extract GlassWin into a shared module

**Files:**
- Create: `src/pages/drill/canvas/GlassWin.tsx`
- Modify: `src/pages/drill/canvas/FloatPanel.tsx` (remove inline GlassWin/Box/loadLayout, import instead)

**Interfaces:**
- Produces: `export type Box = { x: number; y: number; w: number; h: number }`
- Produces: `export function loadLayout(key: string): Record<string, Box>`
- Produces: `export default function GlassWin(props)` — same props as today: `{ id, title, onClose, boxes, setBoxes, def, resizable?, small?, children }`

Steps:
- [ ] Move `Box`, `loadLayout` (parameterised by storage key), and `GlassWin` verbatim into `GlassWin.tsx`.
- [ ] FloatPanel imports them; `loadLayout("intel-layout-v2")` keeps the existing persistence key.
- [ ] `npx tsc -b` → clean.

### Task 2: Router + gate + nav

**Files:**
- Modify: `src/router.ts` (Route union + parse + isDrillRoute)
- Modify: `src/pages/drill/DrillArea.tsx` (edge-nav tab "Mentor", render `<Mentor />` for route `drill-mentor`)
- Modify: `src/pages/drill/canvas/DashNodes.tsx` (`AnomalyNode`: click — pointerdown/up < 6 px movement — navigates to `#/drill/mentor`)

Steps:
- [ ] `Route` gains `"drill-mentor"`; `parse()` maps `drill/mentor`; `isDrillRoute` includes it.
- [ ] DrillArea nav: `<a href="#/drill/mentor" className={route === "drill-mentor" ? is-on}>Mentor</a>`; render Mentor with the other gated pages.
- [ ] AnomalyNode wraps `.core-hub` with pointer handlers distinguishing click (< 6 px) from rotation drag → `window.location.hash = "#/drill/mentor"`.

### Task 3: Challenge data + Claude client + XP

**Files:**
- Create: `src/pages/drill/mentor/challenges.ts`
- Create: `src/lib/mentor-claude.ts`
- Create: `src/pages/drill/mentor/xp.ts`

**Interfaces (produced):**
```ts
// challenges.ts
export type Snippet = { title: string; note: string; code: string };
export type Challenge = { id: string; title: string; subtitle: string; goal: string;
  flow: string[]; link: string; linkLabel: string; examples: Snippet[] };
export const CHALLENGES: Challenge[]; // 6: bff, strategy, observer, builder, factory, decorator
export function customChallenge(idea: string): Challenge;

// mentor-claude.ts
export type ChipKind = "smell" | "pattern" | "bug" | "style";
export type MentorChip = { line: number | null; title: string; kind: ChipKind; short: string; more: string; link: string };
export type MentorReview = { score: number; praise: string; chips: MentorChip[] };
export const KEY_STORAGE = "mentor-api-key";
export function getApiKey(): string | null; setApiKey(k: string): void; clearApiKey(): void;
export async function analyseCode(challenge: string, code: string): Promise<MentorReview>;

// xp.ts
export type XpState = { xp: number; analyses: number; best: number; streak: number; lastDay: string };
export const RANKS = [INTERN 0, JUNIOR 250, ENGINEER 700, ANOMALY 1500];
export function loadXp(): XpState; awardXp(score: number): XpState; rankOf(xp): { name, next };
```

Steps:
- [ ] 6 challenges, each: original one-line goal, 3-4 flow boxes, refactoring.guru / MDN link, 2 related-but-different-scenario snippets (never the solution).
- [ ] `analyseCode`: POST `/v1/messages`, model `claude-sonnet-5`, `max_tokens 2048`, `thinking: {type: "disabled"}` (fast, cheap), mentor-persona system prompt (short plain language), `output_config.format` json_schema with `additionalProperties:false` everywhere; clamp score 0-100; friendly error messages for 401/429/network.
- [ ] `awardXp`: xp += score, +50 if score ≥ 80; streak: same day keeps, consecutive day increments, gap resets to 1; persists `mentor-xp`.

### Task 4: Mentor screens

**Files:**
- Create: `src/pages/drill/mentor/Mentor.tsx` (state machine, XP corner bar, boot glitch)
- Create: `src/pages/drill/mentor/Picker.tsx` (6 diagram cards + center glass idea input)
- Create: `src/pages/drill/mentor/Workspace.tsx` (code textarea, GlassWin example cards, connect-Claude window, ANALYSE, result chips)
- Create: `src/pages/drill/mentor/mentor.css`

**Interfaces:**
- Consumes: Task 1 GlassWin, Task 3 modules.
- `Mentor()` takes no props; `Picker({ onPick })`; `Workspace({ challenge, onBack, onScored })`.

Steps:
- [ ] Picker: 3-col grid, idea input spanning the middle row; each card = title + mini-flow diagram + goal line + "pattern →" link; click → workspace.
- [ ] Workspace: monospace textarea (paste blocked with a "typing is the training" hint), examples as small GlassWins (layout persisted `mentor-layout-v1`), CONNECT CLAUDE chip → GlassWin with key input (save/clear, masked), ANALYSE button (disabled w/o key+code, busy state), score+praise strip, each chip a small GlassWin: kind-coloured dot, short line, "explain →" toggle → `more` + link.
- [ ] Mentor: `mentor-boot` class for ~2 s on mount (glitch-in each card, staggered, reduced-motion safe); XP bar bottom corner: rank, xp, progress to next rank, streak; `onScored` → `awardXp`.
- [ ] mentor.css: reuse drill.css vars; kind colours smell #d8a94a / pattern #35e6ff / bug #e05b5b / style #7bdf8f.

### Task 5: Verify, review, ship

Steps:
- [ ] `npx tsc -b && npx vite build` → clean.
- [ ] Browser (dev server `lofi-cv`): unlock with password → click anomaly → mentor loads with glitch-in → pick Strategy → workspace, examples movable → paste blocked → CONNECT CLAUDE without key shows prompt → screenshots.
- [ ] code-reviewer subagent on the diff; fix Blocker/High.
- [ ] Commit + push (no API key anywhere in the diff).
