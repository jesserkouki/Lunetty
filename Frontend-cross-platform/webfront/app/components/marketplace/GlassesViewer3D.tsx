"use client";

import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Center, ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";

function GlbModel({
  url,
  onReady,
}: {
  url: string;
  onReady: () => void;
}) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    onReady();
  }, [onReady, scene]);

  return (
    <Center>
      <primitive object={scene} scale={1.4} />
    </Center>
  );
}

export default function GlassesViewer3D({
  url,
  onReady,
  autoRotate = true,
}: {
  url: string;
  onReady: () => void;
  autoRotate?: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 4], fov: 36 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <directionalLight position={[-4, 2, -2]} intensity={1.1} color="#c6a674" />
      <pointLight position={[0, -2, 3]} intensity={0.55} color="#f4e3bf" />
      <Suspense fallback={null}>
        <GlbModel url={url} onReady={onReady} />
        <ContactShadows position={[0, -0.75, 0]} opacity={0.28} scale={3.5} blur={2.2} far={2} />
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={autoRotate}
        autoRotateSpeed={0.4}
        minPolarAngle={Math.PI / 2.4}
        maxPolarAngle={Math.PI / 1.7}
      />
    </Canvas>
  );
}
