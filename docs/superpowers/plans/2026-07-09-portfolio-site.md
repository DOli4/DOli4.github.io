# Portfolio Website + Profile README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a dark, brutalist, red-accented single-page portfolio site (React + Three.js) at `https://doli4.github.io`, plus refresh the GitHub profile README to match.

**Architecture:** A Vite + React + TypeScript SPA. All copy lives in one typed content module (`src/content/`), consumed by section components (`src/sections/`). The hero renders a WebGL chrome sphere + wireframe globe via react-three-fiber, with a `prefers-reduced-motion` / mobile fallback. Framer Motion drives scroll reveals. Deployed via a GitHub Actions workflow to GitHub Pages.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, react-three-fiber + three, GitHub Actions + Pages.

## Global Constraints

- **No company/client identifiers** anywhere: no company names, no `za.co.drive.*` packages, no internal codenames, no raw work-repo code/screenshots.
- **Testing claims: backend only** (JUnit 5 / Mockito / AssertJ). Never claim automated testing on the mobile app.
- **Confidential projects** ("Microservices REST API", "Admin Web Module") stay generic — no company-revealing detail.
- **Accent color:** signal-red `#ff2d42`. **Base:** near-black `#0a0708`. Body text: muted off-white.
- **Accessibility:** respect `prefers-reduced-motion`; body text must meet WCAG AA contrast; all images need alt text.
- **Commits:** never run `git commit`. Each "commit" step **stages** files (`git add`) and provides a title + description for the user to commit themselves.
- **Contact:** email `Oli4Dieter@gmail.com`, LinkedIn `https://www.linkedin.com/in/dieter-olivier-0b7799162/`, GitHub `https://github.com/DOli4`.
- **Deploy target:** user-pages site `DOli4.github.io`, Vite `base: '/'`.
- Do not create the remote repo or push until the user has previewed locally and approved (Task 13).

---

### Task 1: Scaffold project + tooling

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `tailwind.config.js`, `postcss.config.js`, `src/index.css`, `.gitignore`

**Interfaces:**
- Produces: a running Vite dev server; `App` root component rendering a placeholder.

- [ ] **Step 1: Scaffold Vite React-TS app** in `C:/Projects/dieter-portfolio-site`

```bash
cd /c/Projects/dieter-portfolio-site
npm create vite@latest . -- --template react-ts
npm install
```
If the directory is non-empty, choose "Ignore files and continue".

- [ ] **Step 2: Install dependencies**

