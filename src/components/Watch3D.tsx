import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, MeshWobbleMaterial, OrbitControls, Environment, PerspectiveCamera, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';

const WatchInternal = () => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
      meshRef.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.1;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Abstract Luxury Watch Body */}
      <mesh castShadow>
        <cylinderGeometry args={[2, 2.1, 0.4, 64]} />
        <meshStandardMaterial 
          color="#e5e5e5" 
          metalness={0.95} 
          roughness={0.05} 
          envMapIntensity={2}
        />
      </mesh>
      
      {/* Bezel */}
      <mesh position={[0, 0.25, 0]}>
        <torusGeometry args={[1.9, 0.05, 16, 100]} />
        <meshStandardMaterial color="#ffffff" metalness={1} roughness={0} />
      </mesh>

      {/* Dial Glass */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[1.8, 1.8, 0.1, 64]} />
        <meshPhysicalMaterial 
          transparent 
          opacity={0.3} 
          transmission={1} 
          thickness={0.5} 
          roughness={0} 
          color="#ffffff"
        />
      </mesh>

      {/* Center Detail */}
      <mesh position={[0, 0, 0]}>
         <sphereGeometry args={[0.2, 32, 32]} />
         <meshStandardMaterial color="#000000" metalness={1} />
      </mesh>
    </group>
  );
};

export const Watch3D = () => {
  return (
    <div className="w-full h-[600px] lg:h-[800px] cursor-grab active:cursor-grabbing">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={35} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#c0c0c0" />
        
        <PresentationControls
          global
          snap
          speed={1.5}
          zoom={0.8}
          rotation={[0, 0, 0]}
          polar={[-Math.PI / 4, Math.PI / 4]}
          azimuth={[-Math.PI / 4, Math.PI / 4]}
        >
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <WatchInternal />
          </Float>
        </PresentationControls>

        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <Environment frames={Infinity} resolution={256}>
           <mesh scale={20}>
              <sphereGeometry />
              <meshStandardMaterial side={THREE.BackSide} color="#ffffff" />
           </mesh>
        </Environment>
        <ContactShadows position={[0, -2.5, 0]} opacity={0.2} scale={10} blur={2.5} far={4} color="#000000" />
      </Canvas>
    </div>
  );
};

import { ContactShadows } from '@react-three/drei';
