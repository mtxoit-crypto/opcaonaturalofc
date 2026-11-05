import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageCircle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { firstVariant, formatMoney, shopifyProductsQuery, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { whatsappLink } from "@/lib/site";
import { Button } from "@/components/ui/button";

export function FeaturedProducts() {
  const { data, isLoading, isError } = useQuery(shopifyProductsQuery);
  const addItem = useCartStore((s) => s.addItem);
  const cartLoading = useCartStore((s) => s.isLoading);
  const list = (data ?? []).slice(0, 4);

  async function buy(p: ShopifyProduct) {
    const variant = firstVariant(p);
    if (!variant) return;
    await addItem({
      variantId: variant.id,
      title: p.node.title,
      handle: p.node.handle,
      image: p.node.images.edges[0]?.node.url ?? null,
      price: variant.price,
      quantity: 1,
    });
    toast.success(`${p.node.title} adicionado ao carrinho`);
  }

  return (
    <section id="produtos" className="mx-auto max-w-6xl px-5 py-14">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-display text-3xl">Produtos mais procurados</h2>
        <Link to="/produtos" className="text-sm text-accent underline-offset-4 hover:underline">
          Ver todos
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-5 grid-cols-2 lg:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="surface-card flex flex-col p-4">
              <div className="h-40 animate-pulse rounded-xl bg-muted" />
              <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-muted" />
              <div className="mt-4 h-11 animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
      ) : isError || list.length === 0 ? (
        <div className="mt-6 surface-card p-6">
          <p className="text-muted-foreground">Não conseguimos carregar os produtos agora.</p>
          <Button asChild className="mt-4 min-h-11">
            <a href={whatsappLink()} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" />
              Comprar pelo WhatsApp
            </a>
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 grid-cols-2 lg:grid-cols-4">
          {list.map((p) => {
            const variant = firstVariant(p);
            const img = p.node.images.edges[0]?.node;
            const buyable = Boolean(variant?.availableForSale);
            return (
              <article key={p.node.id} className="lift-card surface-card flex flex-col p-4">
                <Link to="/produtos/$slug" params={{ slug: p.node.handle }} className="block">
                  {img ? (
                    <img
                      src={img.url}
                      alt={img.altText ?? `Pote de ${p.node.title}`}
                      loading="lazy"
                      className="aspect-square w-full rounded-xl bg-sand object-contain p-4 sm:p-5"
                    />
                  ) : (
                    <div className="aspect-square rounded-xl bg-sand" />
                  )}
                  <h3 className="mt-3 text-base leading-snug">{p.node.title}</h3>
                </Link>
                <p className="mt-1 text-lg text-accent">
                  {formatMoney(variant?.price.amount ?? p.node.priceRange.minVariantPrice.amount)}
                </p>
                <Button
                  className="mt-auto min-h-11 w-full"
                  disabled={!buyable || cartLoading}
                  onClick={() => buy(p)}
                >
                  {cartLoading ? <Loader2 className="size-4 animate-spin" /> : <ShoppingBag className="size-4" />}
                  {buyable ? "Comprar" : "Esgotado"}
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