```bash
npm install framer-motion three @react-three/fiber @react-three/drei
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 3: Configure Tailwind** — set `tailwind.config.js` `content` to `["./index.html","./src/**/*.{ts,tsx}"]` and extend theme colors:

```js
theme: { extend: { colors: { base: '#0a0708', accent: '#ff2d42', ink: '#e8dcde' } } }
```

- [ ] **Step 4: Replace `src/index.css`** with Tailwind directives + base body styles:

```css
@tailwind base; @tailwind components; @tailwind utilities;
html,body,#root{margin:0;background:#0a0708;color:#e8dcde;}
@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important;}}
```

- [ ] **Step 5: Add `.gitignore`** entries: `node_modules`, `dist`, `.superpowers/`, `.DS_Store`, `*.local`.

- [ ] **Step 6: Verify dev server runs**

Run: `npm run dev` — open the printed localhost URL. Expected: Vite starts with no errors; page renders.

- [ ] **Step 7: Stage & prepare commit**

```bash
git init && git add -A
```
Hand user commit title: `chore: scaffold Vite React-TS portfolio with Tailwind + Three.js`
Description: `Initial project scaffold, Tailwind config with brand colors, core deps (framer-motion, three, r3f).`

---

### Task 2: Typed content module (single source of truth)

**Files:**
- Create: `src/content/site.ts`, `src/content/types.ts`

**Interfaces:**
- Produces: `siteContent` object and types `Project`, `SkillGroup`, `SiteContent` used by all sections.

- [ ] **Step 1: Define types** in `src/content/types.ts`:

```ts
export interface Project { title: string; blurb: string; tags: string[]; confidential?: boolean; }
export interface SkillGroup { heading: string; lead?: boolean; items: string[]; }
export interface SiteContent {
  name: string; role: string; hook: string; location: string;
  about: string; skills: SkillGroup[]; projects: Project[];
  experience: string[];
  contact: { email: string; linkedin: string; github: string; };
}
```

- [ ] **Step 2: Populate `src/content/site.ts`** with the exact copy from the spec §8 (About paragraph, three skill groups with Frontend & Mobile marked `lead:true`, five projects with #4/#5 `confidential:true`, all eight accomplishment bullets, contact block). Import `SiteContent` and type the export.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Stage & prepare commit**

```bash
git add src/content
```
Title: `feat: add typed site content module`
Description: `Single source of truth for all portfolio copy (about, skills, projects, experience, contact).`

---

### Task 3: Layout shell + design tokens + grain overlay

**Files:**
- Create: `src/components/GrainOverlay.tsx`, `src/components/Section.tsx`
- Modify: `src/App.tsx`, `src/index.css`

**Interfaces:**
- Consumes: nothing.
- Produces: `<Section id title>` wrapper (semantic `<section>` with scroll-reveal via Framer Motion `whileInView`); `<GrainOverlay/>` fixed film-grain layer.

- [ ] **Step 1: Create `GrainOverlay.tsx`** — a `position:fixed inset-0 pointer-events-none` div using an inline SVG `feTurbulence` data-URI background at ~0.10 opacity, `mix-blend-mode:overlay`.

- [ ] **Step 2: Create `Section.tsx`** — props `{id, title?, children}`. Wrap children in `motion.section` with `initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}}`, max-width container, vertical padding. Title rendered as uppercase mono label + large heading.

- [ ] **Step 3: Rewrite `App.tsx`** to render `<GrainOverlay/>` + placeholder `<Section>`s for hero/about/skills/work/experience/contact (empty for now).

- [ ] **Step 4: Verify visually**

Run: `npm run dev`. Expected: dark page, faint grain texture, section placeholders fade in on scroll.

- [ ] **Step 5: Stage & prepare commit**

```bash
git add src/components/GrainOverlay.tsx src/components/Section.tsx src/App.tsx src/index.css
```
Title: `feat: add layout shell, section wrapper, and grain overlay`

---

### Task 4: Hero — 3D chrome sphere + wireframe + fallback

**Files:**
- Create: `src/sections/Hero.tsx`, `src/components/ChromeScene.tsx`, `src/hooks/useReducedMotion.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `siteContent` (name, role, hook, location).
- Produces: `<Hero/>` section.

- [ ] **Step 1: `useReducedMotion.ts`** — hook returning boolean from `window.matchMedia('(prefers-reduced-motion: reduce)')`, updating on change.

- [ ] **Step 2: `ChromeScene.tsx`** — react-three-fiber `<Canvas>` with: a sphere using a reflective/`MeshDistortMaterial` (drei) in red-chrome tones; a wireframe sphere (`wireframe` material) slightly larger, slowly rotating; lighting; subtle mouse-parallax on the group. Lazy-loaded via `React.lazy`.

- [ ] **Step 3: `Hero.tsx`** — full-viewport section. Left/foreground: mono label row (role · frontend-leaning · location), brutalist uppercase name in accent red with load glitch animation, hook line with red left-border, CTA buttons (View Work → `#work`, Contact → `#contact`, GitHub → external). Right/behind: `<Suspense>`-wrapped `ChromeScene`. If `useReducedMotion()` or viewport width < 768px, render a static red radial-glow gradient instead of the Canvas.

- [ ] **Step 4: Wire into `App.tsx`** replacing the hero placeholder.

- [ ] **Step 5: Verify visually + reduced-motion**

Run: `npm run dev`. Expected: sphere + wireframe render and react to mouse; toggling OS reduced-motion (or narrowing to mobile width) shows the static fallback; no console errors.

- [ ] **Step 6: Stage & prepare commit**

```bash
git add src/sections/Hero.tsx src/components/ChromeScene.tsx src/hooks/useReducedMotion.ts src/App.tsx
```
Title: `feat: add hero with WebGL chrome sphere + wireframe and reduced-motion fallback`

---

### Task 5: About section

**Files:**
- Create: `src/sections/About.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `siteContent.about`, `siteContent.location`.

- [ ] **Step 1: Build `About.tsx`** using `<Section id="about" title="About">` — render the about paragraph and a small meta line (Final-year @ Belgium Campus · Pretoria, ZA).

- [ ] **Step 2: Wire into `App.tsx`.**

- [ ] **Step 3: Verify visually.** Run: `npm run dev`. Expected: About renders and reveals on scroll.

- [ ] **Step 4: Stage & prepare commit**

```bash
git add src/sections/About.tsx src/App.tsx
```
Title: `feat: add About section`

---

### Task 6: Skills section

**Files:**
- Create: `src/sections/Skills.tsx`, `src/components/Chip.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `siteContent.skills` (`SkillGroup[]`).
- Produces: `<Chip label>` with hover motion.

