# CODE MENTOR — build spec (Dieter's request, 2026-07-16)

A gamified teacher screen where Dieter TYPES code and Claude reviews it.
He learns by doing, has reading difficulties (diagrams > text), vibe-codes
when tired — this is the place that forces deliberate practice.

## Entry
- Clicking the ANOMALY on the dashboard navigates to `#/drill/mentor`
  (behind the same password gate; add route + edge-nav tab "Mentor").

## Screen 1 — challenge picker (see his screenshot 1: BFF fan-out diagram)
- Node-style option cards in ANOMALY design: 4-6 curated challenges, each a
  small diagram (mini-flow boxes) of WHAT to build, not how:
  e.g. "BFF endpoint that merges 3 downstream calls", "Strategy pattern for
  km-billing rules", "Observer for notification gating", "Builder for a
  vehicle response DTO". Derive ideas from design patterns (see Teaching).
- Center: a glass input bar — "type something you want to code" → sends the
  free-text idea to the same workspace.

## Screen 2 — workspace (see screenshot 2: mapping diagram look)
- Left/main: a large code TEXTAREA (monospace, line numbers optional).
  No paste from the examples: examples are RELATED snippets (same technique,
  different scenario) shown beside — he must type his own.
- Right: example cards (glass, movable — reuse GlassWin from FloatPanel).
- Bottom: ANALYSE button.

## Analyse flow (his Claude API key)
- Settings chip: "connect Claude" → input for API key, stored ONLY in
  localStorage (`mentor-api-key`), never committed, never sent anywhere but
  api.anthropic.com. Direct browser call needs header
  `anthropic-dangerous-direct-browser-access: true`, model `claude-sonnet-5`,
  plus `anthropic-version: 2023-06-01`.
- Prompt: system = mentor persona (short, plain language, diagram-minded);
  user = challenge + his typed code. Ask for STRICT JSON:
  `{ score: 0-100, praise: string, chips: [{ line?: number, title, kind:
  "smell"|"pattern"|"bug"|"style", short, more, link }] }`
  - `link`: prefer https://refactoring.guru/design-patterns/<pattern> or
    w3schools/MDN pages.
- Render chips as movable glass chips (GlassWin small) pinned near the code;
  click expands `more` + the link.

## Gamification
- Points: score/analysis; streaks stored in localStorage (`mentor-xp`),
  XP bar in the corner; +bonus for finishing a challenge (score ≥ 80).
  Show rank names (e.g. INTERN → JUNIOR → ENGINEER → ANOMALY).

## Teaching material
- Seed challenge list + example snippets from refactoring.guru's catalog
  (Strategy, Observer, Builder, Factory Method, Decorator, Adapter) — write
  ORIGINAL short descriptions/diagrams, link out to the site; do not copy
  their text (copyright).

## Style
- Everything movable (GlassWin), subtle drift/hover animations, glitch-in on
  load (reuse `.is-booting` pattern), reduced-motion safe.
- All info as diagrams: mini-flow boxes, step chains — never paragraphs.

## Files (suggested)
- `src/pages/drill/mentor/Mentor.tsx` (+ Picker.tsx, Workspace.tsx,
  mentor.css), `src/lib/mentor-claude.ts` (API call), route "drill-mentor"
  in router.ts, anomaly onClick in DashNodes CoreNode → `#/drill/mentor`.
