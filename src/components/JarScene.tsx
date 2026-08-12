import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

type Props = {
  open: boolean;
  jarColor: string;
  lidColor: string;
  capsuleColor: string;
  capsuleCount: number;
  name?: string | undefined;
  dosage?: string | undefined;
};

/** Rótulo branco com o texto do produto, gerado em canvas (igual às fotos). */
function useLabelTexture(name?: string, dosage?: string, capsuleCount?: number) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const w = 2048;
    const h = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // corpo plástico branco
    ctx.fillStyle = "#F3F2EF";
    ctx.fillRect(0, 0, w, h);

    // etiqueta de papel colada na frente (só numa faixa da circunferência)
    const lx = w * 0.06;
    const lw = w * 0.42;
    const ly = h * 0.1;
    const lh = h * 0.8;
    ctx.fillStyle = "#FBFBF9";
    ctx.fillRect(lx, ly, lw, lh);
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 4;
    ctx.strokeRect(lx, ly, lw, lh);

    const cx = lx + lw / 2;
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";

    const title = (name ?? "Opção Natural").trim();
    const words = title.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length > 12 && current) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);

    const titleSize = lines.length > 2 ? 92 : 118;
    ctx.font = `600 ${titleSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
    let y = ly + lh * 0.28;
    for (const line of lines) {
      ctx.fillText(line, cx, y);
      y += titleSize * 1.05;
    }

    ctx.font = "400 62px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillStyle = "#1B1B1B";
    y += 26;
    for (const line of (dosage ?? "").split(/ e |, /).filter(Boolean).slice(0, 2)) {
      ctx.fillText(line, cx, y);
      y += 78;
    }
    ctx.fillText(`Contém ${capsuleCount ?? 60} cápsulas`, cx, y);

    ctx.textAlign = "left";
    ctx.font = "400 52px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText("500mg", lx + 30, ly + lh - 40);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    setTexture(tex);
    return () => tex.dispose();
  }, [name, dosage, capsuleCount]);

  return texture;
}

function Capsules({ color, count }: { color: string; count: number }) {
  const items = useMemo(() => {
    const rng = (seed: number) => {
      const x = Math.sin(seed * 127.1) * 43758.5453;
      return x - Math.floor(x);
    };
    const n = Math.min(Math.max(count, 14), 44);
    return Array.from({ length: n }, (_, i) => {
      const layer = Math.floor(i / 9);
      const radius = 0.05 + rng(i + 1) * 0.4;
      const angle = rng(i + 7) * Math.PI * 2;
      return {
        position: [
          Math.cos(angle) * radius,
          -0.42 + layer * 0.2 + rng(i + 13) * 0.05,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        rotation: [
          rng(i + 3) * Math.PI,
          rng(i + 5) * Math.PI,
          rng(i + 9) * Math.PI,
        ] as [number, number, number],
      };
    });
  }, [count]);

  return (
    <group>
      {items.map((c, i) => (
        <mesh key={i} position={c.position} rotation={c.rotation} castShadow>
          <capsuleGeometry args={[0.065, 0.13, 6, 16]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.05} />
        </mesh>
      ))}
    </group>
  );
}

/** Perfil do frasco farmacêutico: base reta, ombro arredondado e gargalo. */
function useBottleGeometry() {
  return useMemo(() => {
    const points: THREE.Vector2[] = [];
    points.push(new THREE.Vector2(0, -0.86));
    points.push(new THREE.Vector2(0.5, -0.86));
    points.push(new THREE.Vector2(0.56, -0.8));
    points.push(new THREE.Vector2(0.58, -0.7));
    points.push(new THREE.Vector2(0.58, 0.5));
    points.push(new THREE.Vector2(0.575, 0.62));
    points.push(new THREE.Vector2(0.54, 0.72));
    points.push(new THREE.Vector2(0.47, 0.79));
    points.push(new THREE.Vector2(0.41, 0.83));
    points.push(new THREE.Vector2(0.4, 1.0));
    return new THREE.LatheGeometry(points, 96);
  }, []);
}

/** Anéis verticais da tampa (canelada), como nas fotos. */
function LidRibs({ color }: { color: string }) {
  const ribs = useMemo(() => Array.from({ length: 44 }, (_, i) => (i / 44) * Math.PI * 2), []);
  return (
    <group>
      {ribs.map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 0.6, 0, Math.sin(a) * 0.6]} rotation={[0, -a, 0]}>
          <boxGeometry args={[0.02, 0.34, 0.035]} />
          <meshStandardMaterial color={color} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function Jar({ open, jarColor, lidColor, capsuleColor, capsuleCount, name, dosage }: Props) {
  const group = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const bottle = useBottleGeometry();
  const label = useLabelTexture(name, dosage, capsuleCount);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * (open ? 0.1 : 0.16);
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        open ? -0.7 : 0,
        4,
        delta,
      );
      group.current.position.y = -0.25 + Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
    }
    if (lid.current) {
      const targetY = open ? 1.65 : 1.05;
      const targetTilt = open ? 0.3 : 0;
      lid.current.position.y = THREE.MathUtils.damp(lid.current.position.y, targetY, 5, delta);
      lid.current.rotation.z = THREE.MathUtils.damp(lid.current.rotation.z, targetTilt, 5, delta);
    }
  });

  return (
    <group ref={group} position={[0, -0.25, 0]} scale={0.95}>
      {/* corpo do frasco (plástico branco fosco) com rótulo aplicado */}
      <mesh geometry={bottle} castShadow receiveShadow>
        <meshStandardMaterial
          color={jarColor}
          map={label}
          roughness={0.62}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      <Capsules color={capsuleColor} count={capsuleCount} />

      {/* tampa verde canelada */}
      <group ref={lid} position={[0, 1.05, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.6, 0.6, 0.36, 72]} />
          <meshStandardMaterial color={lidColor} roughness={0.4} metalness={0.05} />
        </mesh>
        <LidRibs color={lidColor} />
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 0.05, 72]} />
          <meshStandardMaterial color={lidColor} roughness={0.3} />
        </mesh>
        {/* saia inferior mais larga, como no frasco real */}
        <mesh position={[0, -0.21, 0]}>
          <cylinderGeometry args={[0.615, 0.6, 0.09, 72]} />
          <meshStandardMaterial color={lidColor} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

export default function JarScene(props: Props) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.5, 4.2], fov: 34 }}>
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 5, 3]} intensity={1.5} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.45} />
      <pointLight position={[0, 1.2, 0]} intensity={2} distance={2.5} />
      <Jar {...props} />
      <ContactShadows position={[0, -1.12, 0]} opacity={0.35} scale={6} blur={2.6} far={3} />
      <Environment preset="city" />
      <OrbitControls
        target={[0, 0.1, 0]}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.9}
      />
    </Canvas>
  );
}
