import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

/**
 * A bezier edge with a small glowing dot travelling source -> target,
 * reading as data flowing between the nodes. SMIL animateMotion follows
 * the exact same path the edge is drawn with, so the dot tracks live while
 * nodes are dragged. Hidden under prefers-reduced-motion (CSS).
 */
export default function DotEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  data,
}: EdgeProps) {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const dur = (data?.dur as string) ?? "3.2s";
  const begin = (data?.begin as string) ?? "0s";

  return (
    <>
      <BaseEdge id={id} path={path} style={style} />
      <circle className="edge-dot" r="2.6">
        <animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={path} />
      </circle>
      <circle className="edge-dot edge-dot-halo" r="5.5">
        <animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={path} />
      </circle>
    </>
  );
}
