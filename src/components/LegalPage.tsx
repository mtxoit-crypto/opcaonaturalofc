import type { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-display text-4xl">{title}</h1>
      <div className="mt-6 space-y-4 text-muted-foreground">{children}</div>
    </article>
  );
}
