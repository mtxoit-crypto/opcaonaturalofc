import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { productsQuery, formatPrice } from "@/lib/products";

export const Route = createFileRoute("/produtos/")({
  head: () => ({
    meta: [
      { title: "Produtos · Naturalis vitaminas naturais" },
      {
        name: "description",
        content:
          "Catálogo completo de vitaminas naturais Naturalis: D3, C, complexo B e multivitamínico em cápsulas veganas.",
      },
      { property: "og:title", content: "Produtos · Naturalis vitaminas naturais" },
      {
        property: "og:description",
        content: "Vitaminas naturais em cápsulas veganas, com pote 3D interativo em cada produto.",
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { data: products, isLoading } = useQuery(productsQuery);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="text-4xl">Produtos</h1>
      <p className="mt-2 max-w-lg text-muted-foreground">
        Escolha um produto para girar o pote em 3D e abrir a tampa.
      </p>

      {isLoading ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(products ?? []).map((p) => (
            <Link
              key={p.id}
              to="/produtos/$slug"
              params={{ slug: p.slug }}
              className="surface-card group flex flex-col p-6 transition-transform hover:-translate-y-1"
            >
              <div
                className="h-36 rounded-xl"
                style={{ background: `linear-gradient(160deg, ${p.jar_color}, ${p.lid_color})` }}
              />
              <h2 className="mt-5 text-2xl">{p.name}</h2>
              <p className="text-sm text-muted-foreground">{p.subtitle}</p>
              <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-5 flex items-center justify-between">
                <span className="font-medium text-accent">{formatPrice(p.price)}</span>
                <span className="text-xs text-muted-foreground">{p.capsule_count} cápsulas</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
