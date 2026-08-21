import { useState, type ReactNode } from "react";
import { Canvas, type CanvasProps } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { cn } from "@/lib/utils";

type ControlsProps = {
  enableZoom?: boolean;
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  target?: [number, number, number];
  autoRotateSpeed?: number;
  rotateSpeed?: number;
  dampingFactor?: number;
};

type Props = {
  children: ReactNode;
  camera: NonNullable<CanvasProps["camera"]>;
  shadows?: boolean;
  hint: string;
  compact?: boolean;
  controls?: ControlsProps;
};

export function ViewerStage({ children, camera, shadows, hint, compact, controls }: Props) {
  const [hitEl, setHitEl] = useState<HTMLDivElement | null>(null);
  const [interacting, setInteracting] = useState(false);

  return (
    <>
      {hitEl ? (
        <Canvas
          shadows={shadows ?? false}
          dpr={[1, 1.75]}
          camera={camera}

          className="absolute inset-0 h-full w-full"
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          eventSource={hitEl}
          eventPrefix="client"
          style={{ width: "100%", height: "100%", pointerEvents: "none", touchAction: "pan-y" }}
        >
          {children}
          <OrbitControls
            makeDefault
            enablePan={false}
            enableDamping
            dampingFactor={controls?.dampingFactor ?? 0.045}
            enableZoom={controls?.enableZoom ?? false}
            minDistance={controls?.minDistance ?? 2}
            maxDistance={controls?.maxDistance ?? 8}
            minPolarAngle={controls?.minPolarAngle ?? Math.PI / 3.6}
            maxPolarAngle={controls?.maxPolarAngle ?? Math.PI / 1.85}
            target={controls?.target ?? [0, 0.05, 0]}
            autoRotate={!interacting}
            autoRotateSpeed={controls?.autoRotateSpeed ?? 0.22}
            rotateSpeed={controls?.rotateSpeed ?? 0.32}
            onStart={() => setInteracting(true)}
            onEnd={() => setInteracting(false)}
          />
        </Canvas>
      ) : null}

      <div
        ref={setHitEl}
        aria-label={hint}
        title={hint}
        className={cn(
          "absolute left-1/2 top-[48%] z-10 -translate-x-1/2 -translate-y-1/2",
          compact
            ? "h-[42%] w-[40%] max-h-[96px] max-w-[88px] md:h-[50%] md:w-[42%] md:max-h-[140px] md:max-w-[120px]"
            : "h-[34%] w-[36%] max-h-[132px] max-w-[128px] md:h-[58%] md:w-[50%] md:max-h-[260px] md:max-w-[220px]",
          "overflow-hidden rounded-full",
          "cursor-grab touch-none select-none active:cursor-grabbing",
          "bg-foreground/[0.03] ring-1 ring-foreground/12",
          "md:bg-transparent md:ring-foreground/10",
        )}
      />
    </>
  );
}
