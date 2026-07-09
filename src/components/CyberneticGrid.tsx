import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Interactive cybernetic-grid WebGL background (adapted from a 21st.dev
 * community shader by larsen66). Changes vs. the original:
 * - Scoped to its parent (absolute-fill) instead of a fixed 100vw/100vh
 *   layer, so it can back a single section rather than the whole page.
 * - Recolored to the site's red brand (reads --accent live).
 * - Typed for TypeScript; pointer tracked relative to the container.
 *
 * Mount it inside a `position: relative` parent. It renders nothing itself
 * when WebGL is unavailable (fails silently, parent shows its own bg).
 */
function readAccentRGB(): [number, number, number] {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim(); // e.g. "255 45 66"
  const parts = raw.split(/\s+/).map(Number);
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return [parts[0] / 255, parts[1] / 255, parts[2] / 255];
  }
  return [1.0, 0.18, 0.26];
}

export default function CyberneticGrid() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // no WebGL — leave the parent's own background visible
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const clock = new THREE.Clock();

    const vertexShader = `
      void main() { gl_Position = vec4(position, 1.0); }
    `;

    const fragmentShader = `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;
      uniform vec3 uAccent;

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      void main() {
        vec2 uv    = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
        vec2 mouse = (iMouse - 0.5 * iResolution.xy) / iResolution.y;

        float t         = iTime * 0.2;
        float mouseDist = length(uv - mouse);

        float warp = sin(mouseDist * 20.0 - t * 4.0) * 0.1;
        warp *= smoothstep(0.4, 0.0, mouseDist);
        uv += warp;

        vec2 gridUv = abs(fract(uv * 10.0) - 0.5);
        float line  = pow(1.0 - min(gridUv.x, gridUv.y), 50.0);

        vec3 color = uAccent * line * (0.5 + sin(t * 2.0) * 0.2);

        float energy = sin(uv.x * 20.0 + t * 5.0) * sin(uv.y * 20.0 + t * 3.0);
        energy = smoothstep(0.8, 1.0, energy);
        // brighter accent tint on the energy pulses
        color += mix(uAccent, vec3(1.0, 0.85, 0.9), 0.5) * energy * line;

        float glow = smoothstep(0.1, 0.0, mouseDist);
        color += uAccent * glow * 0.6;

        color += random(uv + t * 0.1) * 0.04;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const accent = readAccentRGB();
    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2() },
      iMouse: { value: new THREE.Vector2() },
      uAccent: { value: new THREE.Vector3(accent[0], accent[1], accent[2]) },
    };

    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      uniforms.iResolution.value.set(w, h);
      uniforms.iMouse.value.set(w / 2, h / 2);
    };
    window.addEventListener("resize", onResize);
    onResize();

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      uniforms.iMouse.value.set(e.clientX - rect.left, rect.height - (e.clientY - rect.top));
    };
    container.addEventListener("pointermove", onPointerMove);

    // Keep the accent live if the visitor recolors the site via the playground.
    const accentObserver = new MutationObserver(() => {
      const [r, g, b] = readAccentRGB();
      uniforms.uAccent.value.set(r, g, b);
    });
    accentObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });

    renderer.setAnimationLoop(() => {
      uniforms.iTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener("resize", onResize);
      container.removeEventListener("pointermove", onPointerMove);
      accentObserver.disconnect();
      renderer.setAnimationLoop(null);
      const canvas = renderer.domElement;
      canvas.parentNode?.removeChild(canvas);
      material.dispose();
      geometry.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      style={{ pointerEvents: "none" }}
    />
  );
}
