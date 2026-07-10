import { useEffect, useState } from "react";
import { SpiralAnimation } from "./SpiralAnimation";
import "./spiral-intro.css";

/**
 * Full-screen opening. The spiral warp plays, the name breathes in, then the
 * whole gate dissolves on its own and calls onEnter() to fall into the cosmos —
 * no click required.
 */
export default function SpiralIntro({ onEnter }: { onEnter: () => void }) {
  const [nameVisible, setNameVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setNameVisible(true), 1400);
    const fade = setTimeout(() => setLeaving(true), 4600);
    const done = setTimeout(onEnter, 5600);
    return () => {
      clearTimeout(show);
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, [onEnter]);

  return (
    <div className={`spiral-intro ${leaving ? "is-leaving" : ""}`}>
      <div className="spiral-intro-canvas">
        <SpiralAnimation />
      </div>

      <div className={`spiral-cta ${nameVisible ? "is-visible" : ""}`}>
        <p className="spiral-kicker">Dieter Olivier</p>
        <p className="spiral-hint">a quiet descent, from space to a still hillside</p>
      </div>
    </div>
  );
}
