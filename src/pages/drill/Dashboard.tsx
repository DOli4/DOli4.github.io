import { useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  useNodesState,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Drill, Tier } from "../../lib/drill-crypto";
import {
  loadArtifacts,
  visibleArtifacts,
  type Artifact,
} from "../../lib/artifacts";
import DotEdge from "./canvas/DotEdge";
import FloatPanel from "./canvas/FloatPanel";
import {
  AnomalyNode,
  ChipNode,
  ArtifactsNode,
  BankNode,
  DrillNode,
  StatsNode,
  WordNode,
} from "./canvas/DashNodes";

const SAID_KEY = "drill-said";

function loadSaid(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(SAID_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/** Defined at module scope — React Flow warns (and re-renders) if these are
 *  recreated on every render. */
const nodeTypes = {
  drill: DrillNode,
  word: WordNode,
  bank: BankNode,
  stats: StatsNode,
  arts: ArtifactsNode,
  anomaly: AnomalyNode,
  chip: ChipNode,
};
const edgeTypes = { flow: DotEdge };

const EDGE_STYLE = { stroke: "rgba(150, 190, 220, 0.35)", strokeWidth: 1.4 };

/**
 * The dashboard as a node-based workflow canvas (PicGen / ComfyUI style):
 * the latest drill feeds the word and the question bank, the bank feeds
 * progress, and everything converges on the anomaly — the "preview" of the
 * training state. Dots travel the edges to read as data flowing through.
 * Pan the void, zoom with the wheel, drag nodes by their headers.
 */
export default function Dashboard({ drills, tier }: { drills: Drill[]; tier: Tier }) {
  const [allArtifacts, setAllArtifacts] = useState<Artifact[]>(loadArtifacts);
  const artifacts = visibleArtifacts(allArtifacts, tier);
  // Shareable (non-personal) artifacts become satellite chips on the canvas.
  const chips = allArtifacts.filter((a) => !a.personal).slice(0, 4);
  const hubChips = useMemo(
    () =>
      chips.map((a) => ({
        id: a.id,
        label: a.title.length > 16 ? `${a.title.slice(0, 15)}…` : a.title,
        href: a.url,
        external: true,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(chips.map((a) => a.id + a.title + a.url))],
  );
  const latest = drills[0];

  const stats = useMemo(() => {
    const said = loadSaid();
    const questions = drills.flatMap((d) => d.questions);
    const terms = new Set<string>();
    drills.forEach((d) => {
      d.questions.forEach((q) => q.mustSay.forEach((w) => terms.add(w.toLowerCase())));
      terms.add(d.word.term.toLowerCase());
    });
    return {
      days: drills.length,
      questions: questions.length,
      terms: terms.size,
      saidCount: Object.values(said).filter(Boolean).length,
      mustSayTotal: questions.reduce((n, q) => n + q.mustSay.length, 0),
    };
  }, [drills]);
  const pct = stats.mustSayTotal === 0 ? 0 : Math.round((stats.saidCount / stats.mustSayTotal) * 100);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([
    { id: "anomaly", type: "anomaly", position: { x: 560, y: 160 }, draggable: false, data: { anchors: 5, chips: hubChips } },
    { id: "drill", type: "drill", position: { x: 120, y: 60 }, dragHandle: ".nd-hd", data: { drill: latest, count: drills.length, tpos: "right" } },
    { id: "word", type: "word", position: { x: 90, y: 460 }, dragHandle: ".nd-hd", data: { drill: latest, tpos: "right" } },
    { id: "stats", type: "stats", position: { x: 1120, y: 40 }, dragHandle: ".nd-hd", data: { stats, tpos: "left" } },
    { id: "bank", type: "bank", position: { x: 1150, y: 400 }, dragHandle: ".nd-hd", data: { drills, tpos: "left" } },
    { id: "arts", type: "arts", position: { x: 560, y: 760 }, dragHandle: ".nd-hd", data: { artifacts, tier, onChange: setAllArtifacts, tpos: "top" } },
  ]);

  // Positions live in React Flow's state; data has to follow ours.
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        switch (n.id) {
          case "drill":
            return { ...n, data: { ...n.data, drill: latest, count: drills.length } };
          case "word":
            return { ...n, data: { ...n.data, drill: latest } };
          case "bank":
            return { ...n, data: { ...n.data, drills } };
          case "stats":
            return { ...n, data: { ...n.data, stats } };
          case "arts":
            return { ...n, data: { ...n.data, artifacts, tier, onChange: setAllArtifacts } };
          case "anomaly":
            return { ...n, data: { anchors: 5, chips: hubChips } };
          default:
            return n;
        }
      }),
    );
  }, [drills, latest, stats, artifacts, tier, pct, hubChips, setNodes]);

  const edges = useMemo<Edge[]>(
    () => [
      { id: "c-drill", source: "anomaly", sourceHandle: "a0", target: "drill", type: "flow", style: EDGE_STYLE, data: { dur: "3.2s" } },
      { id: "c-word", source: "anomaly", sourceHandle: "a1", target: "word", type: "flow", style: EDGE_STYLE, data: { dur: "2.7s", begin: "0.5s" } },
      { id: "c-stats", source: "anomaly", sourceHandle: "a2", target: "stats", type: "flow", style: EDGE_STYLE, data: { dur: "3.5s", begin: "1s" } },
      { id: "c-bank", source: "anomaly", sourceHandle: "a3", target: "bank", type: "flow", style: EDGE_STYLE, data: { dur: "2.9s", begin: "0.3s" } },
      { id: "c-arts", source: "anomaly", sourceHandle: "a4", target: "arts", type: "flow", style: EDGE_STYLE, data: { dur: "3.8s", begin: "1.3s" } },
    ],
    [],
  );

  return (
    <div className="flow-wrap">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.3}
        maxZoom={1.6}
        nodesConnectable={false}
        deleteKeyCode={null}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.1} color="rgba(255,255,255,0.055)" />
        <Controls position="bottom-left" showInteractive={false} />
      </ReactFlow>

      <AmbientCursors tier={tier} ask={latest?.askSenior} />

      <FloatPanel drills={drills} />

      <div className="flow-stats">
        <div>D: <b>{stats.days}</b></div>
        <div>Q: <b>{stats.questions}</b></div>
        <div>W: <b>{stats.saidCount} ({stats.mustSayTotal})</b></div>
        <div>C: <b>{pct}%</b></div>
      </div>
    </div>
  );
}

