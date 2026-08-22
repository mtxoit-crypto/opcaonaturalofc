import { landing } from "@/lib/landing-copy";

export function HowToBuy() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14">
      <h2 className="text-display text-3xl">Como comprar</h2>
      <ol className="mt-8 grid gap-5 md:grid-cols-3">
        {landing.how.map((step) => (
          <li key={step.n} className="surface-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Passo {step.n}</p>
            <h3 className="mt-2 text-lg">{step.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
