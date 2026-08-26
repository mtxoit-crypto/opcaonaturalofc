import { useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas, type CanvasProps } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/reduced-motion";

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
  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null);
  const [interacting, setInteracting] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [lowPower, setLowPower] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
    const hardwareConcurrency = navigator.hardwareConcurrency || 8;
    const deviceMemory =
      "deviceMemory" in navigator
        ? Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory)
        : 8;
    setLowPower(hardwareConcurrency <= 4 || deviceMemory <= 4);
  }, []);

  useEffect(() => {
    if (!stageEl || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(Boolean(entry?.isIntersecting)),
      { rootMargin: "120px" },
    );
    observer.observe(stageEl);
    return () => observer.disconnect();
  }, [stageEl]);

  const markInteraction = () => {
    setHasInteracted(true);
    setInteracting(true);
  };

  const finishInteraction = () => setInteracting(false);

  const rotate = () => {
    markInteraction();
    controlsRef.current?.rotateLeft(Math.PI / 4);
    controlsRef.current?.update();
    finishInteraction();
  };

  const zoom = (direction: "in" | "out") => {
    markInteraction();
    const controlsApi = controlsRef.current;
    if (controlsApi) {
      direction === "in" ? controlsApi.dollyIn(1.2) : controlsApi.dollyOut(1.2);
      controlsApi.update();
    }
    finishInteraction();
  };

  const reset = () => {
    markInteraction();
    controlsRef.current?.reset();
    finishInteraction();
  };

  return (
    <div ref={setStageEl} className="absolute inset-0" aria-label={hint}>
      {stageEl && isVisible ? (
        <Canvas
          shadows={lowPower ? false : (shadows ?? false)}
          dpr={lowPower ? [1, 1.25] : [1, 1.75]}
          camera={camera}
          className="absolute inset-0 h-full w-full"
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          eventSource={stageEl}
          eventPrefix="client"
          style={{ width: "100%", height: "100%", pointerEvents: "auto", touchAction: "pan-y" }}
        >
          {children}
          <OrbitControls
            ref={controlsRef}
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
            autoRotate={!reduceMotion && !hasInteracted && !interacting}
            autoRotateSpeed={controls?.autoRotateSpeed ?? 0.22}
            rotateSpeed={controls?.rotateSpeed ?? 0.32}
            onStart={markInteraction}
            onEnd={finishInteraction}
          />
        </Canvas>
      ) : null}

      <div className="pointer-events-none absolute inset-0 z-10 select-none">
        <span className="pointer-events-none absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/[0.03] px-8 py-12 ring-1 ring-foreground/10 md:bg-transparent md:px-16 md:py-24">
          <span className="sr-only">{hint}</span>
        </span>
        <div className={cn("pointer-events-auto absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-card/85 p-1 shadow-sm backdrop-blur", compact && "bottom-2")}>
          <button type="button" aria-label="Girar" title="Girar" onClick={rotate} className="rounded-full px-2 py-1 text-[11px] hover:bg-muted">
            Girar
          </button>
          <button type="button" aria-label="Aproximar" title="Aproximar" onClick={() => zoom("in")} className="rounded-full px-2 py-1 text-[11px] hover:bg-muted">
            Aproximar
          </button>
          <button type="button" aria-label="Afastar" title="Afastar" onClick={() => zoom("out")} className="rounded-full px-2 py-1 text-[11px] hover:bg-muted">
            Afastar
          </button>
          <button type="button" aria-label="Resetar" title="Resetar" onClick={reset} className="rounded-full px-2 py-1 text-[11px] hover:bg-muted">
            Resetar
          </button>
        </div>
      </div>
    </div>
  );
}
