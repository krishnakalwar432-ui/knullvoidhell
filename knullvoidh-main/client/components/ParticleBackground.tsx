import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function ParticleField() {
  const ref = useRef<THREE.Points>(null);
  const [sphere] = useMemo(() => {
    const sphere = new THREE.BufferGeometry();
    const positions = new Float32Array(5000 * 3);
    
    for (let i = 0; i < 5000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    
    sphere.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return [sphere];
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} geometry={sphere} stride={3} frustumCulled>
        <PointMaterial
          transparent
          color="#0aff9d"
          size={0.3}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.6}
        />
      </Points>
    </group>
  );
}

export default function ParticleBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 30] }}>
        <ParticleField />
      </Canvas>
    </div>
  );
}
