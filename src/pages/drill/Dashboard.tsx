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
    { id: "anomaly", type: "anomaly", position: { x: 560, y: 160 }, dragHandle: ".nd-hd", data: { pct } },
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
            return { ...n, data: { pct } };
          default:
            return n;
        }
      }),
    );
  }, [drills, latest, stats, artifacts, tier, pct, setNodes]);

  const edges = useMemo<Edge[]>(
    () => [
      { id: "c-drill", source: "anomaly", sourceHandle: "w1", target: "drill", type: "flow", style: EDGE_STYLE, data: { dur: "3.2s" } },
      { id: "c-word", source: "anomaly", sourceHandle: "w2", target: "word", type: "flow", style: EDGE_STYLE, data: { dur: "2.7s", begin: "0.5s" } },
      { id: "c-stats", source: "anomaly", sourceHandle: "e1", target: "stats", type: "flow", style: EDGE_STYLE, data: { dur: "3.5s", begin: "1s" } },
      { id: "c-bank", source: "anomaly", sourceHandle: "e2", target: "bank", type: "flow", style: EDGE_STYLE, data: { dur: "2.9s", begin: "0.3s" } },
      { id: "c-arts", source: "anomaly", sourceHandle: "s1", target: "arts", type: "flow", style: EDGE_STYLE, data: { dur: "3.8s", begin: "1.3s" } },
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

      <AmbientCursors tier={tier} />

      <FloatPanel drills={drills} />

      {tier === "full" && latest?.askSenior && (
        <div className="flow-prompt">
          <p className="flow-prompt-k">system manager · ask tomorrow</p>
          <p className="flow-prompt-v">{latest.askSenior}</p>
        </div>
      )}

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
function AmbientCursors({ tier }: { tier: Tier }) {
  const cursors = useMemo(
    () =>
      tier === "full"
        ? [
            { name: "SYS MANAGER", color: "#d8a94a", x: 24, y: 62 },
            { name: "Claude", color: "#35e6ff", x: 68, y: 30 },
          ]
        : [{ name: "Claude", color: "#35e6ff", x: 62, y: 34 }],
    [tier],
  );
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const iv = setInterval(() => setTick((t) => t + 1), 2200);
    return () => clearInterval(iv);
  }, []);

  return (
    <>
      {cursors.map((c, i) => {
        const dx = Math.sin(tick * 1.3 + i * 2.1) * 26;
        const dy = Math.cos(tick * 0.9 + i * 1.7) * 18;
        return (
          <div
            key={c.name}
            className="flow-cursor"
            style={{ left: `${c.x}%`, top: `${c.y}%`, transform: `translate(${dx}px, ${dy}px)` }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M5 3l14 6.5-6 1.8-2.2 5.9L5 3z" fill={c.color} stroke="#05060a" strokeWidth="1" />
            </svg>
            <span style={{ background: c.color }}>{c.name}</span>
          </div>
        );
      })}
    </>
  );
}
