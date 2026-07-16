import { Handle, Position, type NodeProps } from "@xyflow/react";
import AnomalyHub from "../../../components/AnomalyHub";
import type { Drill, Tier } from "../../../lib/drill-crypto";
import { hostOf, removeArtifact, type Artifact } from "../../../lib/artifacts";
import { ArtifactQuickAdd } from "../ArtifactQuickAdd";
import { JUMP_KEY } from "../DailyDrill";

/**
 * The dashboard's node cards — PicGen/ComfyUI style: dark glass card, status
 * dot in the header, labelled ports on the edges. Dragging is restricted to
 * the header (dragHandle: ".nd-hd") so inputs and buttons inside stay usable.
 */

function Card({
  title,
  dot,
  children,
  wide,
}: {
  title: string;
  dot: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`nd${wide ? " nd-wide" : ""}`}>
      <div className="nd-hd">
        <span className="nd-dot" style={{ background: dot, boxShadow: `0 0 8px ${dot}99` }} />
        {title}
      </div>
      <div className="nd-bd">{children}</div>
    </div>
  );
}

/** Target port facing the core; side comes from node data so the layout
 *  decides which edge of the card the cable lands on. */
function SatPort({ data, blue }: { data: Record<string, unknown>; blue?: boolean }) {
  const side = (data.tpos as string) ?? "left";
  const pos =
    side === "right" ? Position.Right : side === "top" ? Position.Top : side === "bottom" ? Position.Bottom : Position.Left;
  return <Handle type="target" position={pos} className={`rf-port ${blue ? "blue" : "on"}`} />;
}

/* --- latest drill (the "Model" of the graph) --- */
export function DrillNode({ data }: NodeProps) {
  const drill = data.drill as Drill;
  return (
    <Card title="Latest drill" dot="#e05b5b">
      <div className="nd-rows">
        <div className="nd-row">
          <span>word</span>
        </div>
        <div className="nd-row">
          <span>questions</span>
        </div>
      </div>
      <div className="nd-field nd-field-solid">
        <span>{drill.date}</span>
        <span className="nd-chip">{(data.count as number)} days</span>
      </div>
      <p className="nd-note">{drill.focus}</p>
      <SatPort data={data} />
    </Card>
  );
}

/* --- word of the day (the "Positive prompt") --- */
export function WordNode({ data }: NodeProps) {
  const drill = data.drill as Drill;
  return (
    <Card title="Word of the day" dot="#d8a94a">
      <div className="nd-word">{drill.word.term}</div>
      <div className="nd-ta">{drill.word.meaning}</div>
      <a className="nd-ghost" href="#/drill/today" data-hover>
        say it out loud, then reveal
      </a>
      <SatPort data={data} />
    </Card>
  );
}

/* --- question bank (scrolls inside the node) --- */
export function BankNode({ data }: NodeProps) {
  const drills = data.drills as Drill[];
  const jump = (date: string) => {
    sessionStorage.setItem(JUMP_KEY, date);
    window.location.hash = "#/drill/today";
  };
  return (
    <Card title="Question bank" dot="#35e6ff" wide>
      {/* nowheel: let the list scroll without zooming the canvas */}
      <div className="nd-scroll nowheel">
        {drills.map((d) => (
          <div key={d.date} className="nd-bank-day">
            <div className="nd-bank-hd">
              <span className="nd-bank-date">{d.date}</span>
              <button className="nd-chip nd-chip-btn" onClick={() => jump(d.date)} data-hover>
                train →
              </button>
            </div>
            {d.questions.map((q, i) => (
              <p key={i} className="nd-bank-q">
                {q.q}
              </p>
            ))}
          </div>
        ))}
      </div>
      <SatPort data={data} />
    </Card>
  );
}

/* --- stats (the "Image Generator" settings block) --- */
export function StatsNode({ data }: NodeProps) {
  const s = data.stats as {
    days: number;
    questions: number;
    terms: number;
    saidCount: number;
    mustSayTotal: number;
  };
  const pct = s.mustSayTotal === 0 ? 0 : Math.round((s.saidCount / s.mustSayTotal) * 100);
  return (
    <Card title="Progress" dot="#7bdf8f">
      <div className="nd-field">
        <span>Questions</span>
        <b>{s.questions}</b>
      </div>
      <div className="nd-field">
        <span>Terms collected</span>
        <b>{s.terms}</b>
      </div>
      <div className="nd-field">
        <span>Words said out loud</span>
        <b>{s.saidCount}</b>
      </div>
      <div className="nd-field">
        <span>Coverage</span>
        <b className="nd-pct">{pct}%</b>
      </div>
      <SatPort data={data} />
    </Card>
  );
}

/* --- artifacts (add + list, manageable in place) --- */
export function ArtifactsNode({ data }: NodeProps) {
  const artifacts = data.artifacts as Artifact[];
  const tier = data.tier as Tier;
  const onChange = data.onChange as (list: Artifact[]) => void;
  return (
    <Card title="Artifacts" dot="#5aa2ff" wide>
      <ArtifactQuickAdd onChange={onChange} tier={tier} compact />
      <div className="nd-scroll nd-scroll-short nowheel">
        {artifacts.length === 0 && <p className="nd-note">nothing saved yet — paste a link</p>}
        {artifacts.map((a) => (
          <div key={a.id} className="nd-art">
            <a href={a.url} target="_blank" rel="noopener noreferrer" data-hover>
              {a.title}
            </a>
            {a.personal && <span className="art-tag">personal</span>}
            <span className="nd-art-host">{hostOf(a.url)}</span>
            <button
              className="art-del"
              onClick={() => onChange(removeArtifact(a.id))}
              aria-label={`Delete ${a.title}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <a className="nd-ghost" href="#/drill/artifacts" data-hover>
        open the vault →
      </a>
      <SatPort data={data} blue />
    </Card>
  );
}

/* --- the CORE: the anomaly, big and glowing, every cable starts here --- */
export function AnomalyNode({ data }: NodeProps) {
  const pct = data.pct as number;
  return (
    <div className="core">
      <div className="core-hub nowheel nodrag">
        <AnomalyHub nodes={[]} hint="" />
      </div>
      <div className="core-cap nd-hd">
        <span className="nd-dot" style={{ background: "#35e6ff", boxShadow: "0 0 8px #35e6ff99" }} />
        ANOMALY · {pct}% spoken
        <span className="core-prog"><i style={{ width: `${pct}%` }} /></span>
      </div>
      <a className="nd-cta core-cta" href="#/drill/today" data-hover>
        open today&rsquo;s drill →
      </a>
      {/* cables leave from every side */}
      <Handle type="source" position={Position.Left} id="w1" className="rf-port on" style={{ top: "34%" }} />
      <Handle type="source" position={Position.Left} id="w2" className="rf-port on" style={{ top: "62%" }} />
      <Handle type="source" position={Position.Right} id="e1" className="rf-port on" style={{ top: "34%" }} />
      <Handle type="source" position={Position.Right} id="e2" className="rf-port on" style={{ top: "62%" }} />
      <Handle type="source" position={Position.Bottom} id="s1" className="rf-port blue" style={{ left: "50%" }} />
    </div>
  );
}
