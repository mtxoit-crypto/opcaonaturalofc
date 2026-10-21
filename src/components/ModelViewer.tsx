import { Component, Suspense, lazy, type ReactNode } from "react";
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

type ErrorBoundaryProps = { fallback: ReactNode; children: ReactNode };
type ErrorBoundaryState = { hasError: boolean };

class ModelErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function ModelFailure() {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
      Não foi possível carregar o modelo 3D.
    </div>
  );
}

export function ModelViewer({
  url,
  className,
  compact,
  fallback = <ModelFailure />,
}: {
  url: string;
  className?: string;
  compact?: boolean;
  fallback?: ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ type: "spring", stiffness: 140, damping: 22 }}
    >
      <div className={`relative w-full overflow-hidden rounded-3xl bg-sand grain-bg ${compact ? "h-full" : "h-[380px] sm:h-[460px]"}`}>
        <ModelErrorBoundary key={url} fallback={fallback}>
          <ClientOnly fallback={<Placeholder />}>
            <Suspense fallback={<Placeholder />}>
              <ModelScene url={url} />
            </Suspense>
          </ClientOnly>
        </ModelErrorBoundary>
        <span className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-card/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          Arraste para girar
        </span>
      </div>
    </motion.div>
  );
}
