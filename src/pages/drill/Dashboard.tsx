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
    {
      id: "drill",
      type: "drill",
      position: { x: 40, y: 250 },
      dragHandle: ".nd-hd",
      data: { drill: latest, count: drills.length },
    },
    {
      id: "word",
      type: "word",
      position: { x: 360, y: 40 },
      dragHandle: ".nd-hd",
      data: { drill: latest },
    },
    {
      id: "bank",
      type: "bank",
      position: { x: 360, y: 300 },
      dragHandle: ".nd-hd",
      data: { drills },
    },
    {
      id: "stats",
      type: "stats",
      position: { x: 740, y: 80 },
      dragHandle: ".nd-hd",
      data: { stats },
    },
    {
      id: "arts",
      type: "arts",
      position: { x: 740, y: 420 },
      dragHandle: ".nd-hd",
      data: { artifacts, tier, onChange: setAllArtifacts },
    },
    {
      id: "anomaly",
      type: "anomaly",
      position: { x: 1120, y: 170 },
      dragHandle: ".nd-hd",
      data: { pct },
    },
  ]);

  // Positions live in React Flow's state; data has to follow ours.
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        switch (n.id) {
          case "drill":
            return { ...n, data: { drill: latest, count: drills.length } };
          case "word":
            return { ...n, data: { drill: latest } };
          case "bank":
            return { ...n, data: { drills } };
          case "stats":
            return { ...n, data: { stats } };
          case "arts":
            return { ...n, data: { artifacts, tier, onChange: setAllArtifacts } };
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
      { id: "e-dw", source: "drill", sourceHandle: "word", target: "word", type: "flow", style: EDGE_STYLE, data: { dur: "3.4s" } },
      { id: "e-db", source: "drill", sourceHandle: "bank", target: "bank", type: "flow", style: EDGE_STYLE, data: { dur: "2.8s", begin: "0.6s" } },
      { id: "e-ws", source: "word", target: "stats", type: "flow", style: EDGE_STYLE, data: { dur: "3.1s", begin: "1.1s" } },
      { id: "e-bs", source: "bank", target: "stats", type: "flow", style: EDGE_STYLE, data: { dur: "3.6s", begin: "0.3s" } },
      { id: "e-sa", source: "stats", target: "anomaly", targetHandle: "stats", type: "flow", style: EDGE_STYLE, data: { dur: "2.6s", begin: "0.9s" } },
      { id: "e-aa", source: "arts", target: "anomaly", targetHandle: "arts", type: "flow", style: EDGE_STYLE, data: { dur: "4s", begin: "1.4s" } },
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

      {tier === "full" && latest?.askSenior && (
        <div className="flow-prompt">
          <p className="flow-prompt-k">ask trevor tomorrow</p>
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

/** Ambient collaborator cursors, PicGen style. Trevor only exists on the
 *  personal tier — his name is personal data. Frozen under reduced motion. */
function AmbientCursors({ tier }: { tier: Tier }) {
  const cursors = useMemo(
    () =>
      tier === "full"
        ? [
            { name: "Trevor", color: "#d8a94a", x: 24, y: 62 },
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
