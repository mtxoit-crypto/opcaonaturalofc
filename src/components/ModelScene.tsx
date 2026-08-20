import { Suspense, useMemo } from "react";
import { Bounds, ContactShadows, Environment, useGLTF } from "@react-three/drei";
import { ViewerStage } from "@/components/ViewerStage";

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={clone} />;
}

export default function ModelScene({ url }: { url: string }) {
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
        autoRotateSpeed: 0.5,
      }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 2]} intensity={1.1} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.2}>
          <Model url={url} />
        </Bounds>
        <Environment preset="city" />
      </Suspense>
      <ContactShadows position={[0, -1, 0]} opacity={0.35} blur={2.6} far={4} />
    </ViewerStage>
  );
}
