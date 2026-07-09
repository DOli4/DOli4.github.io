# Design: Portfolio Website + GitHub Profile README

**Date:** 2026-07-09
**Author:** Dieter Olivier (with Claude)
**Status:** Approved — v2 revision in progress (see Addendum below)

---

## ADDENDUM (2026-07-09, revision) — Style-Morph Journey + Visitor Playground

Two new pillars added mid-build after the hero (Task 4) shipped. These
supersede the flat "one dark style throughout" direction of §4 where they
conflict. Awaiting user-curated 21st.dev inspiration before final per-section
styling.

### A. Style-Morph Journey
The page **evolves through web-design archetypes as you scroll** — itself the
proof of frontend range. Provisional mapping (to be refined with user's
21st.dev picks):
1. **Hero** — Brutalist / Creative (built; keep). Dark, chrome, grain, red.
2. **About** — Editorial / kinetic typography (bridge out of chaos).
3. **Skills** — Clean product / minimal (Linear/Vercel; the "professional turn").
4. **Work** — Glassmorphism / modern showcase; richer case-study cards (not flat tag cards).
5. **Experience** — Corporate / timeline (trust-builder).
6. **Contact** — Playful / interactive send-off (optional terminal callback).
- **Open decision:** transitions abrupt (hard cuts between "worlds") vs.
  smooth/morphing. User to decide while browsing.
- Work section to be deepened into 2-3 mini case studies (problem → what I
  built → tech decision → result), anonymized per §7.

### B. Visitor Playground ("Customize" panel)
Client-side only, no backend, ephemeral per-visitor:
- Floating "Customize" button → slide-out panel.
- **Accent color** (preset swatches + free picker), **theme** dark⇄light,
  **motion** full⇄reduced.
- Persist in `localStorage`; "Reset to default" button.
- **Architectural requirement:** accent color moves from a static Tailwind hex
  to a runtime **CSS custom property** (`--accent`) so the whole site repaints
  live. Tailwind `accent` token to reference `rgb(var(--accent) / <alpha>)`.
- Respect existing `prefers-reduced-motion`; the motion toggle layers on top.

### Impact on plan
- New task: CSS-variable theming refactor (accent → `--accent`) BEFORE the
  playground and before per-section restyle.
- New task: Playground context + panel + persistence.
- Tasks 5-9 (About/Skills/Work/Experience/Contact) now each carry their
  archetype styling from §A, not a uniform dark look.
- README + deployment (later tasks) unchanged.

---

## 1. Goal

Two deliverables that together present Dieter Olivier as a **full-stack developer who leans frontend**, aimed at getting hired:

1. A refreshed **GitHub profile README** (in the existing `DOli4` repo) that matches the new brand and links to the live site.
2. A **single-page portfolio website**, deployed free via GitHub Pages at `https://doli4.github.io`, that doubles as *proof of frontend skill* through code-built animation and 3D.

The site itself is the primary artifact — a recruiter looking for a frontend dev should see it and want to hire.

## 2. Non-Goals (YAGNI)

- No blog, CMS, or multi-page routing (single scrolling page only).
- No backend, forms-with-submission, or database (contact is mailto/links only).
- No company names, client names, internal project codenames, or proprietary code anywhere.
- No automated tests claimed for the mobile app (none exist — see §7 honesty constraints).

## 3. Audience & Positioning

- **Primary:** frontend / full-stack hiring managers and recruiters.
- **Positioning:** full-stack, frontend-leaning. Frontend & mobile skills are visually dominant; backend is present and credible but secondary.

## 4. Visual Direction

- **Style:** dark, experimental, editorial/brutalist — inspired by grunge zine-poster aesthetics and modern component galleries (21st.dev), tuned for hiring (no edgy thematic content).
- **Palette:** near-black base (`#0a0708`), signal-red accent (`#ff2d42`), chrome-red metallic highlights, muted off-white body text.
- **Texture:** animated film-grain overlay, red radial glow.
- **Type:** oversized blocky uppercase display (name/headings), monospace for technical labels, readable sans for body.
- **Motion:** subtle glitch on the name at load; scroll-triggered reveals on every section; hover motion on chips/cards.

