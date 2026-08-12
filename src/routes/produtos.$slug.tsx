import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronLeft, ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { productQuery } from "@/lib/products";
import { productMediaQuery } from "@/lib/media";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useCartStore } from "@/stores/cartStore";
import { formatMoney } from "@/lib/shopify";
import { JarViewer } from "@/components/JarViewer";
import { ModelViewer } from "@/components/ModelViewer";
import { ProductReviews } from "@/components/ProductReviews";
import { ShippingCalculator } from "@/components/ShippingCalculator";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/produtos/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} · Opção Natural` },
      {
        name: "description",
        content:
          "Veja este suplemento natural em 3D: gire o pote, abra a tampa e compre com cartão, Pix ou boleto, com entrega em todo o Brasil.",
      },
      { property: "og:title", content: `Opção Natural · ${params.slug.replace(/-/g, " ")}` },
      {
        property: "og:description",
        content: "Gire o pote em 3D, conheça os benefícios e finalize a compra com segurança.",
      },
      { property: "og:type", content: "product" },
      {
        property: "og:url",
        content: `https://natural-pot-showcase.lovable.app/produtos/${params.slug}`,
      },
    ],
    links: [
      {
        rel: "canonical",
        href: `https://natural-pot-showcase.lovable.app/produtos/${params.slug}`,
      },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useQuery(productQuery(slug));
  const { data: media } = useQuery(productMediaQuery(product?.id));
  const { addToCart, getVariant, isLoading: cartLoading } = useAddToCart();

  if (isLoading) {
    return <div className="mx-auto max-w-6xl px-5 py-20 text-muted-foreground">Carregando…</div>;
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-20">
        <h1 className="text-3xl">Produto não encontrado</h1>
        <Link to="/produtos" className="mt-4 inline-block text-accent hover:underline">
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  const p = product;
  const model = (media ?? []).find((m) => m.media_type === "model");
  const gallery = (media ?? []).filter((m) => m.media_type !== "model");
  const { variant } = getVariant(p.slug, p.name);
  const price = variant ? Number(variant.price.amount) : (p.price ?? 0);
  const available = Boolean(variant?.availableForSale ?? p.in_stock);

  async function buy(now: boolean) {
    const ok = await addToCart(p.slug, p.name);
    if (!ok) return;
    if (now) {
      const url = useCartStore.getState().getCheckoutUrl();
      if (url) window.open(url, "_blank");
    } else {
      toast.success(`${p.name} adicionado ao carrinho`);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <Link
        to="/produtos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Produtos
      </Link>

      <div className="mt-6 grid items-start gap-12 md:grid-cols-2">
        <div className="space-y-4">
          {p.image_url ? (
            <img
              src={p.image_url}
              alt={`Pote de ${p.name} — suplemento natural em cápsulas`}
              className="w-full rounded-2xl bg-sand object-contain p-4"
            />
          ) : null}
          {model ? (
            <ModelViewer url={model.url} />
          ) : (
            <JarViewer
              jarColor={p.jar_color}
              lidColor={p.lid_color}
              capsuleColor={p.capsule_color}
              capsuleCount={p.capsule_count}
              name={p.name}
              dosage={p.dosage ?? undefined}
            />
          )}
          {gallery.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {gallery.map((m) =>
                m.media_type === "video" ? (
                  <video
                    key={m.id}
                    src={m.url}
                    controls
                    playsInline
                    className="w-full rounded-xl bg-sand"
                  />
                ) : (
                  <img
                    key={m.id}
                    src={m.url}
                    alt={m.alt ?? p.name}
                    loading="lazy"
                    className="w-full rounded-xl bg-sand object-cover"
                  />
                ),
              )}
            </div>
          ) : null}
        </div>

        <div>
          <h1 className="text-4xl">{p.name}</h1>
          <p className="mt-1 text-muted-foreground">{p.subtitle}</p>
          <p className="mt-6 text-lg leading-relaxed">{p.description}</p>

          <ul className="mt-6 space-y-2">
            {p.benefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 text-accent" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-8 grid grid-cols-2 gap-4">
            <div className="surface-card p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Conteúdo</dt>
              <dd className="mt-1 text-lg">{p.capsule_count} cápsulas</dd>
            </div>
            <div className="surface-card p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Dosagem</dt>
              <dd className="mt-1 text-lg">{p.dosage ?? "—"}</dd>
            </div>
          </dl>

          <p className="mt-8 text-3xl text-accent">{formatMoney(price)}</p>
          <p className="text-sm text-muted-foreground">
            Cartão de crédito, Pix ou boleto no checkout seguro
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button size="lg" variant="outline" disabled={!available || cartLoading} onClick={() => buy(false)}>
              {cartLoading ? <Loader2 className="size-4 animate-spin" /> : <ShoppingBag className="size-4" />}
              Adicionar ao carrinho
            </Button>
            <Button size="lg" disabled={!available || cartLoading} onClick={() => buy(true)}>
              Comprar agora
            </Button>
          </div>
          {!available ? (
            <p className="mt-3 text-sm text-muted-foreground">Produto temporariamente esgotado.</p>
          ) : null}

          <div className="mt-8">
            <ShippingCalculator />
          </div>
        </div>
      </div>

      <ProductReviews productId={p.id} />
    </div>
  );
}
