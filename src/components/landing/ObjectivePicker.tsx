import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { objectiveGroups, productGroups } from "@/lib/landing-copy";
import { productPhoto, type Product } from "@/lib/products";

export function ObjectivePicker({ products }: { products: Product[] | undefined }) {
  const active = (products ?? []).filter((p) => p.is_active);
  const groups = productGroups.flatMap((group) => {
    const matches = active.filter((product) =>
      objectiveGroups(product.benefits ?? []).some(({ id }) => id === group.id),
    );
    const cover = matches.find((product) => productPhoto(product));
    return cover ? [{ ...group, cover }] : [];
  });
  if (!groups.length) return null;

  return (
    <section aria-labelledby="shop-categories" className="border-y border-border bg-sand">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <h2 id="shop-categories" className="text-display text-3xl sm:text-4xl">
          Explore por categoria
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {groups.map(({ id, label, cover }) => (
            <li key={id}>
              <Link
                to="/produtos"
                search={{ categoria: id }}
                className="group surface-card block rounded-2xl p-3 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <img
                  src={productPhoto(cover)}
                  alt=""
                  width={240}
                  height={240}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full rounded-xl bg-sand object-contain p-3 transition-transform group-hover:scale-[1.04] motion-reduce:transition-none"
                />
                <span className="mt-3 flex items-center justify-between gap-1 px-1 pb-1 font-medium">
                  {label}
                  <ArrowUpRight className="size-4 shrink-0" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
