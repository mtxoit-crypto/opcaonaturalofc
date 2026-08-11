import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

type Props = {
  open: boolean;
  jarColor: string;
  lidColor: string;
  capsuleColor: string;
  capsuleCount: number;
};

function Capsules({ color, count }: { color: string; count: number }) {
  const items = useMemo(() => {
    const rng = (seed: number) => {
      const x = Math.sin(seed * 127.1) * 43758.5453;
      return x - Math.floor(x);
    };
    const n = Math.min(Math.max(count, 12), 40);
    return Array.from({ length: n }, (_, i) => {
      const layer = Math.floor(i / 8);
      const radius = 0.05 + rng(i + 1) * 0.42;
      const angle = rng(i + 7) * Math.PI * 2;
      return {
        position: [
          Math.cos(angle) * radius,
          -0.55 + layer * 0.16 + rng(i + 13) * 0.05,
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
          <capsuleGeometry args={[0.07, 0.14, 6, 16]} />
          <meshStandardMaterial color={color} roughness={0.35} metalness={0.05} />
        </mesh>
      ))}
    </group>
  );
}

function Jar({ open, jarColor, lidColor, capsuleColor, capsuleCount }: Props) {
  const group = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.18;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
    }
    if (lid.current) {
      const targetY = open ? 1.55 : 0.95;
      const targetTilt = open ? 0.35 : 0;
      lid.current.position.y = THREE.MathUtils.damp(lid.current.position.y, targetY, 5, delta);
      lid.current.rotation.z = THREE.MathUtils.damp(lid.current.rotation.z, targetTilt, 5, delta);
    }
  });

  return (
    <group ref={group} position={[0, -0.2, 0]}>
      {/* corpo do pote */}
      <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 1.6, 64, 1, true]} />
        <meshPhysicalMaterial
          color={jarColor}
          roughness={0.25}
          metalness={0.05}
          transmission={0.15}
          thickness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* fundo */}
      <mesh position={[0, -0.7, 0]} receiveShadow>
        <cylinderGeometry args={[0.62, 0.6, 0.08, 64]} />
        <meshStandardMaterial color={jarColor} roughness={0.4} />
      </mesh>
      {/* rótulo */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.632, 0.632, 0.85, 64, 1, true]} />
        <meshStandardMaterial color="#F5F1E6" roughness={0.75} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.634, 0.634, 0.12, 64, 1, true]} />
        <meshStandardMaterial color="#8FA86B" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* rosca do gargalo */}
      <mesh position={[0, 0.94, 0]}>
        <cylinderGeometry args={[0.5, 0.56, 0.22, 48]} />
        <meshStandardMaterial color={jarColor} roughness={0.5} />
      </mesh>

      <Capsules color={capsuleColor} count={capsuleCount} />

      {/* tampa */}
      <group ref={lid} position={[0, 0.95, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.66, 0.66, 0.34, 64]} />
          <meshStandardMaterial color={lidColor} roughness={0.35} metalness={0.15} />
        </mesh>
        <mesh position={[0, 0.19, 0]}>
          <cylinderGeometry args={[0.6, 0.66, 0.06, 64]} />
          <meshStandardMaterial color={lidColor} roughness={0.25} metalness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

export default function JarScene(props: Props) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0.9, 3.4], fov: 40 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 2]} intensity={1.6} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.5} />
      <Jar {...props} />
      <ContactShadows position={[0, -1.05, 0]} opacity={0.35} scale={6} blur={2.6} far={3} />
      <Environment preset="sunset" />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 1.9}
      />
    </Canvas>
  );
}
