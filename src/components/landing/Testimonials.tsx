import { Star } from "lucide-react";
import { landing } from "@/lib/landing-copy";

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14">
      <h2 className="text-display text-3xl">Depoimentos</h2>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {landing.testimonials.map((t, i) => (
          <li key={i} className="surface-card p-5">
            <div className="flex items-center gap-1" aria-label="5 de 5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="size-4 fill-accent text-accent" />
              ))}
            </div>
            <p className="mt-3 text-sm">“{t.text}”</p>
            <p className="mt-3 text-sm font-medium">{t.name}</p>
            <p className="text-xs text-muted-foreground">{t.city}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
