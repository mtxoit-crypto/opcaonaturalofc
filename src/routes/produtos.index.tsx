import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { productsQuery, formatPrice, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/produtos/")({
  head: () => ({
    meta: [
      { title: "Produtos · Opção Natural suplementos naturais" },
      {
        name: "description",
        content:
          "Catálogo de suplementos naturais Opção Natural em cápsulas. Compre com Pix e receba em todo o Brasil.",
      },
      { property: "og:title", content: "Produtos · Opção Natural suplementos naturais" },
      {
        property: "og:description",
        content: "Suplementos naturais em cápsulas, com pote 3D interativo e compra rápida via Pix.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://natural-pot-showcase.lovable.app/produtos" },
    ],
    links: [{ rel: "canonical", href: "https://natural-pot-showcase.lovable.app/produtos" }],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { data: products, isLoading } = useQuery(productsQuery);
  const { add } = useCart();
  const navigate = useNavigate();

  function buy(p: Product, now: boolean) {
    add({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price ?? 0,
      image_url: p.image_url,
    });
    if (now) navigate({ to: "/checkout" });
    else toast.success(`${p.name} adicionado ao carrinho`);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="text-4xl">Produtos</h1>
      <p className="mt-2 max-w-lg text-muted-foreground">
        Escolha seu suplemento, adicione ao carrinho e finalize com Pix.
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
            <article key={p.id} className="surface-card flex flex-col p-6">
              <Link to="/produtos/$slug" params={{ slug: p.slug }} className="group">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={`Pote de ${p.name} — suplemento natural em cápsulas`}
                    loading="lazy"
                    className="h-44 w-full rounded-xl bg-sand object-contain transition-transform group-hover:scale-[1.03]"
                  />
                ) : (
                  <div
                    className="h-44 rounded-xl"
                    style={{
                      background: `linear-gradient(160deg, ${p.jar_color}, ${p.lid_color})`,
                    }}
                  />
                )}
                <h2 className="mt-5 text-2xl">{p.name}</h2>
                <p className="text-sm text-muted-foreground">{p.subtitle}</p>
              </Link>
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-lg font-medium text-accent">{formatPrice(p.price)}</span>
                <span className="text-xs text-muted-foreground">{p.capsule_count} cápsulas</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={!p.in_stock || p.price == null}
                  onClick={() => buy(p, false)}
                >
                  <ShoppingBag className="size-4" />
                  Adicionar
                </Button>
                <Button
                  className="flex-1"
                  disabled={!p.in_stock || p.price == null}
                  onClick={() => buy(p, true)}
                >
                  Comprar
                </Button>
              </div>
              {!p.in_stock ? (
                <p className="mt-2 text-center text-xs text-muted-foreground">Esgotado</p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
