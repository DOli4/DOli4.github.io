# ANOMALY — Dieter Olivier

A dark-premium personal CV site. Scroll-driven descent through a rotating 3D
wireframe "anomalous matter" object, a neon Tron zone, and RGB-split glitch
type. Built with React + TypeScript + Vite, Three.js, GSAP, and Tailwind.

**Live:** https://doli4.github.io/

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
```

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
publishes `dist/` to GitHub Pages. The Vite `base` in `vite.config.ts` is `/`
for the root `doli4.github.io` user page.
