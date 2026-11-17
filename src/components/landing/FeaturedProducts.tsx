import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageCircle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useAddToCart } from "@/hooks/useAddToCart";
import { formatPrice, productPhoto, productsQuery } from "@/lib/products";
import { whatsappLink } from "@/lib/site";
import { Button } from "@/components/ui/button";

export function FeaturedProducts() {
  const { data: products, isLoading, isError } = useQuery({ ...productsQuery, retry: 1 });
  const { addToCart, isLoading: cartLoading } = useAddToCart();
  const list = (products ?? []).filter((product) => product.is_active).slice(0, 4);

  async function buy(slug: string, name: string) {
    if (await addToCart(slug, name)) toast.success(`${name} adicionado ao carrinho`);
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
        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="surface-card flex flex-col p-4">
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
              Fale com a loja
            </a>
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {list.map((product) => {
            const available = (product.stock_quantity ?? 0) > 0 && product.price !== null;
            return (
              <article
                key={product.id}
                className="lift-card surface-card flex min-w-0 flex-col p-4"
              >
                <Link to="/produtos/$slug" params={{ slug: product.slug }} className="block">
                  <img
                    src={productPhoto(product)}
                    alt={`Embalagem de ${product.name}`}
                    loading="lazy"
                    width={400}
                    height={400}
                    className="aspect-square w-full rounded-xl bg-sand object-contain p-4 sm:p-5"
                  />
                  <h3 className="mt-3 text-base leading-snug">{product.name}</h3>
                </Link>
                {product.price !== null ? (
                  <p className="mt-1 text-lg text-accent">{formatPrice(product.price)}</p>
                ) : null}
                <Button
                  className="mt-auto min-h-11 w-full"
                  disabled={!available || cartLoading}
                  onClick={() => buy(product.slug, product.name)}
                >
                  {cartLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ShoppingBag className="size-4" />
                  )}
                  {available ? "Comprar" : "Indisponível"}
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