- [ ] **Step 1: `Chip.tsx`** — accent-bordered pill, `whileHover={{y:-2}}`, mono text.

- [ ] **Step 2: `Skills.tsx`** — `<Section id="skills" title="Skills">`. Map skill groups; the `lead` group (Frontend & Mobile) gets a larger heading / more prominent styling and appears first. Render chips per group with staggered reveal.

- [ ] **Step 3: Wire into `App.tsx`.**

- [ ] **Step 4: Verify visually.** Expected: three groups, frontend group visually dominant, chips animate on hover.

- [ ] **Step 5: Stage & prepare commit**

```bash
git add src/sections/Skills.tsx src/components/Chip.tsx src/App.tsx
```
Title: `feat: add Skills section with grouped chips`

---

### Task 7: Featured Work section

**Files:**
- Create: `src/sections/Work.tsx`, `src/components/ProjectCard.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `siteContent.projects` (`Project[]`).
- Produces: `<ProjectCard project>`.

- [ ] **Step 1: `ProjectCard.tsx`** — dark card, accent hover border/glow, `whileHover` lift. Shows title, blurb, tag row. If `project.confidential`, show a small mono "confidential" marker (no company detail).

- [ ] **Step 2: `Work.tsx`** — `<Section id="work" title="Featured Work">`, responsive grid of `ProjectCard`s with staggered reveal.

- [ ] **Step 3: Wire into `App.tsx`.**

- [ ] **Step 4: Verify visually.** Expected: five cards, generic names only, hover motion works, no company identifiers.

- [ ] **Step 5: Stage & prepare commit**

```bash
git add src/sections/Work.tsx src/components/ProjectCard.tsx src/App.tsx
```
Title: `feat: add Featured Work section with project cards`

---

### Task 8: Experience section

**Files:**
- Create: `src/sections/Experience.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `siteContent.experience` (`string[]`).

- [ ] **Step 1: Build `Experience.tsx`** — `<Section id="experience" title="What I Do">`, render bullets as an accent-marked list with staggered reveal.

- [ ] **Step 2: Wire into `App.tsx`.**

- [ ] **Step 3: Verify visually.** Expected: all eight bullets render, anonymized.

- [ ] **Step 4: Stage & prepare commit**

```bash
git add src/sections/Experience.tsx src/App.tsx
```
Title: `feat: add Experience section`

---

### Task 9: Contact section + footer

**Files:**
- Create: `src/sections/Contact.tsx`, `src/components/Footer.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `siteContent.contact`.

- [ ] **Step 1: `Contact.tsx`** — `<Section id="contact" title="Get in touch">`, large mailto link + LinkedIn + GitHub links with hover motion.

- [ ] **Step 2: `Footer.tsx`** — minimal mono footer: `Built with React + Three.js · 2026`.

- [ ] **Step 3: Wire both into `App.tsx`.**

- [ ] **Step 4: Verify visually.** Expected: links correct (email/LinkedIn/GitHub from constraints), footer present.

- [ ] **Step 5: Stage & prepare commit**

```bash
git add src/sections/Contact.tsx src/components/Footer.tsx src/App.tsx
```
Title: `feat: add Contact section and footer`

---

### Task 10: Generated hero/divider art

**Files:**
- Create: `public/art/divider.<ext>` (generated), integrate in one section divider.
- Modify: relevant section (e.g., between Work and Experience) or `Section.tsx` for an optional `backdrop` prop.

**Interfaces:**
- Produces: optional `backdrop` image slot.

- [ ] **Step 1: Generate original art** — a dark, red-lit abstract image (smoke / terrain / liquid). Use the available image-generation skill in the design bundle. Save to `public/art/divider.<ext>`. (Original — no licensing/attribution issues.)

- [ ] **Step 2: Add optional `backdrop?` prop to `Section.tsx`** rendering the image as a low-opacity full-bleed background with dark overlay for text contrast; add `alt` text.

- [ ] **Step 3: Apply to one divider section.**

- [ ] **Step 4: Verify visually.** Expected: atmospheric backdrop behind one section, text still readable (contrast preserved).

- [ ] **Step 5: Stage & prepare commit**

```bash
git add public/art src/components/Section.tsx src/App.tsx
```
Title: `feat: add generated abstract art backdrop`

---

### Task 11: Responsive + accessibility pass

**Files:**
- Modify: any section needing responsive/a11y fixes.

**Interfaces:** none new.

- [ ] **Step 1: Test mobile layout** at 375px (preview resize). Fix overflow, stacking, font scaling across all sections.

- [ ] **Step 2: Confirm reduced-motion** disables 3D/animations and static fallback shows.

- [ ] **Step 3: Contrast + semantics check** — body text meets AA on `#0a0708`; headings use semantic tags; all images have alt; CTA links keyboard-focusable with visible focus ring.

