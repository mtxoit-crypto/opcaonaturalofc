import { Link } from "@tanstack/react-router";
import { objectiveGroups } from "@/lib/landing-copy";
import type { Product } from "@/lib/products";

export function ObjectivePicker({ products }: { products: Product[] | undefined }) {
  const benefits = (products ?? []).filter((p) => p.is_active).flatMap((p) => p.benefits ?? []);
  const groups = objectiveGroups(benefits);
  if (!groups.length) return null;

  return (
    <section className="border-y border-border bg-sand">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-display text-3xl">Escolha por objetivo</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Grupos a partir dos benefícios cadastrados no catálogo. Não são indicações terapêuticas.
        </p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                to="/produtos"
                search={{ q: g.label }}
                className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-sm hover:bg-secondary"
              >
                {g.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
