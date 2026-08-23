import { landing } from "@/lib/landing-copy";

export function HowToBuy() {
  return (
    <section className="border-y border-border bg-sand">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-display text-3xl">Como comprar</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {landing.how.map((step) => (
            <li key={step.t}>
              <p className="text-display text-3xl text-primary/80">{step.n}</p>
              <h3 className="mt-2 text-lg">{step.t}</h3>
              <p className="mt-2 max-w-[32ch] text-sm text-muted-foreground">{step.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
