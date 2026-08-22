import { Link } from "@tanstack/react-router";
import { Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useAddToCart } from "@/hooks/useAddToCart";
import { formatMoney } from "@/lib/shopify";
import { productPhoto, type Product } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { PhotoSpotlight } from "@/components/PhotoSpotlight";

export function FeaturedProducts({
  products,
  isLoading,
  isError,
}: {
  products: Product[] | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  const { addToCart, getVariant, isLoading: cartLoading } = useAddToCart();
  const list = (products ?? []).filter((p) => p.is_active).slice(0, 6);

  async function add(p: Product) {
    const ok = await addToCart(p.slug, p.name);
    if (ok) toast.success(`${p.name} adicionado ao carrinho`);
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
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-live="polite">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <p className="mt-6 text-muted-foreground">Não foi possível carregar o catálogo agora.</p>
      ) : list.length === 0 ? (
        <p className="mt-6 text-muted-foreground">Catálogo em atualização.</p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => {
            const { variant } = getVariant(p.slug, p.name);
            const price = variant ? Number(variant.price.amount) : (p.price ?? 0);
            const available = Boolean(variant?.availableForSale ?? p.in_stock);
            const buyable = Boolean(variant?.availableForSale);
            const benefit = (p.benefits ?? [])[0];
            return (
              <article key={p.id} className="lift-card surface-card flex flex-col p-5">
                <PhotoSpotlight
                  src={productPhoto(p)}
                  alt={`Pote de ${p.name}, suplemento natural em cápsulas`}
                  className="h-36 rounded-xl"
                  imgClassName="h-36 p-2"
                />
                <h3 className="mt-4 text-xl">{p.name}</h3>
                {benefit ? <p className="text-sm text-muted-foreground">{benefit}</p> : null}
                <p className="mt-2 text-sm text-muted-foreground">{p.capsule_count} cápsulas</p>
                <p className="mt-2 text-lg text-accent">{formatMoney(price)}</p>
                <p className="text-xs text-muted-foreground">{available ? "Disponível" : "Esgotado"}</p>
                <div className="mt-4 flex gap-2">
                  <Button asChild variant="outline" className="min-h-11 flex-1">
                    <Link to="/produtos/$slug" params={{ slug: p.slug }}>
                      Ver detalhes
                    </Link>
                  </Button>
                  <Button
                    className="min-h-11 flex-1"
                    disabled={!buyable || cartLoading}
                    onClick={() => add(p)}
                  >
                    {cartLoading ? <Loader2 className="size-4 animate-spin" /> : <ShoppingBag className="size-4" />}
                    Adicionar
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