### Signature hero object

A fused **A + B** concept: a **liquid-chrome red sphere** (WebGL) with a **thin red wireframe globe orbiting/wrapping it**, both reacting to mouse movement. Single cohesive centerpiece.

### Generated art

One original **dark, red-lit abstract image** (smoke / terrain / liquid) generated for use as an atmospheric section divider or backdrop. The hero itself is code-built, not the generated image.

## 5. Page Structure (single scroll)

| # | Section | Content |
|---|---------|---------|
| 1 | **Hero** | Name (brutalist red type), "Full-Stack Developer — frontend leaning", one-line hook, CTAs (View Work / Contact / GitHub), chrome sphere + wireframe object, grain + glow. |
| 2 | **About** | 3–4 sentence intro (frontend-leaning full-stack; production RN app; contributes to Java/Spring Boot microservices; comfortable across TS/Java/Angular). Final-year @ Belgium Campus, Pretoria ZA. |
| 3 | **Skills** | Grouped, frontend-dominant: **Frontend & Mobile** (lead) · **Backend** · **Familiar With**. Animated chips. Content from §8. |
| 4 | **Featured Work** | Project cards (§8). Generic descriptors only — no invented product names, no company names. |
| 5 | **Experience / What I Do** | Anonymized accomplishment bullets (§8), resume-style. |
| 6 | **Contact** | Email `Oli4Dieter@gmail.com`, LinkedIn (`https://www.linkedin.com/in/dieter-olivier-0b7799162/`), GitHub (`https://github.com/DOli4`). |

Footer: minimal, mono, e.g. "Built with React + Three.js · 2026".

## 6. Tech Stack & Architecture

- **Framework:** React + TypeScript, built with **Vite**.
- **Styling:** Tailwind CSS.
- **Animation:** Framer Motion (reveals, micro-interactions) + **react-three-fiber / Three.js** (hero sphere).
- **Structure:** component-per-section under `src/sections/`, shared UI in `src/components/`, content data in a typed `src/content/` module (so text/projects are editable in one place, decoupled from layout).
- **Accessibility & performance guardrails:**
  - Respect `prefers-reduced-motion` (disable/relax heavy motion).
  - Lazy-load the 3D hero; provide a lightweight fallback on mobile / low-power.
  - Responsive down to mobile.
  - Semantic HTML, alt text, sufficient contrast for the red-on-black combination (verify AA on body text).

## 7. Honesty & Confidentiality Constraints (hard rules)

1. **No company/client identifiers** — no names, no `za.co.drive.*` packages, no internal codenames, no raw code screenshots from the work repo.
2. **Testing claims: backend only** (JUnit 5 / Mockito / AssertJ). Do **not** claim automated testing on the mobile app — none exists.
3. **Confidential projects** stay generic ("Microservices REST API", "Admin Web Module") with no company-revealing detail.
4. Don't inflate. Only skills/experience genuinely demonstrated go on the site.

## 8. Content (source of truth for copy)

### About paragraph
> Full-stack developer who leans frontend, with hands-on experience shipping a production React Native/Expo mobile app — from authentication and maps to on-device document generation and responsive design across phone and tablet. On the backend, contributes to a Java/Spring Boot microservices architecture, writing REST APIs, service logic, and unit tests within an enterprise codebase. Cares about clean, typed code; comfortable moving between TypeScript, Java, and Angular.

### Skills
- **Frontend & Mobile (lead):** React Native + Expo (SDK 54, EAS build), TypeScript (strict), React Navigation (native-stack + drawer), AWS Amplify Auth / Cognito (email, Google, Apple), Axios (custom client w/ interceptors), react-native-maps + directions, on-device PDF/CSV (expo-print, expo-file-system, react-native-pdf), Expo/FCM push notifications, custom hooks/context (theming, responsive scaling, auth, notifications), responsive phone/tablet design.
- **Backend:** Java 24, Spring Boot 3.5, Spring Data JPA / Hibernate, PostgreSQL, Spring Security (OAuth2 resource server, JWT, custom permissions), multi-module Maven monorepo, JUnit 5 / Mockito / AssertJ.
- **Familiar With:** Angular (standalone components, Reactive Forms, Angular Material, RxJS), NgRx, JMS/ActiveMQ, OpenAPI/Swagger, Docker, CI/CD (Jenkins, Azure Pipelines), quality tooling (Spotless, PMD, SpotBugs, SonarQube).

