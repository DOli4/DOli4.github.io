import { useEffect, useState } from "react";
import Picker from "./Picker";
import Workspace from "./Workspace";
import type { Challenge } from "./challenges";
import { awardXp, loadXp, rankOf, type XpState } from "./xp";
import "./mentor.css";

/**
 * CODE MENTOR — the gamified teacher screen behind the gate.
 * Picker ⇄ Workspace state machine; XP/rank bar lives in the corner across
 * both. Everything glitch-boots in on mount (reduced-motion safe in CSS).
 */
export default function Mentor() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [xp, setXp] = useState<XpState>(loadXp);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 2200);
    return () => clearTimeout(t);
  }, []);

  const rank = rankOf(xp.xp);

  return (
    <div className={`mentor${booting ? " m-boot" : ""}`}>
      {challenge === null ? (
        <Picker onPick={setChallenge} />
      ) : (
        <Workspace
          challenge={challenge}
          onBack={() => setChallenge(null)}
          onScored={(score) => setXp(awardXp(score))}
        />
      )}

      <aside className="m-xp" aria-label="Your rank and XP">
        <div className="m-xp-top">
          <b className="m-rank">{rank.name}</b>
          <span className="m-xp-n">{xp.xp} XP</span>
        </div>
        <div className="m-xp-bar" role="progressbar" aria-valuenow={rank.pct} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${rank.pct}%` }} />
        </div>
        <div className="m-xp-sub">
          {rank.next !== null ? <span>next rank at {rank.next}</span> : <span>max rank</span>}
          {xp.streak > 1 && <span className="m-streak">streak ×{xp.streak}</span>}
        </div>
      </aside>
    </div>
  );
}
