import { useEffect, useRef, useState } from "react";
import { applyTheme, loadSavedTheme, THEMES, type Theme } from "../lib/theme";
import "./themer.css";

type Box = { x: number; y: number; w: number; h: number };
const LAYOUT_KEY = "themer-box";
const DEFAULT_BOX: Box = { x: 24, y: 92, w: 320, h: 420 };

function loadBox(): Box {
  try { return { ...DEFAULT_BOX, ...JSON.parse(localStorage.getItem(LAYOUT_KEY) ?? "{}") }; }
  catch { return DEFAULT_BOX; }
}

/**
 * The ⟠ mark opens this: a little menu (Modify / Go home), and Modify opens a
 * movable, resizable theming window — preset themes plus three colour pickers
 * (accent, secondary, background) that re-tint the whole site live and persist.
 * Mounted globally; the mark button dispatches "mark-menu" to toggle it.
 */
export default function Themer() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [box, setBox] = useState<Box>(loadBox);
  const boxRef = useRef(box);
  boxRef.current = box;

  // the working theme (starts from whatever is applied / saved)
  const [theme, setTheme] = useState<Theme>(
    () => loadSavedTheme() ?? THEMES[0],
  );

  useEffect(() => {
    const toggle = () => setMenuOpen((v) => !v);
    addEventListener("mark-menu", toggle);
    // Escape closes whatever's open — keyboard users need an out
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      setModifyOpen(false);
    };
    addEventListener("keydown", onKey);
    return () => { removeEventListener("mark-menu", toggle); removeEventListener("keydown", onKey); };
  }, []);

  function startDrag(e: React.PointerEvent, mode: "move" | "size") {
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY, start = { ...boxRef.current };
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      setBox(mode === "move"
        ? { ...start, x: Math.min(Math.max(-start.w + 60, start.x + dx), innerWidth - 60), y: Math.min(Math.max(4, start.y + dy), innerHeight - 40) }
        : { ...start, w: Math.min(Math.max(260, start.w + dx), innerWidth - 24), h: Math.min(Math.max(240, start.h + dy), innerHeight - 40) });
    };
    const onUp = () => {
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerup", onUp);
      // persist once at gesture end, not per-frame; best-effort on quota
      try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(boxRef.current)); } catch { /* ignore */ }
    };
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerup", onUp, { passive: true });
  }

  // change one field of the custom theme and apply live
  const setField = (field: "accent" | "secondary" | "bg", value: string) => {
    const next: Theme = { ...theme, id: "custom", name: "CUSTOM", [field]: value };
    setTheme(next);
    applyTheme(next);
  };
  const pickPreset = (t: Theme) => { setTheme(t); applyTheme(t); };

  const swatch = (label: string, field: "accent" | "secondary" | "bg") => (
    <label className="tm-row">
      <span className="tm-row-k">{label}</span>
      <span className="tm-swatch" style={{ background: theme[field] }}>
        <input
          type="color"
          value={theme[field]}
          onChange={(e) => setField(field, e.target.value)}
          aria-label={label}
        />
      </span>
      <span className="tm-hex">{theme[field].toUpperCase()}</span>
    </label>
  );

  return (
    <>
      {menuOpen && (
        <>
          <div className="tm-scrim" onClick={() => setMenuOpen(false)} aria-hidden />
          <div className="tm-menu" role="menu">
            <button className="tm-menu-item" onClick={() => { setModifyOpen(true); setMenuOpen(false); }} data-hover>
              ✎ Modify theme
            </button>
            <button className="tm-menu-item" onClick={() => { window.location.hash = "#/"; setMenuOpen(false); }} data-hover>
              ⌂ Go home
            </button>
          </div>
        </>
      )}

      {modifyOpen && (
        <section className="tm-win" style={{ left: box.x, top: box.y, width: box.w, height: box.h }} aria-label="Theme editor">
          <header className="tm-hd" onPointerDown={(e) => startDrag(e, "move")}>
            <span className="tm-glow" aria-hidden />
            <span className="tm-title">THEME</span>
            <button className="tm-x" onClick={() => setModifyOpen(false)} onPointerDown={(e) => e.stopPropagation()} aria-label="Close" data-hover>✕</button>
          </header>

          <div className="tm-bd">
            <p className="tm-k">PRESETS</p>
            <div className="tm-presets">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  className={`tm-preset${theme.id === t.id ? " is-on" : ""}`}
                  onClick={() => pickPreset(t)}
                  title={t.name}
                  data-hover
                >
                  <span className="tm-preset-dots">
                    <i style={{ background: t.accent }} />
                    <i style={{ background: t.secondary }} />
                    <i style={{ background: t.bg, borderColor: "rgba(255,255,255,0.15)" }} />
                  </span>
                  {t.name}
                </button>
              ))}
            </div>

            <p className="tm-k">CUSTOM</p>
            {swatch("Accent", "accent")}
            {swatch("Secondary", "secondary")}
            {swatch("Background", "bg")}

            <button className="tm-reset" onClick={() => pickPreset(THEMES[0])} data-hover>
              reset to ANOMALY
            </button>
            <p className="tm-note">changes apply live and stay saved on this device.</p>
          </div>

          <button className="tm-grip" onPointerDown={(e) => { e.stopPropagation(); startDrag(e, "size"); }} aria-label="Resize" />
        </section>
      )}
    </>
  );
}
