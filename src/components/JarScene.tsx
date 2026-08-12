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
  imageUrl?: string | undefined;
};

type LabelData = {
  texture: THREE.CanvasTexture;
  bodyColor: string | null;
  lidColor: string | null;
  aspect: number;
};

const TEX_W = 2048;
const LABEL_ARC = 2.6;
const TEX_H = 1024;
/** faixa horizontal da textura ocupada pelo rótulo (frente do frasco) */
const LABEL_X = 0.06;
const LABEL_W = 0.42;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Recorta a foto real do produto e usa o rótulo da frente como textura. */
function buildFromPhoto(img: HTMLImageElement): LabelData | null {
  const src = document.createElement("canvas");
  src.width = img.naturalWidth;
  src.height = img.naturalHeight;
  const sctx = src.getContext("2d", { willReadFrequently: true });
  if (!sctx) return null;
  sctx.drawImage(img, 0, 0);

  let data: ImageData;
  try {
    data = sctx.getImageData(0, 0, src.width, src.height);
  } catch {
    return null;
  }

  // bounding box do produto (pixels visíveis)
  let minX = src.width;
  let minY = src.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < src.height; y += 2) {
    for (let x = 0; x < src.width; x += 2) {
      const i = (y * src.width + x) * 4;
      const a = data.data[i + 3] ?? 0;
      const r = data.data[i] ?? 255;
      const g = data.data[i + 1] ?? 255;
      const b = data.data[i + 2] ?? 255;
      const visible = a > 40 && !(r > 246 && g > 246 && b > 246);
      if (visible) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX <= minX || maxY <= minY) return null;

  const bw = maxX - minX;
  const bh = maxY - minY;

  const sample = (fy: number, spread = 0.03) => {
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    const y0 = Math.round(minY + bh * (fy - spread));
    const y1 = Math.round(minY + bh * (fy + spread));
    for (let y = y0; y <= y1; y += 1) {
      for (let x = Math.round(minX + bw * 0.35); x <= Math.round(minX + bw * 0.65); x += 1) {
        const i = (y * src.width + x) * 4;
        if ((data.data[i + 3] ?? 0) < 120) continue;
        r += data.data[i] ?? 0;
        g += data.data[i + 1] ?? 0;
        b += data.data[i + 2] ?? 0;
        n += 1;
      }
    }
    if (!n) return null;
    const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, "0");
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  };

  const lidColor = sample(0.07);
  const bodyColor = sample(0.245, 0.02);

  // recorte do rótulo: do ombro até quase a base
  const lx = Math.round(minX + bw * 0.05);
  const lw = Math.round(bw * 0.9);
  const ly = Math.round(minY + bh * 0.3);
  const lh = Math.round(bh * 0.6);

  const artW = 1400;
  const artH = Math.round((artW * lh) / lw);
  const pad = Math.round(artW * 0.26);
  const out = document.createElement("canvas");
  out.width = artW + pad * 2;
  out.height = artH;
  const ctx = out.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = bodyColor ?? "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(src, lx, ly, lw, lh, pad, 0, artW, artH);

  const tex = new THREE.CanvasTexture(out);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { texture: tex, bodyColor, lidColor, aspect: out.width / out.height };
}


/** Rótulo gerado em canvas quando não há foto do produto. */
function buildFallback(name?: string, dosage?: string, capsuleCount?: number): LabelData | null {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 900;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const lx = 0;
  const lw = canvas.width;
  const ly = 0;
  const lh = canvas.height;
  ctx.fillStyle = "#FBFBF9";
  ctx.fillRect(lx, ly, lw, lh);

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

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { texture: tex, bodyColor: null, lidColor: null, aspect: canvas.width / canvas.height };
}

function useLabel(
  imageUrl?: string,
  name?: string,
  dosage?: string,
  capsuleCount?: number,
): LabelData | null {
  const [data, setData] = useState<LabelData | null>(null);

  useEffect(() => {
    let cancelled = false;
    let created: LabelData | null = null;

    const apply = (next: LabelData | null) => {
      if (cancelled) {
        next?.texture.dispose();
        return;
      }
      created = next;
      setData(next);
    };

    if (imageUrl) {
      loadImage(imageUrl)
        .then((img) => apply(buildFromPhoto(img) ?? buildFallback(name, dosage, capsuleCount)))
        .catch(() => apply(buildFallback(name, dosage, capsuleCount)));
    } else {
      apply(buildFallback(name, dosage, capsuleCount));
    }

    return () => {
      cancelled = true;
      created?.texture.dispose();
    };
  }, [imageUrl, name, dosage, capsuleCount]);

  return data;
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

function Jar({ open, jarColor, lidColor, capsuleColor, capsuleCount, name, dosage, imageUrl }: Props) {
  const group = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const bottle = useBottleGeometry();
  const label = useLabel(imageUrl, name, dosage, capsuleCount);
  const bodyColor = label?.bodyColor ?? jarColor;
  const capColor = label?.lidColor ?? lidColor;


  useFrame((state, delta) => {
    if (group.current) {
      // balanço suave mantendo o rótulo sempre virado para a frente
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.45) * 0.28;
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
    <group ref={group} position={[0, -0.25, 0]} scale={0.78}>
      {/* corpo do frasco */}
      <mesh geometry={bottle} castShadow receiveShadow>
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.62}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* rótulo curvo colado na frente, com a arte real do produto */}
      {label ? (
        <mesh position={[0, -0.08, 0]} rotation={[0, -LABEL_ARC / 2, 0]}>
          <cylinderGeometry
            args={[0.592, 0.592, (0.592 * LABEL_ARC) / label.aspect, 96, 1, true, 0, LABEL_ARC]}
          />
          <meshStandardMaterial
            map={label.texture}
            roughness={0.55}
            metalness={0}
            side={THREE.DoubleSide}
            polygonOffset
            polygonOffsetFactor={-2}
          />
        </mesh>
      ) : null}



      <Capsules color={capsuleColor} count={capsuleCount} />

      {/* tampa verde canelada */}
      <group ref={lid} position={[0, 1.05, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.6, 0.6, 0.36, 72]} />
          <meshStandardMaterial color={capColor} roughness={0.4} metalness={0.05} />
        </mesh>
        <LidRibs color={capColor} />
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 0.05, 72]} />
          <meshStandardMaterial color={capColor} roughness={0.3} />
        </mesh>
        {/* saia inferior mais larga, como no frasco real */}
        <mesh position={[0, -0.21, 0]}>
          <cylinderGeometry args={[0.615, 0.6, 0.09, 72]} />
          <meshStandardMaterial color={capColor} roughness={0.5} />
        </mesh>
      </group>

    </group>
  );
}

export default function JarScene(props: Props) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.3, 4.6], fov: 34 }}>
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
