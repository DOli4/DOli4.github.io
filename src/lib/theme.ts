/**
 * Site theming — one accent, one secondary, one background, applied as CSS
 * custom properties on :root so the whole site re-tints live. Themes are
 * presets of those three; a custom pick is just an unnamed theme. Everything
 * persists to localStorage ("site-theme") and survives reloads.
 *
 * The aether backdrop reads the derived --aether-rgb / --aether-hot-rgb, so
 * changing the accent also recolors the particle network.
 */

export type Theme = {
  id: string;
  name: string;
  accent: string;    // the cyan slot — the site's primary signal
  secondary: string; // the gold slot
  bg: string;        // the void
};

export const THEMES: Theme[] = [
  { id: "anomaly", name: "ANOMALY", accent: "#35e6ff", secondary: "#d8a94a", bg: "#05060a" },
  { id: "ember",   name: "EMBER",   accent: "#ff6a3d", secondary: "#ffcf4a", bg: "#0a0605" },
  { id: "matrix",  name: "MATRIX",  accent: "#34e888", secondary: "#b6ff4a", bg: "#040906" },
  { id: "violet",  name: "VIOLET",  accent: "#a678ff", secondary: "#ff78d0", bg: "#08060e" },
  { id: "blood",   name: "BLOOD",   accent: "#ff3860", secondary: "#ff9a4a", bg: "#0b0406" },
  { id: "frost",   name: "FROST",   accent: "#8ab4ff", secondary: "#c9d6ff", bg: "#060810" },
  { id: "mono",    name: "MONO",    accent: "#cfd6e6", secondary: "#8a94ac", bg: "#06070a" },
];

const STORAGE = "site-theme";
export const THEME_EVENT = "themechange";

/* ---- tiny colour math (hex only) ---- */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function toHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
/** mix toward black (amount<0) or white (amount>0), amount in -1..1 */
function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const t = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  return toHex(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p);
}
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [hue(h + 1 / 3) * 255, hue(h) * 255, hue(h - 1 / 3) * 255];
}
/** the near-cursor "hot" accent: same hue, cranked saturation + a little
 *  brighter — reads as the base colour intensifying, not turning white */
function saturated(hex: string): [number, number, number] {
  const [h, s, l] = rgbToHsl(...hexToRgb(hex));
  return hslToRgb(h, Math.min(1, s * 1.25 + 0.2), Math.min(0.72, l + 0.12)).map(Math.round) as [number, number, number];
}

/** Apply a theme to the document and (by default) persist it. */
export function applyTheme(t: Theme, persist = true): void {
  const root = document.documentElement.style;
  root.setProperty("--cyan", t.accent);
  root.setProperty("--cyan-deep", shade(t.accent, -0.32));
  root.setProperty("--gold", t.secondary);
  root.setProperty("--void", t.bg);
  root.setProperty("--void-2", shade(t.bg, 0.04));
  // aether triplets (space-separated for rgb()/rgba())
  root.setProperty("--aether-rgb", hexToRgb(t.accent).join(" "));
  root.setProperty("--aether-hot-rgb", saturated(t.accent).join(" "));

  if (persist) {
    try { localStorage.setItem(STORAGE, JSON.stringify(t)); } catch { /* best-effort */ }
  }
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: t }));
}

export function loadSavedTheme(): Theme | null {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE) ?? "null");
    if (raw && typeof raw.accent === "string" && typeof raw.bg === "string") return raw as Theme;
  } catch { /* ignore */ }
  return null;
}

/** Call once at startup — restores the saved theme, or the default. */
export function initTheme(): void {
  applyTheme(loadSavedTheme() ?? THEMES[0], false);
}
