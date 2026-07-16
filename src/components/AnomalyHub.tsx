import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

export type HubNode = {
  id: string;
  label: string;
  href: string;
  external?: boolean;
};

/**
 * The dashboard's living centerpiece — the same species as the CV hero:
 * an icosahedron displaced by animated 3D noise, drawn as an additive
 * glowing wireframe with bloom. It idly turns and breathes like the CV
 * one; dragging adds your own rotation on top. Optional link chips
 * (HubNode[]) orbit it, projected from 3D each frame.
 */
export default function AnomalyHub({
  nodes,
  hint = "drag the anomaly",
  anchorCount = 0,
  onAnchors,
}: {
  nodes: HubNode[];
  hint?: string;
  /** number of surface anchor points to project each frame */
  anchorCount?: number;
  /** receives projected {x,y,front} pixel positions - drives the dashboard cables */
  onAnchors?: (pts: { x: number; y: number; front: boolean }[]) => void;
}) {
  const onAnchorsRef = useRef(onAnchors);
  onAnchorsRef.current = onAnchors;
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chipRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 5.6;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.3, 0.5, 0.4);
    composer.addPass(bloom);

    const uniforms = {
      uTime: { value: 0 },
      uAmp: { value: 0.26 },
      uCyan: { value: new THREE.Color(0x35e6ff) },
      uWhite: { value: new THREE.Color(0xdfe8ff) },
    };

    // Classic Ashima 3D simplex noise — same as the CV hero.
    const noiseGLSL = `
      vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
      vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
      vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
      vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
      float snoise(vec3 v){
        const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
        vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
        vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
        vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
        i=mod289(i);
        vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
        float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
        vec4 j=p-49.0*floor(p*ns.z*ns.z);
        vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
        vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
        vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
        vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
        vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
        vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
        vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
        p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
        vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
        return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
      }`;

    const material = new THREE.ShaderMaterial({
      uniforms,
      wireframe: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexShader: `
        uniform float uTime; uniform float uAmp;
        varying float vN;
        ${noiseGLSL}
        void main(){
          vec3 p = position;
          float n = snoise(normalize(position) * 1.7 + uTime * 0.25);
          n += 0.5 * snoise(normalize(position) * 3.4 + uTime * 0.4);
          vN = n;
          p += normal * n * uAmp;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 uCyan; uniform vec3 uWhite;
        varying float vN;
        void main(){
          float e = smoothstep(-0.6, 0.9, vN);
          vec3 col = mix(uCyan * 0.4, mix(uWhite, uCyan, 0.55), e);
          gl_FragColor = vec4(col * 0.55, 0.3 + 0.4 * e);
        }`,
    });

    const group = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 6), material);
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.9, 3),
      new THREE.MeshBasicMaterial({ color: 0x0a1a24, transparent: true, opacity: 0.5 }),
    );
    group.add(mesh, core);
    scene.add(group);

    // Surface anchors that ride the rotation - the dashboard's cables attach here.
    const AR = 1.72;
    const surface = Array.from({ length: anchorCount }, (_, i) => {
      const t = anchorCount === 1 ? 0.5 : i / Math.max(1, anchorCount - 1);
      const phi = Math.acos(1 - 2 * (0.2 + 0.6 * t));
      const theta = i * 2.399963;
      return new THREE.Vector3(
        AR * Math.sin(phi) * Math.cos(theta),
        AR * Math.cos(phi),
        AR * Math.sin(phi) * Math.sin(theta),
      );
    });
    let frame = 0;

    // Anchors for the optional orbiting link chips.
    const R = 2.15;
    const anchors = nodes.map((_, i) => {
      const t = nodes.length === 1 ? 0.5 : i / Math.max(1, nodes.length - 1);
      const phi = Math.acos(1 - 2 * (0.18 + 0.64 * t));
      const theta = i * 2.399963;
      return new THREE.Vector3(
        R * Math.sin(phi) * Math.cos(theta),
        R * Math.cos(phi),
        R * Math.sin(phi) * Math.sin(theta),
      );
    });

    // Drag adds rotation on top of the idle drift.
    let dragging = false;
    let px = 0, py = 0, userY = 0, userX = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true; px = e.clientX; py = e.clientY;
      wrap.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      userY += (e.clientX - px) * 0.006;
      userX = Math.max(-1.2, Math.min(1.2, userX + (e.clientY - py) * 0.006));
      px = e.clientX; py = e.clientY;
    };
    const onUp = () => { dragging = false; wrap.style.cursor = "grab"; };
    wrap.addEventListener("pointerdown", onDown);
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerup", onUp, { passive: true });

    const size = () => {
      const w = wrap.clientWidth;
      renderer.setSize(w, w);
      composer.setSize(w, w);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(wrap);

    const clock = new THREE.Clock();
    const world = new THREE.Vector3();
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      // Reduced motion: noise and spin freeze, drag still works, glow stays.
      uniforms.uTime.value = reduced ? 0 : t;
      const idleY = reduced ? 0 : t * 0.1;
      const idleX = reduced ? 0 : Math.sin(t * 0.4) * 0.08;
      group.rotation.y = idleY + userY;
      group.rotation.x = 0.3 + idleX + userX;
      if (!reduced) group.scale.setScalar(1 + Math.sin(t * 0.8) * 0.015);
      composer.render();

      const w = wrap.clientWidth;
      group.updateMatrixWorld();

      // Report the rotating surface anchors every other frame.
      if (onAnchorsRef.current && surface.length && frame++ % 2 === 0) {
        onAnchorsRef.current(
          surface.map((a) => {
            world.copy(a).applyMatrix4(group.matrixWorld);
            const front = world.z > -0.2;
            world.project(camera);
            return { x: (world.x * 0.5 + 0.5) * w, y: (-world.y * 0.5 + 0.5) * w, front };
          }),
        );
      }

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
      });
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener("pointerdown", onDown);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerup", onUp);
      mesh.geometry.dispose();
      core.geometry.dispose();
      material.dispose();
      (core.material as THREE.Material).dispose();
      composer.dispose();
      renderer.dispose();
    };
  }, [nodes, anchorCount]);

  return (
    <div className="hub" ref={wrapRef} aria-label="The anomaly — drag to rotate">
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
