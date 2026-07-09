import { useRef, type ComponentRef } from "react";
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import { Environment, Lightformer, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

// drei doesn't export DistortMaterialImpl's type by name; derive the ref
// type from the component itself instead.
type DistortMaterialRef = ComponentRef<typeof MeshDistortMaterial>;

/**
 * Chrome sphere + slowly rotating wireframe globe, with a group-level
 * parallax that leans toward the pointer. Pointer position is tracked via
 * R3F's `state.pointer` (normalized -1..1) inside useFrame rather than a
 * window listener, so it stays scoped to the canvas and needs no cleanup.
 */
function ChromeGroup(props: ThreeElements["group"]) {
  const groupRef = useRef<THREE.Group>(null);
  const wireframeRef = useRef<THREE.Mesh>(null);
  const distortRef = useRef<DistortMaterialRef>(null);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (group) {
      const targetRotationY = state.pointer.x * 0.4;
      const targetRotationX = -state.pointer.y * 0.3;
      group.rotation.y += (targetRotationY - group.rotation.y) * 0.05;
      group.rotation.x += (targetRotationX - group.rotation.x) * 0.05;

      const targetPositionX = state.pointer.x * 0.3;
      const targetPositionY = state.pointer.y * 0.2;
      group.position.x += (targetPositionX - group.position.x) * 0.05;
      group.position.y += (targetPositionY - group.position.y) * 0.05;
    }

    if (wireframeRef.current) {
      wireframeRef.current.rotation.y += delta * 0.15;
      wireframeRef.current.rotation.x += delta * 0.04;
    }

    if (distortRef.current) {
      distortRef.current.distort = 0.35 + Math.sin(state.clock.elapsedTime * 0.6) * 0.08;
    }
  });

  return (
    <group ref={groupRef} {...props}>
      {/* Liquid-chrome core sphere */}
      <mesh>
        <sphereGeometry args={[1.4, 128, 128]} />
        <MeshDistortMaterial
          ref={distortRef}
          color="#ff2d42"
          roughness={0.18}
          metalness={0.95}
          envMapIntensity={2}
          distort={0.35}
          speed={1.6}
        />
      </mesh>

      {/* Slightly larger wireframe globe, rotating independently */}
      <mesh ref={wireframeRef}>
        <sphereGeometry args={[1.85, 24, 16]} />
        <meshBasicMaterial color="#ff2d42" wireframe transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

/**
 * Full-bleed WebGL scene: lit chrome sphere wrapped in a wireframe globe,
 * with subtle mouse-parallax on the whole group. Default-exported for
 * React.lazy(). No fallback rendering here — the caller (Hero) decides
 * whether to mount this at all based on prefers-reduced-motion / viewport.
 */
function ChromeScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[-5, -3, -5]} intensity={40} color="#ff2d42" />

      {/*
       * Local, self-contained reflection environment: Lightformers are
       * baked into a small cubemap purely from in-scene geometry (no HDR
       * fetch), giving the metal material real reflections instead of a
       * near-black sphere. This is what makes the chrome actually read
       * as chrome.
       */}
      <Environment resolution={256}>
        <Lightformer
          form="ring"
          intensity={3}
          color="#ffffff"
          position={[3, 5, 6]}
          scale={7}
        />
        <Lightformer
          form="circle"
          intensity={5}
          color="#ff2d42"
          position={[-6, -2, -3]}
          scale={10}
        />
        <Lightformer
          form="circle"
          intensity={1.2}
          color="#ffe8e8"
          position={[0, -6, 4]}
          scale={9}
        />
        <Lightformer
          form="circle"
          intensity={0.8}
          color="#ffffff"
          position={[0, 0, -8]}
          scale={14}
        />
      </Environment>

      <ChromeGroup />
    </Canvas>
  );
}

export default ChromeScene;
