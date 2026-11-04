import { landing } from "@/lib/landing-copy";

export function Differentials() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14">
      <h2 className="text-display max-w-[16ch] text-3xl leading-[1.15]">Por que comprar com a gente</h2>
      <ul className="mt-8 grid gap-0 divide-y divide-border border-y border-border md:grid-cols-3 md:gap-8 md:divide-y-0">
        {landing.diffs.map((item) => (
          <li key={item.t} className="py-5">
            <h3 className="text-lg">{item.t}</h3>
            <p className="mt-1 max-w-[52ch] text-sm text-muted-foreground">{item.d}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
