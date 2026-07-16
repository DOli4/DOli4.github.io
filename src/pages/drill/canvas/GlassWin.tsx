import { useRef } from "react";

export type Box = { x: number; y: number; w: number; h: number };

/** Read a persisted window layout; each surface passes its own storage key. */
export function loadLayout(key: string): Record<string, Box> {
  try { return JSON.parse(localStorage.getItem(key) ?? "{}"); } catch { return {}; }
}

/**
 * A movable frosted-glass window. Drag by header; optional corner resize.
 * Every window's box persists under its own key. Shared by the dashboard's
 * INTEL panels and the Code Mentor's example cards / teaching chips.
 */
export default function GlassWin({
  id, title, onClose, boxes, setBoxes, def, resizable, children, small,
}: {
  id: string; title: string; onClose: () => void;
  boxes: Record<string, Box>;
  setBoxes: React.Dispatch<React.SetStateAction<Record<string, Box>>>;
  def: Box; resizable?: boolean; small?: boolean;
  children: React.ReactNode;
}) {
  const box = boxes[id] ?? def;
  const boxRef = useRef(box);
  boxRef.current = box;

  function startDrag(e: React.PointerEvent, mode: "move" | "size") {
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY, start = { ...boxRef.current };
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      setBoxes((bs) => ({
        ...bs,
        [id]: mode === "move"
          ? { ...start, x: Math.min(Math.max(-start.w + 70, start.x + dx), innerWidth - 70), y: Math.min(Math.max(4, start.y + dy), innerHeight - 44) }
          : { ...start, w: Math.min(Math.max(260, start.w + dx), innerWidth - 24), h: Math.min(Math.max(180, start.h + dy), innerHeight - 40) },
      }));
    };
    const onUp = () => { removeEventListener("pointermove", onMove); removeEventListener("pointerup", onUp); };
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerup", onUp, { passive: true });
  }

  return (
    <section className={`intel${small ? " intel-small" : ""}`} style={{ left: box.x, top: box.y, width: box.w, height: box.h }}>
      <header className="intel-hd" onPointerDown={(e) => startDrag(e, "move")}>
        <span className="intel-glowline" aria-hidden />
        <span className="intel-title">{title}</span>
        <button className="intel-x" style={{ marginLeft: "auto" }} onClick={onClose} onPointerDown={(e) => e.stopPropagation()} aria-label={`Close ${title}`} data-hover>✕</button>
      </header>
      <div className="intel-bd nowheel">{children}</div>
      {resizable && <button className="intel-grip" onPointerDown={(e) => { e.stopPropagation(); startDrag(e, "size"); }} aria-label="Resize" />}
    </section>
  );
}
