import { landing } from "@/lib/landing-copy";

export function Differentials() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14">
      <h2 className="text-display text-3xl">O que você encontra aqui</h2>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {landing.diffs.map((item) => (
          <li key={item.t} className="surface-card p-5">
            <h3 className="text-lg">{item.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{item.d}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
