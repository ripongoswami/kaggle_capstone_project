"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, Environment, OrbitControls, Float } from "@react-three/drei";
import { useTheme } from "next-themes";
import * as THREE from "three";

function OrbMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { resolvedTheme } = useTheme();

  // Color selection based on theme
  const isDark = resolvedTheme === "dark";
  const primaryColor = isDark ? "#6366F1" : "#4F46E5"; // Primary
  const accentColor = isDark ? "#22C55E" : "#16A34A";  // Accent

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={2} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1.5, 64, 64]}>
        <MeshDistortMaterial
          color={primaryColor}
          emissive={primaryColor}
          emissiveIntensity={0.2}
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
      {/* Decorative smaller orb */}
      <Sphere args={[0.4, 32, 32]} position={[2, 1, -1]}>
        <MeshDistortMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.5}
          distort={0.3}
          speed={3}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

export function AIOrb() {
  return (
    <div className="w-full h-full min-h-[400px] md:min-h-[600px] relative left-45">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <pointLight position={[-10, -10, -5]} color="#6366F1" intensity={2} />

        <OrbMesh />

        <Environment preset="city" />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
