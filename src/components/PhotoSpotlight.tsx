import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { cn } from "@/lib/utils";

function useDesktopHover() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const hover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionOk = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setOk(hover.matches && !motionOk.matches);
    sync();
    hover.addEventListener("change", sync);
    motionOk.addEventListener("change", sync);
    return () => {
      hover.removeEventListener("change", sync);
      motionOk.removeEventListener("change", sync);
    };
  }, []);
  return ok;
}

export function PhotoSpotlight({
  src,
  alt,
  className,
  imgClassName,
  reveal = false,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  reveal?: boolean;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const desktop = useDesktopHover();
  const reduce = useReducedMotion();
  const x = useMotionValue(50);
  const y = useMotionValue(50);
  const on = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 140, damping: 22, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 140, damping: 22, mass: 0.4 });
  const opacity = useSpring(on, { stiffness: 260, damping: 28 });
  const mask = useMotionTemplate`radial-gradient(circle 180px at ${sx}% ${sy}%, #000 0%, #000 38%, transparent 72%)`;

  function move(e: React.MouseEvent<HTMLDivElement>) {
    if (!desktop || !wrap.current) return;
    const r = wrap.current.getBoundingClientRect();
    x.set(((e.clientX - r.left) / r.width) * 100);
    y.set(((e.clientY - r.top) / r.height) * 100);
    on.set(1);
  }

  return (
    <div
      ref={wrap}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-sand",
        reveal && "photo-reveal",
        className,
      )}
      onMouseMove={move}
      onMouseLeave={() => on.set(0)}
    >
      <img
        src={src}
        alt={alt}
        width={640}
        height={640}
        loading="lazy"
        decoding="async"
        className={cn("photo-zoom relative z-0 h-full w-full object-contain p-4", imgClassName)}
      />
      {desktop && !reduce ? (
        <motion.img
          src={src}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 h-full w-full origin-center scale-[1.22] object-contain p-4"
          style={{
            opacity,
            WebkitMaskImage: mask,
            maskImage: mask,
          }}
        />
      ) : null}
    </div>
  );
}
