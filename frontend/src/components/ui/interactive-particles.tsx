"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useTheme } from "next-themes";

const count = 3000;

function Particles() {
  const mesh = useRef<THREE.Points>(null!);
  const { mouse, viewport } = useThree();
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";
  const color = isDark ? "#6366F1" : "#4F46E5";

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Create a large spherical volume
      const r = 10 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);

  const originalPositions = useMemo(() => new Float32Array(particlesPosition), [particlesPosition]);

  useFrame((state) => {
    if (!mesh.current) return;
    
    // Slow global rotation
    mesh.current.rotation.y = state.clock.elapsedTime * 0.05;
    mesh.current.rotation.x = state.clock.elapsedTime * 0.02;
    
    // Convert mouse to local space of the mesh
    const vector = new THREE.Vector3(
      (mouse.x * viewport.width) / 2, 
      (mouse.y * viewport.height) / 2, 
      0
    );
    
    // Apply inverse rotation so the mouse maps correctly to the rotated points
    const euler = new THREE.Euler(-mesh.current.rotation.x, -mesh.current.rotation.y, 0, 'XYZ');
    vector.applyEuler(euler);

    const positions = mesh.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const px = positions[i3];
      const py = positions[i3 + 1];
      const pz = positions[i3 + 2];
      
      const ox = originalPositions[i3];
      const oy = originalPositions[i3 + 1];
      const oz = originalPositions[i3 + 2];

      const dx = px - vector.x;
      const dy = py - vector.y;
      const dz = pz - vector.z;
      
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Strong repel from mouse pointer
      if (dist < 2.5) {
        const force = (2.5 - dist) * 0.3;
        positions[i3] += (dx / dist) * force;
        positions[i3 + 1] += (dy / dist) * force;
        positions[i3 + 2] += (dz / dist) * force;
      }

      // Smooth return to original shape
      positions[i3] += (ox - positions[i3]) * 0.05;
      positions[i3 + 1] += (oy - positions[i3 + 1]) * 0.05;
      positions[i3 + 2] += (oz - positions[i3 + 2]) * 0.05;
    }
    
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.06} 
        color={color} 
        transparent 
        opacity={0.6} 
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function InteractiveParticles() {
  return (
    <div className="fixed inset-0 z-[0] pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }} gl={{ alpha: true }}>
        <Particles />
      </Canvas>
    </div>
  );
}
