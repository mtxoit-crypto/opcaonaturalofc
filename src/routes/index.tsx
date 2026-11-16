import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
          "Compre suplementos naturais em cápsulas e kits com preço claro, estoque atualizado e entrega para todo o Brasil. Pagamento seguro no checkout da Shopify.",
      },
      {
        property: "og:title",
        content: "Opção Natural | Suplementos naturais para energia, vitalidade e bem-estar",
      },
      {
        property: "og:description",
        content:
          "Cápsulas e kits com preço e estoque claros. Entrega nacional e pagamento seguro pela Shopify.",
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
  const featured = (products ?? []).find((p) => p.is_active);

  useEffect(() => {
    track({ name: "view_home" });
  }, []);

  return (
    <div>
      <LandingHero product={featured} />
      <TrustBar />
      <FeaturedProducts />
      <ObjectivePicker products={products} />
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
