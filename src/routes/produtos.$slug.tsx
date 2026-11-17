import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, MessageCircle, ShoppingBag, Loader2 } from "lucide-react";
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
import { storeSettingsQuery, whatsappHref } from "@/lib/store";

export const Route = createFileRoute("/produtos/$slug")({
  loader: async ({ context, params }) =>
    context.queryClient.ensureQueryData(productQuery(params.slug)),
  head: ({ params, loaderData }) => {
    const p = loaderData ?? null;
    const url = absoluteUrl(`/produtos/${params.slug}`);
    const photo = p ? productPhoto(p) : "";
    const image = photo.startsWith("http") ? photo : photo ? absoluteUrl(photo) : "";
    const name = p?.name ?? params.slug.replace(/-/g, " ");
    const capsuleBit = p?.capsule_count ? `${p.capsule_count} cápsulas. ` : "";
    const description =
      p?.description?.trim() ||
      p?.subtitle?.trim() ||
      `${name}: suplemento natural em cápsulas Opção Natural. ${capsuleBit}Preço e estoque no catálogo; pagamento seguro processado pela Stripe.`;
    const title = p?.name
      ? `${p.name} em cápsulas | Opção Natural`
      : `${name} | Opção Natural`;
    const canOffer = p != null && p.name && p.price != null;
    const productLd = canOffer
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description,
          ...(image ? { image } : {}),
          brand: { "@type": "Brand", name: "Opção Natural" },
          url,
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
      : null;

    return {
      meta: [
        { title },
        { name: "description", content: description.slice(0, 160) },
        { property: "og:title", content: title },
        { property: "og:description", content: description.slice(0, 200) },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: p
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify([
                ...(productLd ? [productLd] : []),
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

type MediaTab = "foto" | "modelo" | "video";

function ProductVideo({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="space-y-2">
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        aria-label={alt}
        onError={() => setHasError(true)}
        className="w-full rounded-xl bg-sand"
      />
      {hasError ? (
        <p className="text-sm text-muted-foreground" role="alert">
          Não foi possível reproduzir este vídeo.
        </p>
      ) : null}
    </div>
  );
}

function ProductPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [activeMediaTab, setActiveMediaTab] = useState<MediaTab>("foto");
  const loaded = Route.useLoaderData();
  const { data: product, isLoading } = useQuery({
    ...productQuery(slug),
    initialData: loaded ?? undefined,
  });
  const { data: catalog } = useQuery(productsQuery);
  const { data: store } = useQuery(storeSettingsQuery);
  const mediaId =
    product?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(product.id) ? product.id : undefined;
  const { data: media } = useQuery(productMediaQuery(mediaId));
  const { addToCart, getVariant, isLoading: cartLoading } = useAddToCart();
  const { data: reviews } = useQuery(reviewsQuery(mediaId));
  const model = (media ?? []).find((m) => m.media_type === "model");
  const videos = (media ?? []).filter((m) => m.media_type === "video");
  const modelUrl = model?.url ?? product?.model_url ?? null;

  useEffect(() => {
    setActiveMediaTab("foto");
  }, [slug]);

  useEffect(() => {
    if (
      (activeMediaTab === "modelo" && !modelUrl) ||
      (activeMediaTab === "video" && videos.length === 0)
    ) {
      setActiveMediaTab("foto");
    }
  }, [activeMediaTab, modelUrl, videos.length]);

  useEffect(() => {
    track({ name: "view_product", slug });
  }, [slug]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-20" aria-busy="true" aria-live="polite">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
          <div className="space-y-4">
            <div className="h-10 w-2/3 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded-md bg-muted" />
            <div className="mt-8 h-12 w-40 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
        <p className="sr-only">Carregando produto…</p>
      </div>
    );
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
  const photos = (media ?? []).filter((m) => m.media_type === "image");
  const { variant } = getVariant(p.slug, p.name);
  const price = variant ? Number(variant.price.amount) : (p.price ?? 0);
  const related = (catalog ?? []).filter((x) => x.is_active && x.slug !== p.slug).slice(0, 4);
  const photo = productPhoto(p);
  const galleryPhotos = photos.filter(
    (m) => m.url !== photo && !photo.includes(m.storage_path) && m.storage_path !== photo,
  );
  const avg = averageRating(reviews);
  const buyable = Boolean(variant?.availableForSale);
  const benefits = Array.isArray(p.benefits) ? p.benefits.filter((b) => b.trim()) : [];
  const waLink = whatsappHref(
    store?.whatsapp_number,
    `Olá! Tenho uma dúvida sobre ${p.name} na Opção Natural.`,
  );

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

      <div className="mt-6 grid items-start gap-10 md:grid-cols-2 md:gap-12">
        <div className="space-y-4">
          <div className="flex gap-1 rounded-full bg-muted/50 p-1" role="tablist" aria-label="Mídia do produto">
            {(
              [
                ["foto", "Foto", true],
                ["modelo", "3D", Boolean(modelUrl)],
                ["video", "Vídeo", videos.length > 0],
              ] as const
            ).map(([value, label, available]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={activeMediaTab === value}
                aria-controls={`product-media-${value}`}
                disabled={!available}
                onClick={() => setActiveMediaTab(value)}
                className={`flex-1 rounded-full px-3 py-2 text-sm transition-colors ${
                  activeMediaTab === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                } ${!available ? "cursor-not-allowed opacity-45" : "hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div id={`product-media-${activeMediaTab}`} role="tabpanel">
            {activeMediaTab === "foto" ? (
              <>
                {photo ? (
                  <PhotoSpotlight
                    src={photo}
                    alt={`Foto do pote de ${p.name}, suplemento natural Opção Natural em cápsulas`}
                    className="min-h-[320px] w-full sm:min-h-[420px]"
                    imgClassName="min-h-[320px] p-6 sm:min-h-[420px]"
                  />
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
                {galleryPhotos.length > 0 ? (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {galleryPhotos.map((m, index) => (
                      <img
                        key={m.id}
                        src={m.url}
                        alt={
                          m.alt?.trim() ||
                          `Foto adicional ${index + 1} do pote de ${p.name}`
                        }
                        loading="lazy"
                        className="w-full rounded-xl bg-sand object-cover"
                      />
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
            {activeMediaTab === "modelo" ? (
              modelUrl ? (
                <ModelViewer
                  url={modelUrl}
                  fallback={
                    <JarViewer
                      jarColor={p.jar_color}
                      lidColor={p.lid_color}
                      capsuleColor={p.capsule_color}
                      capsuleCount={p.capsule_count}
                      name={p.name}
                      dosage={p.dosage ?? undefined}
                      subtitle={p.subtitle ?? undefined}
                      imageUrl={photo || p.image_url || undefined}
                    />
                  }
                />
              ) : (
                <JarViewer
                  jarColor={p.jar_color}
                  lidColor={p.lid_color}
                  capsuleColor={p.capsule_color}
                  capsuleCount={p.capsule_count}
                  name={p.name}
                  dosage={p.dosage ?? undefined}
                  subtitle={p.subtitle ?? undefined}
                  imageUrl={photo || p.image_url || undefined}
                />
              )
            ) : null}
            {activeMediaTab === "video" ? (
              <div className="space-y-4">
                {videos.map((video, index) => (
                  <ProductVideo
                    key={video.id}
                    src={video.url}
                    alt={video.alt?.trim() || `Vídeo ${index + 1} de ${p.name}`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-8">
          <header>
            <h1 className="text-4xl leading-tight tracking-tight">{p.name}</h1>
            {avg != null ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Avaliação média {avg.toFixed(1)} de 5
                {reviews?.length ? ` · ${reviews.length} avaliações` : ""}
              </p>
            ) : null}
            {p.subtitle ? <p className="mt-2 text-muted-foreground">{p.subtitle}</p> : null}
            {p.description ? (
              <p className="mt-5 text-base leading-relaxed text-foreground/90">{p.description}</p>
            ) : null}
          </header>

          {benefits.length > 0 ? (
            <section aria-labelledby="product-benefits">
              <h2 id="product-benefits" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Benefícios cadastrados
              </h2>
              <ul className="mt-3 space-y-2">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="product-details" className="grid grid-cols-2 gap-3">
            <h2 id="product-details" className="sr-only">
              Quantidade e modo de uso
            </h2>
            <div className="surface-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Quantidade</p>
              <p className="mt-1 text-lg font-medium">{p.capsule_count} cápsulas</p>
            </div>
            {p.dosage ? (
              <div className="surface-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Modo de uso</p>
                <p className="mt-1 text-lg font-medium leading-snug">{p.dosage}</p>
              </div>
            ) : null}
          </section>

          <section aria-labelledby="product-care" className="rounded-xl border border-border/70 bg-sand/40 p-4">
            <h2 id="product-care" className="text-sm font-semibold">
              Cuidados
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Suplementos não substituem uma alimentação equilibrada nem o acompanhamento de um
              profissional de saúde. Em caso de dúvida sobre uso, fale conosco antes de comprar.
            </p>
          </section>

          <section aria-labelledby="product-buy" className="space-y-3 border-t border-border pt-6">
            <h2 id="product-buy" className="sr-only">
              Compra
            </h2>
            <p className="text-3xl font-semibold tracking-tight text-accent">{formatMoney(price)}</p>
            <p className={`text-sm font-medium ${buyable ? "text-foreground" : "text-muted-foreground"}`}>
              {buyable ? "Disponível" : "Esgotado"}
            </p>
            <p className="text-sm text-muted-foreground">
              Pagamento seguro processado pela Stripe. Frete calculado antes do pagamento.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                size="lg"
                variant="outline"
                className="min-h-11"
                disabled={!buyable || cartLoading}
                onClick={() => buy(false)}
              >
                {cartLoading ? <Loader2 className="size-4 animate-spin" /> : <ShoppingBag className="size-4" />}
                Adicionar ao carrinho
              </Button>
              <Button size="lg" className="min-h-11" disabled={!buyable || cartLoading} onClick={() => buy(true)}>
                Comprar agora
              </Button>
            </div>
            {!buyable ? (
              <p className="text-sm text-muted-foreground">Produto temporariamente esgotado.</p>
            ) : null}
          </section>

          <section aria-labelledby="product-shipping">
            <h2 id="product-shipping" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Entrega
            </h2>
            <div className="mt-3">
              <ShippingCalculator />
            </div>
          </section>

          {waLink ? (
            <aside className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-medium">Ainda está em dúvida? Fale com a gente no WhatsApp</p>
              <Button asChild variant="outline" className="mt-3 min-h-11">
                <a href={waLink} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" />
                  Conversar no WhatsApp
                </a>
              </Button>
            </aside>
          ) : null}

          <Accordion type="single" collapsible>
            <AccordionItem value="pagamento">
              <AccordionTrigger>Formas de pagamento e troca</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                <p>O pagamento acontece no checkout seguro da Stripe.</p>
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
                  alt={`Pote de ${r.name}, suplemento natural Opção Natural`}
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

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{p.name}</p>
            <p className="text-sm text-accent">{formatMoney(price)}</p>
          </div>
          <Button size="lg" className="min-h-11 shrink-0 px-5" disabled={!buyable || cartLoading} onClick={() => buy(true)}>
            {cartLoading ? <Loader2 className="size-4 animate-spin" /> : null}
            Comprar
          </Button>
        </div>
      </div>
      <div className="h-20 md:hidden" aria-hidden />
    </div>
  );
}
