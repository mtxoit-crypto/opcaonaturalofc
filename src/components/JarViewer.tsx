import { Suspense, lazy, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const JarScene = lazy(() => import("./JarScene"));

type Props = {
  jarColor: string;
  lidColor: string;
  capsuleColor: string;
  capsuleCount: number;
  className?: string;
};

function Placeholder() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-40 w-28 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}

export function JarViewer({ className, ...scene }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <div className="relative h-[380px] w-full overflow-hidden rounded-3xl bg-sand grain-bg sm:h-[460px]">
        <ClientOnly fallback={<Placeholder />}>
          <Suspense fallback={<Placeholder />}>
            <JarScene open={open} {...scene} />
          </Suspense>
        </ClientOnly>
        <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-card/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          Arraste para girar o pote
        </span>
      </div>
      <div className="mt-4 flex justify-center">
        <Button size="lg" variant={open ? "secondary" : "default"} onClick={() => setOpen(!open)}>
          {open ? "Fechar a tampa" : "Abrir a tampa e ver as cápsulas"}
        </Button>
      </div>
    </div>
  );
}
