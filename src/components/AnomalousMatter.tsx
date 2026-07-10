import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import "./anomalous-matter.css";

/**
 * The hero object — a high-detail icosahedron displaced by animated 3D noise,
 * drawn as a glowing wireframe in the void. It idly breathes, reacts to the
 * cursor, and turns as you scroll (the scroll-driven "space turn"). A `tron`
 * pulse near the page's Tron section shifts it from white toward neon cyan.
 */
export default function AnomalousMatter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({ scroll: 0, tron: 0, mx: 0, my: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.9, 0.6, 0.2);
    composer.addPass(bloom);

    const uniforms = {
      uTime: { value: 0 },
      uAmp: { value: 0.28 },
      uTron: { value: 0 },
      uCyan: { value: new THREE.Color(0x35e6ff) },
      uWhite: { value: new THREE.Color(0xdfe8ff) },
    };

    // Classic Ashima 3D simplex noise (snoise).
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
        uniform vec3 uCyan; uniform vec3 uWhite; uniform float uTron;
        varying float vN;
        void main(){
          float e = smoothstep(-0.6, 0.9, vN);
          vec3 base = mix(uWhite, uCyan, uTron);
          vec3 col = mix(base * 0.35, base, e);
          gl_FragColor = vec4(col, 0.6 + 0.4 * e);
        }`,
    });

    const geo = new THREE.IcosahedronGeometry(1.5, 14);
    const mesh = new THREE.Mesh(geo, material);
    scene.add(mesh);

    // Faint core glow sphere
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.9, 3),
      new THREE.MeshBasicMaterial({ color: 0x0a1a24, transparent: true, opacity: 0.5 }),
    );
    scene.add(core);

    const clock = new THREE.Clock();
    let raf = 0;
    const s = state.current;
    const render = () => {
      raf = requestAnimationFrame(render);
      const t = clock.getElapsedTime();
      uniforms.uTime.value = t;
      uniforms.uTron.value += (s.tron - uniforms.uTron.value) * 0.05;
      uniforms.uAmp.value = 0.24 + s.scroll * 0.35;

      // Idle spin + scroll turn + cursor parallax.
      mesh.rotation.y = t * 0.12 + s.scroll * Math.PI * 2.2 + s.mx * 0.4;
      mesh.rotation.x = t * 0.05 + s.my * 0.3;
      core.rotation.copy(mesh.rotation);
      const scale = 1 + Math.sin(t * 0.8) * 0.02 - s.scroll * 0.15;
      mesh.scale.setScalar(scale);

      composer.render();
    };
    render();

    const onMove = (e: MouseEvent) => {
      s.mx = (e.clientX / innerWidth) * 2 - 1;
      s.my = (e.clientY / innerHeight) * 2 - 1;
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      s.scroll = max > 0 ? window.scrollY / max : 0;
      // Tron pulse when the [data-tron] section is near the viewport center.
      const tronEl = document.querySelector("[data-tron]");
      if (tronEl) {
        const r = tronEl.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const d = Math.abs(center - innerHeight / 2) / innerHeight;
        s.tron = Math.max(0, 1 - d * 1.4);
      }
    };
    const onResize = () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
      composer.setSize(innerWidth, innerHeight);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    onScroll();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      geo.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="anomaly-canvas" aria-hidden="true" />;
}
