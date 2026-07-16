import { useCallback, useRef } from "react";
import { Handle, NodeResizer, Position, useUpdateNodeInternals, type NodeProps } from "@xyflow/react";
import AnomalyHub, { type HubNode } from "../../../components/AnomalyHub";
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
    <div className={`nd spot${wide ? " nd-wide" : ""}`}>
      {/* click a card to select it - the resize handles appear */}
      <NodeResizer minWidth={190} minHeight={90} lineClassName="nd-rz-line" handleClassName="nd-rz-dot" />
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

/* --- the CORE: the anomaly, boxless and centered. The five cable anchors
   are points ON the rotating mass: the hub projects them each frame, the
   handles move to match, and updateNodeInternals makes the edges follow. --- */
const EMPTY_CHIPS: HubNode[] = []; // stable — a fresh [] each render re-runs the hub's effect forever

/* --- small satellite chip: a shareable artifact link cabled to the core --- */
export function ChipNode({ data }: NodeProps) {
  return (
    <a
      className="chip-node"
      href={data.url as string}
      target="_blank"
      rel="noopener noreferrer"
      data-hover
    >
      <span className="hub-node-dot" aria-hidden />
      {data.title as string}
      <SatPort data={data} />
    </a>
  );
}

export function AnomalyNode({ data }: NodeProps) {
  const anchors = (data.anchors as number) ?? 5;
  const wrapRef = useRef<HTMLDivElement>(null);
  const tick = useRef(0);
  const updateInternals = useUpdateNodeInternals();
  // Click (pointer travels < 6px) opens the Code Mentor; a longer drag is
  // the usual rotation and must never navigate.
  const press = useRef<{ x: number; y: number } | null>(null);

  // Hot path at ~30/s: move the anchor DOM directly (no React state), and
  // only ask React Flow to re-measure the handles every few frames.
  const onAnchors = useCallback(
    (pts: { x: number; y: number; front: boolean }[]) => {
      const els = wrapRef.current?.querySelectorAll<HTMLElement>(".rf-anchor");
      if (!els) return;
      pts.forEach((p, i) => {
        const el = els[i];
        if (!el) return;
        el.style.left = `${p.x}px`;
        el.style.top = `${p.y}px`;
        el.style.opacity = p.front ? "1" : "0.25";
      });
      if (tick.current++ % 4 === 0) updateInternals("anomaly");
    },
    [updateInternals],
  );

  return (
    <div className="core core-bare" ref={wrapRef}>
      <div
        className="core-hub nowheel nodrag nopan"
        title="Open Code Mentor"
        onPointerDown={(e) => { press.current = { x: e.clientX, y: e.clientY }; }}
        onPointerLeave={() => { press.current = null; }}
        onPointerCancel={() => { press.current = null; }}
        onPointerUp={(e) => {
          const p = press.current;
          press.current = null;
          if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 6) window.location.hash = "#/drill/mentor";
        }}
      >
        <AnomalyHub nodes={(data.chips as HubNode[]) ?? EMPTY_CHIPS} hint="" anchorCount={anchors} onAnchors={onAnchors} />
      </div>
      {Array.from({ length: anchors }, (_, i) => i).map((i) => (
        <Handle
          key={i}
          type="source"
          id={`a${i}`}
          position={Position.Right}
          isConnectable={false}
          className="rf-anchor"
        />
      ))}
    </div>
  );
}
