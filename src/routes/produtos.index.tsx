import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Loader2, Search, SlidersHorizontal, ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { productsQuery, type Product } from "@/lib/products";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useCartStore } from "@/stores/cartStore";
import { formatMoney } from "@/lib/shopify";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/produtos/")({
  head: () => ({
    meta: [
      { title: "Produtos · Opção Natural suplementos naturais" },
      {
        name: "description",
        content:
          "Catálogo de suplementos naturais Opção Natural em cápsulas. Compre com cartão, Pix ou boleto e receba em todo o Brasil.",
      },
      { property: "og:title", content: "Produtos · Opção Natural suplementos naturais" },
      {
        property: "og:description",
        content: "Suplementos naturais em cápsulas, com pote 3D interativo e checkout seguro.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://opcaonaturalofc.lovable.app/produtos" },
    ],
    links: [{ rel: "canonical", href: "https://opcaonaturalofc.lovable.app/produtos" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Vitaminas e Suplementos Naturais",
          description:
            "Catálogo de vitaminas e suplementos naturais em cápsulas da Opção Natural.",
          url: "https://opcaonaturalofc.lovable.app/produtos",
          isPartOf: {
            "@type": "WebSite",
            name: "Opção Natural",
            url: "https://opcaonaturalofc.lovable.app",
          },
        }),
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { data: products, isLoading } = useQuery(productsQuery);
  const { addToCart, getVariant, isLoading: cartLoading } = useAddToCart();
  const checkoutUrl = useCartStore((s) => s.checkoutUrl);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");

  async function buy(p: Product, now: boolean) {
    const ok = await addToCart(p.slug, p.name);
    if (!ok) return;
    if (now) {
      const url = useCartStore.getState().getCheckoutUrl() ?? checkoutUrl;
      if (url) window.open(url, "_blank");
    } else {
      toast.success(`${p.name} adicionado ao carrinho`);
    }
  }

  const active = (products ?? []).filter((p) => p.is_active);
  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const result = active.filter((p) =>
      [p.name, p.subtitle, p.description, ...p.benefits]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("pt-BR").includes(term)),
    );
    return [...result].sort((a, b) => {
      if (sort === "price-asc") return (a.price ?? Infinity) - (b.price ?? Infinity);
      if (sort === "price-desc") return (b.price ?? -Infinity) - (a.price ?? -Infinity);
      if (sort === "name") return a.name.localeCompare(b.name, "pt-BR");
      return a.sort_order - b.sort_order;
    });
  }, [active, search, sort]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:py-16">
      <div className="max-w-2xl">
        <p className="eyebrow">Catálogo Opção Natural</p>
        <h1 className="mt-3 text-4xl md:text-5xl">Encontre o produto que combina com sua rotina.</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Informações claras, compra simples e uma seleção feita com cuidado.
        </p>
      </div>

      <div className="catalog-toolbar mt-9">
        <label className="catalog-search">
          <Search className="size-4" aria-hidden="true" />
          <span className="sr-only">Buscar produtos</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou benefício"
          />
        </label>
        <label className="catalog-sort">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          <span className="sr-only">Ordenar produtos</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="featured">Mais relevantes</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="name">Nome A–Z</option>
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-display text-xl">Nenhum produto encontrado</p>
          <button className="mt-2 text-sm text-accent hover:underline" onClick={() => setSearch("")}>Limpar busca</button>
        </div>
      ) : (
        <>
        <p className="mt-8 text-sm text-muted-foreground">{visible.length} {visible.length === 1 ? "produto" : "produtos"}</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => {
            const { variant } = getVariant(p.slug, p.name);
            const price = variant ? Number(variant.price.amount) : (p.price ?? 0);
            const available = Boolean(variant?.availableForSale ?? p.in_stock);
            return (
              <article key={p.id} className="product-card flex flex-col">
                <Link to="/produtos/$slug" params={{ slug: p.slug }} className="group">
                  <div className="product-card-media">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={`Pote de ${p.name} — suplemento natural em cápsulas`}
                      loading="lazy"
                      className="h-56 w-full object-contain p-5 transition-transform duration-500 group-hover:scale-[1.06]"
                    />
                  ) : (
                    <div
                      className="h-56"
                      style={{
                        background: `linear-gradient(160deg, ${p.jar_color}, ${p.lid_color})`,
                      }}
                    />
                  )}
                  <span className="product-card-open"><ArrowUpRight className="size-4" /></span>
                  </div>
                  <div className="px-5 pt-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{p.capsule_count} cápsulas</p>
                    <h2 className="mt-1 text-2xl">{p.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{p.subtitle}</p>
                  </div>
                </Link>
                <p className="mx-5 mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                <div className="mx-5 mt-5 flex items-center justify-between border-t border-border/70 pt-4">
                  <span className="text-lg font-medium text-accent">{formatMoney(price)}</span>
                  <span className={`stock-dot ${available ? "is-available" : ""}`}>{available ? "Em estoque" : "Esgotado"}</span>
                </div>
                <div className="mt-4 flex gap-2 px-5 pb-5">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={!available || cartLoading}
                    onClick={() => buy(p, false)}
                  >
                    {cartLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ShoppingBag className="size-4" />
                    )}
                    Adicionar
                  </Button>
                  <Button className="flex-1" disabled={!available || cartLoading} onClick={() => buy(p, true)}>
                    Comprar
                  </Button>
                </div>
                {!available ? (
                  <p className="mt-2 text-center text-xs text-muted-foreground">Esgotado</p>
                ) : null}
              </article>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}
