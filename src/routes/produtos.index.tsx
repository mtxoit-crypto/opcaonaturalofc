import { useMemo, useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { productsQuery, productPhoto, type Product } from "@/lib/products";
import { useAddToCart } from "@/hooks/useAddToCart";
import { formatMoney } from "@/lib/shopify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PhotoSpotlight } from "@/components/PhotoSpotlight";

type SortKey = "relevancia" | "menor-preco" | "maior-preco" | "nome";

const SORT_LABEL: Record<SortKey, string> = {
  relevancia: "Relevância",
  "menor-preco": "Menor preço",
  "maior-preco": "Maior preço",
  nome: "Nome (A–Z)",
};

export const Route = createFileRoute("/produtos/")({
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search["q"] === "string" ? { q: search["q"] } : {},
  head: () => ({
    meta: [
      { title: "Catálogo de suplementos naturais | Opção Natural" },
      {
        name: "description",
        content:
          "Veja o catálogo Opção Natural: cápsulas e kits com preço claro, estoque atualizado e pagamento seguro no checkout da Shopify.",
      },
      { property: "og:title", content: "Catálogo de suplementos naturais | Opção Natural" },
      {
        property: "og:description",
        content: "Cápsulas e kits com preço e estoque claros. Checkout seguro pela Shopify.",
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
  const navigate = useNavigate();
  const { q: qParam } = Route.useSearch();
  const { data: products, isLoading } = useQuery(productsQuery);
  const { addToCart, getVariant, isLoading: cartLoading } = useAddToCart();

  const [query, setQuery] = useState(qParam ?? "");
  const [sort, setSort] = useState<SortKey>("relevancia");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (qParam) setQuery(qParam);
  }, [qParam]);

  async function buy(p: Product, now: boolean) {
    const ok = await addToCart(p.slug, p.name);
    if (!ok) return;
    if (now) {
      navigate({ to: "/checkout" });
    } else {
      toast.success(`${p.name} adicionado ao carrinho`);
    }
  }

  const active = useMemo(() => (products ?? []).filter((p) => p.is_active), [products]);

  const priceOf = (p: Product) => {
    const { variant } = getVariant(p.slug, p.name);
    return variant ? Number(variant.price.amount) : (p.price ?? 0);
  };
  const availabilityOf = (p: Product) => {
    const { variant } = getVariant(p.slug, p.name);
    return Boolean(variant?.availableForSale ?? p.in_stock);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = active.filter((p) => {
      if (onlyInStock && !availabilityOf(p)) return false;
      if (!q) return true;
      const haystack = [p.name, p.subtitle, p.description, ...(p.benefits ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    list = [...list].sort((a, b) => {
      if (sort === "menor-preco") return priceOf(a) - priceOf(b);
      if (sort === "maior-preco") return priceOf(b) - priceOf(a);
      if (sort === "nome") return a.name.localeCompare(b.name, "pt-BR");
      return a.sort_order - b.sort_order;
    });

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, query, sort, onlyInStock, products]);

  const hasFilters = query.trim().length > 0 || onlyInStock || sort !== "relevancia";

  function clearFilters() {
    setQuery("");
    setSort("relevancia");
    setOnlyInStock(false);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="text-4xl">Vitaminas e Suplementos Naturais</h1>
      <p className="mt-2 max-w-lg text-muted-foreground">
        Escolha seu suplemento, adicione ao carrinho e finalize no checkout seguro da Shopify.
      </p>

      {/* Barra de busca e filtros */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, benefício…"
            className="h-11 rounded-full pl-10 pr-9"
            aria-label="Buscar produtos"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm transition-colors hover:bg-secondary sm:hidden"
            aria-expanded={filtersOpen}
          >
            <SlidersHorizontal className="size-4" />
            Filtros
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            <label htmlFor="sort" className="sr-only">
              Ordenar
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-11 rounded-full border border-border bg-card px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              {(Object.keys(SORT_LABEL) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABEL[key]}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setOnlyInStock((v) => !v)}
              aria-pressed={onlyInStock}
              className={`h-11 rounded-full border px-4 text-sm transition-colors ${
                onlyInStock
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-secondary"
              }`}
            >
              Em estoque
            </button>
          </div>
        </div>
      </div>

      {/* Filtros em mobile */}
      {filtersOpen ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 sm:hidden">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-10 flex-1 rounded-full border border-border bg-card px-4 text-sm text-foreground outline-none"
          >
            {(Object.keys(SORT_LABEL) as SortKey[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABEL[key]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setOnlyInStock((v) => !v)}
            aria-pressed={onlyInStock}
            className={`h-10 rounded-full border px-4 text-sm transition-colors ${
              onlyInStock
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-card"
            }`}
          >
            Em estoque
          </button>
        </div>
      ) : null}

      {/* Resumo de resultados */}
      {!isLoading ? (
        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filtered.length} {filtered.length === 1 ? "produto" : "produtos"}
            {query ? (
              <>
                {" "}
                para “<span className="text-foreground">{query}</span>”
              </>
            ) : null}
          </span>
          {hasFilters ? (
            <button type="button" onClick={clearFilters} className="text-accent hover:underline">
              Limpar filtros
            </button>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-lg">Nenhum produto encontrado.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tente outro termo de busca ou remova os filtros aplicados.
          </p>
          {hasFilters ? (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Limpar filtros
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const { variant } = getVariant(p.slug, p.name);
            const price = variant ? Number(variant.price.amount) : (p.price ?? 0);
            const available = Boolean(variant?.availableForSale ?? p.in_stock);
            const topBenefits = (p.benefits ?? []).slice(0, 2);
            return (
              <article
                key={p.id}
                className="lift-card surface-card group/card relative flex flex-col p-6"
              >
                {!available ? (
                  <Badge
                    variant="secondary"
                    className="absolute right-5 top-5 z-10 bg-card/90 text-muted-foreground"
                  >
                    Esgotado
                  </Badge>
                ) : null}
                <Link to="/produtos/$slug" params={{ slug: p.slug }} className="group">
                  <PhotoSpotlight
                    src={productPhoto(p)}
                    alt={`Pote de ${p.name}, suplemento natural Opção Natural em cápsulas`}
                    className="h-44 rounded-xl transition-transform duration-300 group-hover/card:scale-[1.03]"
                    imgClassName="h-44 p-2"
                  />
                  <h2 className="mt-5 text-2xl">{p.name}</h2>
                  <p className="text-sm text-muted-foreground">{p.subtitle}</p>
                </Link>

                {topBenefits.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {topBenefits.map((b) => (
                      <span
                        key={b}
                        className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                    {p.description}
                  </p>
                )}

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-lg font-medium text-accent">{formatMoney(price)}</span>
                  <span className="text-xs text-muted-foreground">{p.capsule_count} cápsulas</span>
                </div>
                <div className="mt-4 flex gap-2">
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
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
