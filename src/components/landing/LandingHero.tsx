import { Link } from "@tanstack/react-router";
import { useAddToCart } from "@/hooks/useAddToCart";
import { formatMoney } from "@/lib/shopify";
import { type Product } from "@/lib/products";
import { landing } from "@/lib/landing-copy";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { ProgressiveJar } from "@/components/landing/ProgressiveJar";

export function LandingHero({ product }: { product: Product | undefined }) {
  const { getVariant } = useAddToCart();
  const variant = product ? getVariant(product.slug, product.name).variant : undefined;
  const price = variant ? Number(variant.price.amount) : (product?.price ?? null);
  const buyable = Boolean(variant?.availableForSale);
  const benefits = (product?.benefits ?? []).slice(0, 2);

  return (
    <section className="grain-bg border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center md:py-12">
        <div>
          <h1 className="text-display max-w-[16ch] text-[1.85rem] leading-[1.15] sm:text-4xl md:text-[2.55rem]">
            {landing.hero.title}
          </h1>
          <p className="mt-4 max-w-[38ch] text-muted-foreground">{landing.hero.text}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild className="min-h-11">
              <Link to="/produtos" onClick={() => track({ name: "click_hero_cta", cta: "primary" })}>
                {landing.hero.primary}
              </Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/kits" onClick={() => track({ name: "click_hero_cta", cta: "secondary" })}>
                {landing.hero.secondary}
              </Link>
            </Button>
          </div>
        </div>

        <div>
          <ProgressiveJar product={product} />
          {product ? (
            <div className="mt-4">
              <p className="text-display text-xl leading-tight">{product.name}</p>
              <p className="mt-1 text-accent">
                {price != null ? formatMoney(price) : null}
                <span className="ml-2 text-sm text-muted-foreground">{product.capsule_count} cápsulas</span>
              </p>
              {benefits.length ? (
                <p className="mt-1 text-sm text-muted-foreground">{benefits.join(" · ")}</p>
              ) : null}
              <Button asChild variant="link" className="mt-1 h-auto min-h-11 px-0">
                <Link to="/produtos/$slug" params={{ slug: product.slug }}>
                  {buyable ? "Ver e comprar" : "Ver detalhes"}
                </Link>
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Catálogo em atualização.</p>
          )}
        </div>
      </div>
    </section>
  );
}