/** Ambient collaborator cursors, PicGen style. The System Manager cursor only
 *  exists on the personal tier. Frozen under reduced motion. */
function AmbientCursors({ tier, ask }: { tier: Tier; ask?: string }) {
  const [openPop, setOpenPop] = useState<string | null>(null);
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>(() => {
    try { return JSON.parse(localStorage.getItem("dash-cursors") ?? "{}"); } catch { return {}; }
  });
  const cursors = tier === "full"
    ? [{ name: "SYS MANAGER", color: "#d8a94a", x: 180, y: 520 }, { name: "Claude", color: "#35e6ff", x: 540, y: 200 }]
    : [{ name: "Claude", color: "#35e6ff", x: 500, y: 260 }];

  function drag(e: React.PointerEvent, name: string, def: { x: number; y: number }) {
    const start = pos[name] ?? def;
    const sx = e.clientX, sy = e.clientY;
    let moved = false;
    const onMove = (ev: PointerEvent) => {
      moved = true;
      setPos((p) => {
        const next = { ...p, [name]: { x: start.x + ev.clientX - sx, y: start.y + ev.clientY - sy } };
        localStorage.setItem("dash-cursors", JSON.stringify(next));
        return next;
      });
    };
    const onUp = () => {
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerup", onUp);
      if (!moved) setOpenPop((o) => (o === name ? null : name));
    };
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerup", onUp, { passive: true });
  }

  return (
    <>
      {cursors.map((c) => {
        const p = pos[c.name] ?? { x: c.x, y: c.y };
        const pop = c.name === "SYS MANAGER"
          ? { k: "system manager · ask tomorrow", v: ask ?? "No question today." }
          : { k: "claude · prompting tip", v: "Shape it: ROLE → CONTEXT → TASK → FORMAT. Then iterate — point at the wrong bit instead of rewriting." };
        return (
          <div key={c.name} className="flow-cursor flow-cursor-live" style={{ left: p.x, top: p.y }}
            onPointerDown={(e) => drag(e, c.name, { x: c.x, y: c.y })}>
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M5 3l14 6.5-6 1.8-2.2 5.9L5 3z" fill={c.color} stroke="#05060a" strokeWidth="1" />
            </svg>
            <span style={{ background: c.color }}>{c.name}</span>
            {openPop === c.name && (
              <div className="cursor-pop" onPointerDown={(e) => e.stopPropagation()}>
                <p className="flow-prompt-k">{pop.k}</p>
                <p className="flow-prompt-v">{pop.v}</p>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
