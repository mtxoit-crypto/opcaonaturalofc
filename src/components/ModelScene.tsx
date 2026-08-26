import { Suspense, useEffect, useMemo, useState } from "react";
import { Bounds, ContactShadows, Environment, Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ViewerStage } from "@/components/ViewerStage";

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => {
    const next = scene.clone(true);
    next.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry = object.geometry.clone();
      if (Array.isArray(object.material)) {
        object.material = object.material.map((material) => material.clone());
      } else {
        object.material = object.material.clone();
      }
    });
    return next;
  }, [scene]);

  useEffect(() => {
    return () => {
      clone.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      });
    };
  }, [clone]);

  return <primitive object={clone} dispose={null} />;
}

export default function ModelScene({ url }: { url: string }) {
  const [lowPower, setLowPower] = useState(false);

  useEffect(() => {
    const hardwareConcurrency = navigator.hardwareConcurrency || 8;
    const deviceMemory =
      "deviceMemory" in navigator
        ? Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory)
        : 8;
    setLowPower(hardwareConcurrency <= 4 || deviceMemory <= 4);
  }, []);

  return (
    <ViewerStage
      camera={{ position: [0, 0.5, 3.2], fov: 40 }}
      hint="Arraste para girar · no computador, role para aproximar"
      controls={{
        enableZoom: true,
        minDistance: 1.5,
        maxDistance: 6,
        minPolarAngle: Math.PI / 5,
        maxPolarAngle: Math.PI / 1.7,
        target: [0, 0, 0],
        autoRotateSpeed: 0.18,
        rotateSpeed: 0.3,
        dampingFactor: 0.042,
      }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 2]} intensity={lowPower ? 0.9 : 1.1} />
      <Suspense
        fallback={
          <Html center className="rounded-full bg-card/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            Carregando modelo…
          </Html>
        }
      >
        <Bounds fit clip observe margin={1.2}>
          <Model url={url} />
        </Bounds>
        <Environment preset="city" />
      </Suspense>
      {!lowPower ? <ContactShadows position={[0, -1, 0]} opacity={0.35} blur={2.6} far={4} /> : null}
    </ViewerStage>
  );
}
