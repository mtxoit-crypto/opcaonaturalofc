import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronLeft, ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { productQuery, productsQuery, productPhoto } from "@/lib/products";
import { productMediaQuery } from "@/lib/media";
import { useAddToCart } from "@/hooks/useAddToCart";
import { formatMoney } from "@/lib/shopify";
import { JarViewer } from "@/components/JarViewer";
import { ModelViewer } from "@/components/ModelViewer";
import { ProductReviews } from "@/components/ProductReviews";
import { ShippingCalculator } from "@/components/ShippingCalculator";
import { Button } from "@/components/ui/button";
import { PhotoSpotlight } from "@/components/PhotoSpotlight";

export const Route = createFileRoute("/produtos/$slug")({
  loader: async ({ context, params }) =>
    context.queryClient.ensureQueryData(productQuery(params.slug)),
  head: ({ params, loaderData }) => {
    const p = loaderData ?? null;
    const url = `https://opcaonaturalofc.lovable.app/produtos/${params.slug}`;
    const name = p?.name ?? params.slug.replace(/-/g, " ");
    const description =
      p?.description ??
      p?.subtitle ??
      "Veja este suplemento natural em 3D: gire o pote, abra a tampa e compre com cartão, Pix ou boleto, com entrega em todo o Brasil.";

    return {
      meta: [
        { title: `${name} · Opção Natural` },
        { name: "description", content: description },
        { property: "og:title", content: `Opção Natural · ${name}` },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        ...(p?.image_url?.startsWith("https://")
          ? [
              { property: "og:image", content: p.image_url },
              { name: "twitter:image", content: p.image_url },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: p
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Product",
                name: p.name,
                description,
                ...(p.image_url ? { image: p.image_url } : {}),
                brand: { "@type": "Brand", name: "Opção Natural" },
                url,
                ...(p.price != null
                  ? {
                      offers: {
                        "@type": "Offer",
                        price: p.price,
                        priceCurrency: "BRL",
                        availability: p.in_stock
                          ? "https://schema.org/InStock"
                          : "https://schema.org/OutOfStock",
                        url,
                      },
                    }
                  : {}),
              }),
            },
          ]
        : [],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { data: product, isLoading } = useQuery(productQuery(slug));
  const { data: catalog } = useQuery(productsQuery);
  const mediaId =
    product?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(product.id) ? product.id : undefined;
  const { data: media } = useQuery(productMediaQuery(mediaId));
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
  const related = (catalog ?? []).filter((x) => x.is_active && x.slug !== p.slug).slice(0, 4);
  const photo = productPhoto(p);

  async function buy(now: boolean) {
    const ok = await addToCart(p.slug, p.name);
    if (!ok) return;
    if (now) {
      navigate({ to: "/checkout" });
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
          {photo ? (
            <PhotoSpotlight
              src={photo}
              alt={`Pote de ${p.name}, suplemento natural em cápsulas`}
              className="min-h-[240px] w-full"
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
              subtitle={p.subtitle ?? undefined}
              imageUrl={p.image_url ?? undefined}
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
            {Array.isArray(p.benefits)
              ? p.benefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 text-accent" />
                <span>{b}</span>
              </li>
                ))
              : null}
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

      {mediaId ? <ProductReviews productId={mediaId} /> : null}
      {related.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-2xl">Você também pode gostar</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <Link
                key={r.id}
                to="/produtos/$slug"
                params={{ slug: r.slug }}
                className="lift-card surface-card block p-4"
              >
                <PhotoSpotlight
                  src={productPhoto(r)}
                  alt={r.name}
                  className="h-28 rounded-xl"
                  imgClassName="h-28 p-2"
                />
                <p className="mt-3 font-medium">{r.name}</p>
                <p className="text-sm text-accent">{formatMoney(r.price ?? 0)}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <p className="min-w-0 flex-1 truncate text-sm">
            <span className="font-medium">{p.name}</span>
            <span className="ml-2 text-accent">{formatMoney(price)}</span>
          </p>
          <Button size="sm" disabled={!available || cartLoading} onClick={() => buy(true)}>
            Comprar
          </Button>
        </div>
      </div>
      <div className="h-16 md:hidden" />
    </div>
  );
}
