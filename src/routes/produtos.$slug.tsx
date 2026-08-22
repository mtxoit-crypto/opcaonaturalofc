import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ShoppingBag, Loader2 } from "lucide-react";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { reviewsQuery, averageRating } from "@/lib/reviews";
import { track } from "@/lib/analytics";
import { absoluteUrl, SITE_ORIGIN } from "@/lib/site";

export const Route = createFileRoute("/produtos/$slug")({
  loader: async ({ context, params }) =>
    context.queryClient.ensureQueryData(productQuery(params.slug)),
  head: ({ params, loaderData }) => {
    const p = loaderData ?? null;
    const url = absoluteUrl(`/produtos/${params.slug}`);
    const photo = p ? productPhoto(p) : "";
    const image = photo.startsWith("http") ? photo : absoluteUrl(photo);
    const name = p?.name ?? params.slug.replace(/-/g, " ");
    const description =
      p?.description ??
      p?.subtitle ??
      "Veja este suplemento natural em 3D: gire o pote, abra a tampa e compre no checkout seguro da Shopify, com entrega em todo o Brasil.";

    return {
      meta: [
        { title: `${name} · Opção Natural` },
        { name: "description", content: description },
        { property: "og:title", content: `Opção Natural · ${name}` },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: p
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify([
                {
                "@context": "https://schema.org",
                "@type": "Product",
                name: p.name,
                description,
                ...(image ? { image } : {}),
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
                },
                {
                  "@context": "https://schema.org",
                  "@type": "BreadcrumbList",
                  itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Início", item: SITE_ORIGIN },
                    { "@type": "ListItem", position: 2, name: "Produtos", item: absoluteUrl("/produtos") },
                    { "@type": "ListItem", position: 3, name: p.name, item: url },
                  ],
                },
              ]),
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
  const { data: reviews } = useQuery(reviewsQuery(mediaId));

  useEffect(() => {
    track({ name: "view_product", slug });
  }, [slug]);

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
  const related = (catalog ?? []).filter((x) => x.is_active && x.slug !== p.slug).slice(0, 4);
  const photo = productPhoto(p);
  const avg = averageRating(reviews);
  const buyable = Boolean(variant?.availableForSale);

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
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link to="/" className="hover:text-foreground">
              Início
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link to="/produtos" className="hover:text-foreground">
              Produtos
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-foreground">{p.name}</li>
        </ol>
      </nav>

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
          {avg != null ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Avaliação média {avg.toFixed(1)} de 5
              {reviews?.length ? ` · ${reviews.length} avaliações` : ""}
            </p>
          ) : null}
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
            {p.dosage ? (
            <div className="surface-card p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Modo de uso</dt>
              <dd className="mt-1 text-lg">{p.dosage}</dd>
            </div>
            ) : null}
          </dl>

          <p className="mt-8 text-3xl text-accent">{formatMoney(price)}</p>
          <p className="text-sm font-medium">{buyable ? "Disponível" : "Esgotado"}</p>
          <p className="text-sm text-muted-foreground">
            Pagamento somente no checkout seguro da Shopify. Frete confirmado no checkout.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button size="lg" variant="outline" className="min-h-11" disabled={!buyable || cartLoading} onClick={() => buy(false)}>
              {cartLoading ? <Loader2 className="size-4 animate-spin" /> : <ShoppingBag className="size-4" />}
              Adicionar ao carrinho
            </Button>
            <Button size="lg" className="min-h-11" disabled={!buyable || cartLoading} onClick={() => buy(true)}>
              Comprar agora
            </Button>
          </div>
          {!buyable ? (
            <p className="mt-3 text-sm text-muted-foreground">Produto temporariamente esgotado.</p>
          ) : null}

          <div className="mt-8">
            <ShippingCalculator />
          </div>
          <Accordion type="single" collapsible className="mt-8">
            <AccordionItem value="pagamento">
              <AccordionTrigger>Formas de pagamento e troca</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                <p>O pagamento acontece no checkout da Shopify.</p>
                <p>
                  <Link to="/trocas" className="underline-offset-4 hover:underline">
                    Trocas e devoluções
                  </Link>
                  {" · "}
                  <Link to="/entrega" className="underline-offset-4 hover:underline">
                    Política de entrega
                  </Link>
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
          <Button size="sm" className="min-h-11" disabled={!buyable || cartLoading} onClick={() => buy(true)}>
            Comprar
          </Button>
        </div>
      </div>
      <div className="h-16 md:hidden" />
    </div>
  );
}
