import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { kitsQuery } from "@/lib/kits";
import { Button } from "@/components/ui/button";
import { productsQuery } from "@/lib/products";
import { track } from "@/lib/analytics";
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE_ORIGIN } from "@/lib/site";
import { LandingHero } from "@/components/landing/LandingHero";
import { TrustBar } from "@/components/landing/TrustBar";
import { FeaturedProducts } from "@/components/landing/FeaturedProducts";
import { ObjectivePicker } from "@/components/landing/ObjectivePicker";
import { Differentials } from "@/components/landing/Differentials";
import { HomeReviews } from "@/components/landing/HomeReviews";
import { HomeFaq } from "@/components/landing/HomeFaq";
import { ClosingCta } from "@/components/landing/ClosingCta";
import { landing } from "@/lib/landing-copy";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Opção Natural | Suplementos naturais para energia, vitalidade e bem-estar",
      },
      {
        name: "description",
        content:
          "Compre suplementos naturais em cápsulas e kits com preço claro, estoque atualizado e entrega para todo o Brasil. Pagamento seguro processado pela Stripe.",
      },
      {
        property: "og:title",
        content: "Opção Natural | Suplementos naturais para energia, vitalidade e bem-estar",
      },
      {
        property: "og:description",
        content:
          "Cápsulas e kits com preço e estoque claros. Entrega nacional e pagamento seguro pela Stripe.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absoluteUrl("/") },
      { property: "og:image", content: DEFAULT_OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: DEFAULT_OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/") }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Opção Natural",
            url: SITE_ORIGIN,
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Opção Natural",
            url: SITE_ORIGIN,
            description: "Suplementos naturais em cápsulas, com envio para todo o Brasil.",
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: landing.faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]),
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: products } = useQuery(productsQuery);
  const featured = (products ?? []).find((p) => p.is_active && (p.stock_quantity ?? 0) > 0);
  const { data: kits } = useQuery(kitsQuery);
  const featuredKit = kits?.find((kit) => kit.image_url && kit.items.length > 0);

  useEffect(() => {
    track({ name: "view_home" });
  }, []);

  return (
    <div>
      <LandingHero product={featured} />
      <TrustBar />
      <FeaturedProducts />
      <ObjectivePicker products={products} />
      {featuredKit?.image_url ? (
        <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
          <div className="grid overflow-hidden rounded-3xl bg-primary text-primary-foreground md:grid-cols-2">
            <img
              src={featuredKit.image_url}
              alt={featuredKit.name}
              width={520}
              height={420}
              loading="lazy"
              decoding="async"
              className="h-64 w-full bg-sand object-contain md:h-full md:max-h-96"
            />
            <div className="flex flex-col items-start justify-center gap-4 p-7 sm:p-10">
              <h2 className="text-display text-3xl sm:text-4xl">{featuredKit.name}</h2>
              {featuredKit.description ? (
                <p className="text-sm leading-relaxed text-primary-foreground/90">
                  {featuredKit.description}
                </p>
              ) : null}
              <Button asChild variant="secondary" className="min-h-11">
                <Link to="/kits">Conhecer os kits</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}
      <Differentials />
      <HomeReviews />
      <HomeFaq />
      <ClosingCta />
      <p className="sr-only">
        <Link to="/produtos">Ir ao catálogo</Link>
      </p>
    </div>
  );
}