### Featured project cards
1. **Cross-Platform Mobile App** — Production React Native/Expo/TypeScript app: multi-provider auth (Cognito, Google, Apple), maps, push notifications, on-device PDF/CSV export. Tags: React Native · Expo · TypeScript · AWS Cognito · Google Maps.
2. **Responsive Mobile UI Overhaul** — Led a full responsive-design pass across a ~17-screen app; shared scaling system for phone/tablet; consolidated styles into a reusable design layer. Tags: React Native · TypeScript · Responsive Design · Design Systems.
3. **Document Export & Sharing Flow** — Date-range picker → on-device PDF/CSV generation → native share, with cancellable requests and error handling. Tags: Expo · React Native · Axios · UX.
4. **Microservices REST API** *(confidential — generic)* — Contributed endpoints, service logic, and unit tests to a multi-service Spring Boot backend with JWT auth and a shared data layer. Tags: Java · Spring Boot · Spring Security · PostgreSQL · JUnit/Mockito.
5. **Admin Web Module** *(confidential — generic)* — Form-driven admin feature using Angular standalone components, Reactive Forms with async validation, Angular Material. Tags: Angular · RxJS · Angular Material.

### Accomplishment bullets (Experience section)
- Built and shipped a cross-platform React Native/Expo mobile app end-to-end (auth, core workflows, admin views), released via EAS to iOS and Android.
- Implemented multi-provider authentication (email/password, Google, Apple) on AWS Cognito, with token refresh, session resumption, and role-based routing.
- Designed an in-app document export flow — on-device PDF/CSV generation with date-range selection, cancellable requests, and native share.
- Built a map feature with Google Maps route/directions overlays and geolocation.
- Led a responsive-design pass across ~17 screens with a shared scaling system and consolidated style layer.
- Contributed REST endpoints and service-layer logic to a Java/Spring Boot microservices backend (Controller → Service → Repository).
- Wrote backend unit tests (JUnit 5 / Mockito / AssertJ); used SonarQube quality gates to drive coverage and refactoring.
- Contributed an Angular admin feature module (Reactive Forms, Angular Material, RxJS async validation).

## 9. Profile README (deliverable 2)

Rewrite `DOli4/README.md` to match the brand:
- Header with name + "Full-Stack Developer — frontend leaning".
- Short tagline pulled from the About paragraph.
- Compact skills list (frontend-first), mirroring §8 but concise.
- Link to the live site (`https://doli4.github.io`) as the primary CTA.
- Contact: email + LinkedIn (matching site).
- Optional: GitHub stats/tech badges (kept tasteful, on-brand colors).
- Show the new README to the user before replacing the existing one.

## 10. Deployment

- New repo **`DOli4.github.io`** (public), enabling GitHub Pages at the user/organization root domain `https://doli4.github.io`.
- **GitHub Actions** workflow: on push to `main`, build the Vite app and deploy to Pages (`actions/deploy-pages`).
- Vite `base` config set appropriately for a root user-pages site (`/`).
- Build and preview locally (`npm run dev` / `npm run build && npm run preview`) and get user sign-off **before** creating the remote repo or pushing.
- Nothing existing is deleted or overwritten without the user seeing it first. (Confirmed: no current live site or Pages deployment exists.)

## 11. Success Criteria

- Site builds cleanly and runs locally.
- Hero 3D renders, respects reduced-motion, and has a mobile fallback.
- Fully responsive; readable contrast; no console errors.
- No company/client/proprietary identifiers anywhere in output.
- Deployed and reachable at `https://doli4.github.io`.
- Profile README updated and links to the live site.
