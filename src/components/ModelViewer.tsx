import { Suspense, lazy } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { motion } from "motion/react";

const ModelScene = lazy(() => import("./ModelScene"));

function Placeholder() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-40 w-28 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}

export function ModelViewer({ url, className }: { url: string; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ type: "spring", stiffness: 140, damping: 22 }}
    >
      <div className="relative h-[380px] w-full overflow-hidden rounded-3xl bg-sand grain-bg sm:h-[460px]">
        <ClientOnly fallback={<Placeholder />}>
          <Suspense fallback={<Placeholder />}>
            <ModelScene url={url} />
          </Suspense>
        </ClientOnly>
        <span className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-card/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          Toque no círculo para girar
        </span>
      </div>
    </motion.div>
  );
}
