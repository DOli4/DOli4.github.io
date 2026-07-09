import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Generic full-bleed fragment-shader canvas. Handles renderer/scene/camera
 * setup, resize, pointer tracking, a live --accent uniform, the animation
 * loop, and teardown — so individual effects only supply a fragment shader.
 *
 * Uniforms available to every shader:
 *   uniform vec2  iResolution;  // px
 *   uniform float iTime;        // seconds
 *   uniform vec2  iMouse;       // px, origin bottom-left, relative to canvas
 *   uniform vec3  uAccent;      // brand accent, 0..1 rgb (tracks playground)
 *
 * Mount inside a `position: relative` parent. Silently renders nothing if
 * WebGL is unavailable.
 */
function readAccentRGB(): [number, number, number] {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim();
  const parts = raw.split(/\s+/).map(Number);
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return [parts[0] / 255, parts[1] / 255, parts[2] / 255];
  }
  return [1, 0.18, 0.26];
}

const VERTEX = `void main() { gl_Position = vec4(position, 1.0); }`;

export default function ShaderCanvas({
  fragmentShader,
  className,
}: {
  fragmentShader: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const clock = new THREE.Clock();

    const accent = readAccentRGB();
    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2() },
      iMouse: { value: new THREE.Vector2() },
      uAccent: { value: new THREE.Vector3(accent[0], accent[1], accent[2]) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader,
      uniforms,
    });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      uniforms.iResolution.value.set(w, h);
      if (uniforms.iMouse.value.lengthSq() === 0) uniforms.iMouse.value.set(w / 2, h / 2);
    };
    window.addEventListener("resize", onResize);
    onResize();

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      uniforms.iMouse.value.set(e.clientX - rect.left, rect.height - (e.clientY - rect.top));
    };
    container.addEventListener("pointermove", onPointerMove);

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
      renderer.domElement.parentNode?.removeChild(renderer.domElement);
      material.dispose();
      geometry.dispose();
      renderer.dispose();
    };
  }, [fragmentShader]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={className ?? "absolute inset-0 h-full w-full"}
      style={{ pointerEvents: "none" }}
    />
  );
}
