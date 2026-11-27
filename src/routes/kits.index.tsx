import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { kitsQuery, type Kit } from "@/lib/kits";
import { formatPrice, productPhoto } from "@/lib/products";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { PhotoSpotlight } from "@/components/PhotoSpotlight";

export const Route = createFileRoute("/kits/")({
  head: () => ({
    meta: [
      { title: "Kits · Opção Natural suplementos naturais" },
      {
        name: "description",
        content:
          "Conheça os kits Raízes e Sementes, Seleção Botânica e Fibras e Plantas da Opção Natural.",
      },
      { property: "og:title", content: "Kits · Opção Natural" },
      {
        property: "og:description",
        content: "Combinações prontas de suplementos naturais em cápsulas, com entrega para todo o Brasil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KitsPage,
});

function KitsPage() {
  const { data: kits, isLoading } = useQuery(kitsQuery);
  const { items: cart, isLoading: cartLoading } = useCartStore();

  function canAdd(kit: Kit, current = cart) {
    const slugs = new Set(current.map((item) => item.slug));
    for (const { product, quantity } of kit.items) {
      if (!product?.is_active || product.price == null || product.price <= 0 ||
        !Number.isInteger(quantity) || quantity < 1) return false;
      const next = (current.find((item) => item.slug === product.slug)?.quantity ?? 0) + quantity;
      if (next > 99 || next > (product.stock_quantity ?? 0)) return false;
      slugs.add(product.slug);
    }
    return kit.items.length > 0 && slugs.size <= 10;
  }

  function addKit(kit: Kit) {
    const current = useCartStore.getState().items;
    if (!canAdd(kit, current)) {
      toast.error("Confira o estoque e o limite de 10 produtos diferentes por carrinho.");
      return;
    }
    const next = [...current];
    for (const { product, quantity } of kit.items) {
      if (!product) return;
      const index = next.findIndex((item) => item.slug === product.slug);
      const item = {
        slug: product.slug,
        title: product.name,
        image: productPhoto(product),
        price: { amount: String(product.price), currencyCode: "BRL" as const },
        quantity: (next[index]?.quantity ?? 0) + quantity,
      };
      if (index < 0) next.push(item);
      else next[index] = item;
    }
    useCartStore.setState({ items: next });
    toast.success(`${kit.name} adicionado ao carrinho`);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="text-4xl">Kits</h1>
      <p className="mt-2 max-w-lg text-muted-foreground">
        Combinações prontas de suplementos naturais para seguir sua rotina sem complicação.
      </p>

      {isLoading ? (
        <div className="mt-10 h-64 animate-pulse rounded-2xl bg-muted" />
      ) : !kits || kits.length === 0 ? (
        <p className="mt-10 text-muted-foreground">Nenhum kit disponível no momento.</p>
      ) : (
        <div className="mt-10 space-y-10">
          {kits.map((kit) => {
            const total = kit.items.reduce((sum, item) => sum + Math.round((item.product?.price ?? 0) * 100) * item.quantity, 0) / 100;
            return (
              <section key={kit.id} className="surface-card p-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="text-3xl">{kit.name}</h2>
                    <p className="text-sm text-muted-foreground">{kit.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl text-accent">{formatPrice(total)}</p>
                    <p className="text-xs text-muted-foreground">
                      {kit.products.length} produtos · {formatPrice(total)} avulso
                    </p>
                  </div>
                </div>
                <p className="mt-3 max-w-2xl text-muted-foreground">{kit.description}</p>
                {kit.image_url ? (
                  <PhotoSpotlight
                    src={kit.image_url}
                    alt={`${kit.name}: seleção de produtos`}
                    className="mt-6 h-56 rounded-2xl sm:h-72"
                    imgClassName="h-56 p-4 sm:h-72"
                  />
                ) : null}

                <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {kit.products.map((p) => (
                    <Link
                      key={p.id}
                      to="/produtos/$slug"
                      params={{ slug: p.slug }}
                      className="lift-card group rounded-xl bg-sand p-3"
                    >
                      {p.image_url || p.slug ? (
                        <PhotoSpotlight
                          src={productPhoto(p)}
                          alt={`Pote de ${p.name}, suplemento natural em cápsulas`}
                          className="h-40 rounded-lg"
                          imgClassName="h-40 p-3"
                        />
                      ) : null}
                      <p className="mt-2 text-center text-sm">{p.name}</p>
                      <p className="text-center text-xs text-muted-foreground">
                        {formatPrice(p.price)}
                      </p>
                    </Link>
                  ))}
                </div>

                <Button
                  className="mt-6"
                  size="lg"
                  disabled={cartLoading || !canAdd(kit)}
                  onClick={() => addKit(kit)}
                >
                  <ShoppingBag className="size-4" />
                  Adicionar kit ao carrinho
                </Button>
                {!canAdd(kit) ? (
                  <p className="mt-2 text-sm text-muted-foreground">Confira a disponibilidade dos itens e o limite de 10 produtos diferentes por carrinho.</p>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
