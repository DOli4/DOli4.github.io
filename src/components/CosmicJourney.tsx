import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import ThermodynamicGrid from "@/components/ui/interactive-thermodynamic-grid";
import "./cosmic-journey.css";

// Sky colour stops the descent passes through, space → warm afternoon.
const SKY_STOPS: [number, THREE.Color][] = [
  [0.0, new THREE.Color(0x03040f)], // deep space
  [0.4, new THREE.Color(0x0a1636)], // starry night
  [0.7, new THREE.Color(0x3a2f66)], // indigo dusk
  [0.9, new THREE.Color(0x7a4a72)], // dusky mauve
  [1.0, new THREE.Color(0xb0686a)], // warm horizon rose
];

function skyColorAt(p: number, out: THREE.Color) {
  for (let i = 0; i < SKY_STOPS.length - 1; i++) {
    const [pa, ca] = SKY_STOPS[i];
    const [pb, cb] = SKY_STOPS[i + 1];
    if (p <= pb) {
      const t = (p - pa) / (pb - pa);
      out.copy(ca).lerp(cb, Math.max(0, Math.min(1, t)));
      return;
    }
  }
  out.copy(SKY_STOPS[SKY_STOPS.length - 1][1]);
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default function CosmicJourney() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const refs = useRef<any>({ stars: [], mountains: [], progress: 0 });
  const [section, setSection] = useState(0);

  // ---- Three.js setup ----
  useEffect(() => {
    const r = refs.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03040f);
    scene.fog = new THREE.FogExp2(0x03040f, 0.00035);
    r.scene = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      3000,
    );
    camera.position.set(0, 20, 120);
    r.camera = camera;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.6;
    r.renderer = renderer;

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.9,
      0.5,
      0.85,
    );
    composer.addPass(bloom);
    r.composer = composer;
    r.bloom = bloom;

    // --- Star field (three parallax shells) ---
    const starCount = 4000;
    for (let s = 0; s < 3; s++) {
      const g = new THREE.BufferGeometry();
      const pos = new Float32Array(starCount * 3);
      const col = new Float32Array(starCount * 3);
      const siz = new Float32Array(starCount);
      for (let j = 0; j < starCount; j++) {
        const radius = 200 + Math.random() * 800;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        pos[j * 3] = radius * Math.sin(phi) * Math.cos(theta);
        pos[j * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        pos[j * 3 + 2] = radius * Math.cos(phi);
        const c = new THREE.Color();
        const pick = Math.random();
        if (pick < 0.7) c.setHSL(0, 0, 0.8 + Math.random() * 0.2);
        else if (pick < 0.9) c.setHSL(0.08, 0.5, 0.8);
        else c.setHSL(0.6, 0.5, 0.8);
        col[j * 3] = c.r;
        col[j * 3 + 1] = c.g;
        col[j * 3 + 2] = c.b;
        siz[j] = Math.random() * 2 + 0.5;
      }
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      g.setAttribute("size", new THREE.BufferAttribute(siz, 1));
      const m = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 }, depth: { value: s }, daylight: { value: 0 } },
        vertexShader: `
          attribute float size; attribute vec3 color;
          varying vec3 vColor; uniform float time; uniform float depth;
          void main() {
            vColor = color; vec3 p = position;
            float a = time * 0.05 * (1.0 - depth * 0.3);
            mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
            p.xy = rot * p.xy;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = size * (300.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          varying vec3 vColor; uniform float daylight;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float o = 1.0 - smoothstep(0.0, 0.5, d);
            gl_FragColor = vec4(vColor, o * (1.0 - daylight));
          }`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const points = new THREE.Points(g, m);
      scene.add(points);
      r.stars.push(points);
    }

    // --- Nebula ---
    const nebGeo = new THREE.PlaneGeometry(8000, 4000, 60, 60);
    const nebMat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(0x0033ff) },
        color2: { value: new THREE.Color(0xff5588) },
        opacity: { value: 0.28 },
        daylight: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv; varying float vE; uniform float time;
        void main() {
          vUv = uv; vec3 p = position;
          float e = sin(p.x*0.01+time)*cos(p.y*0.01+time)*20.0;
          p.z += e; vE = e;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
        }`,
      fragmentShader: `
        uniform vec3 color1; uniform vec3 color2; uniform float opacity; uniform float time; uniform float daylight;
        varying vec2 vUv; varying float vE;
        void main() {
          float m = sin(vUv.x*10.0+time)*cos(vUv.y*10.0+time);
          vec3 c = mix(color1, color2, m*0.5+0.5);
          float a = opacity * (1.0 - length(vUv-0.5)*2.0);
          a *= 1.0 + vE*0.01;
          gl_FragColor = vec4(c, a * (1.0 - daylight));
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const nebula = new THREE.Mesh(nebGeo, nebMat);
    nebula.position.z = -1050;
    scene.add(nebula);
    r.nebula = nebula;

    // --- Mountain silhouettes (the horizon we descend toward) ---
    const layers = [
      { d: -60, h: 60, c: 0x1a1a2e, o: 1 },
      { d: -120, h: 80, c: 0x24243e, o: 0.85 },
      { d: -180, h: 100, c: 0x2f3560, o: 0.6 },
      { d: -240, h: 120, c: 0x3a4668, o: 0.4 },
    ];
    layers.forEach((layer, index) => {
      const points: THREE.Vector2[] = [];
      const seg = 60;
      for (let i = 0; i <= seg; i++) {
        const x = (i / seg - 0.5) * 1200;
        const y =
          Math.sin(i * 0.1) * layer.h +
          Math.sin(i * 0.05) * layer.h * 0.5 +
          Math.random() * layer.h * 0.2 -
          120;
        points.push(new THREE.Vector2(x, y));
      }
      points.push(new THREE.Vector2(6000, -400));
      points.push(new THREE.Vector2(-6000, -400));
      const shape = new THREE.Shape(points);
      const geo = new THREE.ShapeGeometry(shape);
      const mat = new THREE.MeshBasicMaterial({
        color: layer.c,
        transparent: true,
        opacity: layer.o,
        side: THREE.DoubleSide,
      });
      const mtn = new THREE.Mesh(geo, mat);
      mtn.position.z = layer.d;
      mtn.position.y = layer.d;
      mtn.userData = { baseZ: layer.d, index };
      scene.add(mtn);
      r.mountains.push(mtn);
    });

    const bg = new THREE.Color();
    const clock = new THREE.Clock();

    const animate = () => {
      r.animationId = requestAnimationFrame(animate);

      // Skip the expensive WebGL + bloom pass once the cosmos is scrolled away.
      if (r.inView === false) return;

      const time = clock.getElapsedTime();
      const p = r.progress as number;

      // Warm the sky and fade the stars/nebula toward daylight.
      skyColorAt(p, bg);
      (scene.background as THREE.Color).copy(bg);
      (scene.fog as THREE.FogExp2).color.copy(bg);
      const daylight = smoothstep(0.62, 1.0, p);

      r.stars.forEach((sf: any) => {
        sf.material.uniforms.time.value = time;
        sf.material.uniforms.daylight.value = daylight;
      });
      nebMat.uniforms.time.value = time * 0.5;
      nebMat.uniforms.daylight.value = daylight;
      bloom.strength = 0.9 * (1 - daylight * 0.7);

      // Fall through space toward the horizon.
      const camZ = 120 - p * 360;
      const camY = 20 + p * 26;
      camera.position.x = Math.sin(time * 0.1) * 2;
      camera.position.y += (camY + Math.cos(time * 0.15) - camera.position.y) * 0.05;
      camera.position.z += (camZ - camera.position.z) * 0.05;
      camera.lookAt(0, 10, -600);

      r.mountains.forEach((m: any, i: number) => {
        const parallax = 1 + i * 0.5;
        m.position.x = Math.sin(time * 0.1) * 2 * parallax;
      });

      composer.render();
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(r.animationId);
      window.removeEventListener("resize", onResize);
      r.stars.forEach((s: any) => {
        s.geometry.dispose();
        s.material.dispose();
      });
      r.mountains.forEach((m: any) => {
        m.geometry.dispose();
        m.material.dispose();
      });
      nebGeo.dispose();
      nebMat.dispose();
      renderer.dispose();
    };
  }, []);

  // ---- Scroll → progress over this component's own tall region ----
  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const p = total > 0 ? scrolled / total : 0;
      refs.current.progress = p;
      // The fixed canvas only matters while the cosmic region is on screen.
      refs.current.inView = rect.bottom > 0 && rect.top < window.innerHeight;
      setSection(Math.min(2, Math.floor(p * 3)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const captions = [
    { title: "SPACE", line: "Somewhere out past the last of the light." },
    { title: "NIGHT", line: "The stars thin; a blue world turns beneath you." },
    { title: "DESCENT", line: "Down through the dusk, toward a quiet hill." },
  ];

  return (
    <div ref={containerRef} className="cosmic">
      <canvas ref={canvasRef} className="cosmic-canvas" />

      {/* Interactive starlight cursor-trail — the thermodynamic grid, recoloured
          and running in transparent overlay mode over the space scene. */}
      <div className="cosmic-trail" aria-hidden="true">
        <ThermodynamicGrid overlay palette="starlight" resolution={18} coolingFactor={0.94} />
      </div>

      <div className="cosmic-overlay">
        {captions.map((c, i) => (
          <div key={c.title} className={`cosmic-caption ${section === i ? "is-active" : ""}`}>
            <h2 className="cosmic-title">{c.title}</h2>
            <p className="cosmic-line">{c.line}</p>
          </div>
        ))}
        <div className="cosmic-scrollcue" aria-hidden="true">
          <span>scroll to fall</span>
          <div className="cosmic-scrollcue-track">
            <div className="cosmic-scrollcue-fill" style={{ height: `${section * 33 + 20}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