- [ ] **Step 4: Verify build + lint**

Run: `npx tsc --noEmit && npm run build && npm run lint`
Expected: all pass, no errors.

- [ ] **Step 5: Stage & prepare commit**

```bash
git add -A
```
Title: `fix: responsive layout and accessibility pass`

---

### Task 12: Deploy config (GitHub Actions + Pages)

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `vite.config.ts` (`base: '/'`)

**Interfaces:** none.

- [ ] **Step 1: Set `base: '/'`** in `vite.config.ts` (correct for a `USER.github.io` root site).

- [ ] **Step 2: Create `.github/workflows/deploy.yml`** — on push to `main`: checkout, setup-node 20, `npm ci`, `npm run build`, `actions/upload-pages-artifact` (path `dist`), `actions/deploy-pages`. Include `permissions: {pages: write, id-token: write}` and `concurrency`.

- [ ] **Step 3: Verify build output** locally.

Run: `npm run build && npm run preview`
Expected: production build serves correctly at the preview URL.

- [ ] **Step 4: Stage & prepare commit**

```bash
git add .github/workflows/deploy.yml vite.config.ts
```
Title: `ci: add GitHub Pages deploy workflow`

---

### Task 13: Local preview sign-off (USER GATE)

**Files:** none.

- [ ] **Step 1: Run full site locally** (`npm run dev`) and walk the user through it. Drive it with preview tools; capture the hero, skills, work, contact.

- [ ] **Step 2: Collect change requests** and apply any tweaks the user wants (this is the "I'll change when I see it" checkpoint).

- [ ] **Step 3: Get explicit approval to create the remote repo and deploy.**

---

### Task 14: Create repo + deploy

**Files:** none (remote operations).

- [ ] **Step 1: Confirm with user before each outward action.**

- [ ] **Step 2: Create the repo**

```bash
gh repo create DOli4/DOli4.github.io --public --source . --remote origin --push
```

- [ ] **Step 3: Enable Pages via Actions** (if not auto): set Pages source to "GitHub Actions" in repo settings via `gh api` or confirm the workflow ran.

- [ ] **Step 4: Verify deployment** — wait for the Actions run, then confirm `https://doli4.github.io` loads.

Run: `gh run list --repo DOli4/DOli4.github.io`
Expected: latest run succeeded; site reachable.

---

### Task 15: Refresh profile README

**Files:**
- Modify (remote): `DOli4/README.md`

**Interfaces:**
- Consumes: same content/brand as the site.

- [ ] **Step 1: Draft new `README.md`** — header with name + "Full-Stack Developer — frontend leaning"; tagline from About; concise frontend-first skills list; **primary CTA link to `https://doli4.github.io`**; contact (email + LinkedIn); optional tasteful tech badges in brand colors.

- [ ] **Step 2: Show the draft to the user** and get approval (spec requires showing before replacing).

- [ ] **Step 3: Push the update** (after approval)

```bash
gh api -X PUT repos/DOli4/DOli4/contents/README.md -f message="docs: refresh profile README" -f content="$(base64 -w0 README.md)" -f sha="<current-sha>"
```
(Fetch current sha first; or clone/commit/push.)

- [ ] **Step 4: Verify** the README renders on the profile.

---

## Self-Review

**Spec coverage:** Hero/About/Skills/Work/Experience/Contact → Tasks 4–9. Visual direction/tokens → Tasks 1,3. Content §8 → Task 2. Generated art → Task 10. A11y/responsive guardrails → Tasks 4,11. Stack → Task 1. Deployment → Tasks 12,14. README → Task 15. All spec sections covered.

**Placeholder scan:** No TBD/TODO left; each task has concrete files, actions, and verify commands. Visual tasks use build/typecheck/visual gates in lieu of unit tests (appropriate for a static visual site).

**Type consistency:** `SiteContent`/`Project`/`SkillGroup` defined in Task 2 and consumed by name in Tasks 4–9. `Section` gains `backdrop?` in Task 10 (additive). `useReducedMotion` defined Task 4, reused Task 11.

**Honesty/confidentiality:** enforced in Global Constraints and reaffirmed in Tasks 2, 7, 11.
