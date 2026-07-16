import { useEffect, useRef } from "react";
import * as THREE from "three";

export type HubNode = {
  id: string;
  label: string;
  href: string;
  /** open in a new tab (external artifact links) */
  external?: boolean;
};

/**
 * The dashboard centerpiece: the CV's anomalous-matter wireframe, but
 * interactive. It does NOT auto-rotate — you drag it. The cobe globe's
 * satellites become link nodes: anchor points ride on the object's rotation
 * in 3D and are projected to screen each frame, so the chips orbit with your
 * drag and fade when they swing behind the mass.
 */
export default function AnomalyHub({
  nodes,
  hint = "drag the anomaly · press a node",
}: {
  nodes: HubNode[];
  hint?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chipRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    // Far enough back that the node ring (R=2.05) plus chip text projects
    // INSIDE the square canvas — closer and the chips overflow the page edge.
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 5.6;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    // Displaced icosahedron, same species as the CV hero but static: the
    // noise bakes once into the vertices instead of animating in a shader.
    const geo = new THREE.IcosahedronGeometry(1.28, 3);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n =
        Math.sin(v.x * 2.3 + v.y * 1.7) * 0.5 +
        Math.sin(v.y * 3.1 - v.z * 2.2) * 0.3 +
        Math.sin(v.z * 2.7 + v.x * 1.3) * 0.2;
      v.multiplyScalar(1 + n * 0.16);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();

    const group = new THREE.Group();
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.5 }),
    );
    const fill = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ color: 0x05060a, transparent: true, opacity: 0.85 }),
    );
    group.add(fill, wire);
    scene.add(group);
    group.rotation.set(0.35, -0.6, 0);

    // Node anchors on a golden-angle spiral around the mass, so any count
    // spreads evenly instead of clumping.
    const R = 2.05;
    const anchors = nodes.map((_, i) => {
      const t = nodes.length === 1 ? 0.5 : i / (nodes.length - 1);
      const phi = Math.acos(1 - 2 * (0.18 + 0.64 * t));
      const theta = i * 2.399963;
      return new THREE.Vector3(
        R * Math.sin(phi) * Math.cos(theta),
        R * Math.cos(phi),
        R * Math.sin(phi) * Math.sin(theta),
      );
    });

    // Drag to rotate — deliberately no idle spin. He rotates it.
    let dragging = false;
    let px = 0;
    let py = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      px = e.clientX;
      py = e.clientY;
      wrap.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      group.rotation.y += (e.clientX - px) * 0.006;
      group.rotation.x = Math.max(-1.2, Math.min(1.2, group.rotation.x + (e.clientY - py) * 0.006));
      px = e.clientX;
      py = e.clientY;
    };
    const onUp = () => {
      dragging = false;
      wrap.style.cursor = "grab";
    };
    wrap.addEventListener("pointerdown", onDown);
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerup", onUp, { passive: true });

    const size = () => {
      const w = wrap.clientWidth;
      renderer.setSize(w, w);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(wrap);

    const world = new THREE.Vector3();
    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 0.008;
      // A faint breath, not a rotation. Killed entirely under reduced motion.
      if (!reduced) {
        const s = 1 + Math.sin(t) * 0.012;
        group.scale.setScalar(s);
      }
      renderer.render(scene, camera);

      const w = wrap.clientWidth;
      group.updateMatrixWorld();
      anchors.forEach((a, i) => {
        const chip = chipRefs.current[i];
        if (!chip) return;
        world.copy(a).applyMatrix4(group.matrixWorld);
        const front = world.z > -0.4;
        world.project(camera);
        chip.style.left = `${(world.x * 0.5 + 0.5) * w}px`;
        chip.style.top = `${(-world.y * 0.5 + 0.5) * w}px`;
        chip.style.opacity = front ? "1" : "0.18";
        chip.style.pointerEvents = front ? "auto" : "none";
        chip.style.zIndex = front ? "3" : "1";
      });
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener("pointerdown", onDown);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerup", onUp);
      geo.dispose();
      wire.geometry.dispose();
      (wire.material as THREE.Material).dispose();
      (fill.material as THREE.Material).dispose();
      renderer.dispose();
    };
  }, [nodes]);

  return (
    <div className="hub" ref={wrapRef} aria-label="Drill navigation — drag to rotate">
      <div className="hub-glow" aria-hidden />
      <canvas ref={canvasRef} className="hub-canvas" />
      {nodes.map((n, i) => (
        <a
          key={n.id}
          ref={(el) => (chipRefs.current[i] = el)}
          className="hub-node"
          href={n.href}
          {...(n.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          data-hover
        >
          <span className="hub-node-dot" aria-hidden />
          {n.label}
        </a>
      ))}
      <p className="hub-hint">{hint}</p>
    </div>
  );
}
