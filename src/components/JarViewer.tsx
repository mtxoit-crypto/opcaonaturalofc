import { Suspense, lazy, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const JarScene = lazy(() => import("./JarScene"));

type Props = {
  jarColor: string;
  lidColor: string;
  capsuleColor: string;
  capsuleCount: number;
  name?: string | undefined;
  dosage?: string | undefined;
  subtitle?: string | undefined;
  imageUrl?: string | undefined;
  compact?: boolean;
  className?: string;
};

function Placeholder() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-40 w-28 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}

export function JarViewer({ className, compact, ...scene }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      className={cn("min-w-0 w-full", className)}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl bg-sand grain-bg",
          compact ? "h-[220px] sm:h-[248px]" : "h-[320px] sm:h-[380px]",
        )}
      >
        <ClientOnly fallback={<Placeholder />}>
          <Suspense fallback={<Placeholder />}>
            <JarScene open={open} compact={compact} {...scene} />
          </Suspense>
        </ClientOnly>
        <span className="pointer-events-none absolute bottom-2.5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-card/85 px-2.5 py-0.5 text-[11px] text-muted-foreground backdrop-blur">
          Gire no círculo
        </span>
      </div>
      <div className="mt-3 flex justify-center">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Button
            size={compact ? "sm" : "lg"}
            variant={open ? "secondary" : "default"}
            onClick={() => setOpen(!open)}
          >
            {open ? "Fechar tampa" : "Abrir tampa"}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
