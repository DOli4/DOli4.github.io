import { useEffect, useRef } from "react";
import "./tron-cursor.css";

/**
 * A precision crosshair cursor — a lagging ring + center dot with a live
 * monospace coordinate readout, for the dark-technical feel. Hides on touch /
 * reduced-motion (CSS restores the native cursor there).
 */
export default function TronCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const readRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = { x: innerWidth / 2, y: innerHeight / 2 };
    const ring = { x: target.x, y: target.y };
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (dotRef.current) dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      if (readRef.current) {
        readRef.current.textContent = `${String(e.clientX).padStart(4, "0")} · ${String(
          e.clientY,
        ).padStart(4, "0")}`;
      }
      const interactive = (e.target as HTMLElement)?.closest("a, button, [data-hover]");
      document.body.classList.toggle("cursor-hot", !!interactive);
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      ring.x += (target.x - ring.x) * 0.18;
      ring.y += (target.y - ring.y) * 0.18;
      if (ringRef.current) ringRef.current.style.transform = `translate(${ring.x}px, ${ring.y}px)`;
    };
    loop();

    window.addEventListener("mousemove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div className="tron-cursor" aria-hidden="true">
      <div ref={ringRef} className="tc-ring">
        <span ref={readRef} className="tc-read">
          0000 · 0000
        </span>
      </div>
      <div ref={dotRef} className="tc-dot" />
    </div>
  );
}
