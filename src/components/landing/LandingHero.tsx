import { Link } from "@tanstack/react-router";
import { useAddToCart } from "@/hooks/useAddToCart";
import { formatMoney } from "@/lib/shopify";
import { productPhoto, type Product } from "@/lib/products";
import { landing } from "@/lib/landing-copy";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { PhotoSpotlight } from "@/components/PhotoSpotlight";
import { ProgressiveJar } from "@/components/landing/ProgressiveJar";

export function LandingHero({ product }: { product: Product | undefined }) {
  const { getVariant } = useAddToCart();
  const variant = product ? getVariant(product.slug, product.name).variant : undefined;
  const price = variant ? Number(variant.price.amount) : (product?.price ?? null);
  const available = Boolean(variant?.availableForSale ?? product?.in_stock);
  const benefits = (product?.benefits ?? []).slice(0, 2);

  return (
    <section className="grain-bg border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-[1.15fr_0.85fr] md:items-center md:py-14">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{landing.hero.eyebrow}</p>
          <h1 className="text-display mt-3 max-w-[18ch] text-[1.85rem] leading-[1.12] sm:text-4xl md:text-[2.6rem]">
            {landing.hero.title}
          </h1>
          <p className="mt-4 max-w-[42ch] text-muted-foreground">{landing.hero.text}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/produtos" onClick={() => track({ name: "click_hero_cta", cta: "primary" })}>
                {landing.hero.primary}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href="#historia" onClick={() => track({ name: "click_hero_cta", cta: "secondary" })}>
                {landing.hero.secondary}
              </a>
            </Button>
          </div>

          {product ? (
            <article className="mt-8 surface-card max-w-md p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Do catálogo</p>
              <div className="mt-3 flex gap-4">
                <PhotoSpotlight
                  src={productPhoto(product)}
                  alt={`Pote de ${product.name}, suplemento natural em cápsulas`}
                  className="h-24 w-24 shrink-0 rounded-xl"
                  imgClassName="h-24 p-1.5"
                />
                <div className="min-w-0">
                  <h2 className="text-lg leading-tight">{product.name}</h2>
                  {price != null ? (
                    <p className="mt-1 text-accent">{formatMoney(price)}</p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">{product.capsule_count} cápsulas</p>
                  {benefits.length ? (
                    <ul className="mt-2 text-sm text-muted-foreground">
                      {benefits.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  ) : null}
                  <Button asChild variant="link" className="mt-1 h-auto p-0">
                    <Link to="/produtos/$slug" params={{ slug: product.slug }}>
                      {available ? "Ver e comprar" : "Ver detalhes"}
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ) : (
            <p className="mt-8 text-sm text-muted-foreground">Catálogo em atualização.</p>
          )}
        </div>

        <div className="order-first md:order-last">
          <ProgressiveJar product={product} />
        </div>
      </div>
    </section>
  );
}
