import { Link } from "@tanstack/react-router";
import { useAddToCart } from "@/hooks/useAddToCart";
import { formatMoney } from "@/lib/money";
import { productPhoto, type Product } from "@/lib/products";
import { landing } from "@/lib/landing-copy";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { PhotoSpotlight } from "@/components/PhotoSpotlight";

export function LandingHero({ product }: { product: Product | undefined }) {
  const { getVariant } = useAddToCart();
  const variant = product ? getVariant(product.slug, product.name).variant : undefined;
  const price = variant ? Number(variant.price.amount) : (product?.price ?? null);
  const buyable = Boolean(variant?.availableForSale);
  const benefits = (product?.benefits ?? []).slice(0, 2);

  return (
    <section className="grain-bg border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center md:py-16">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-primary">Opção Natural · Suplementos em cápsulas</p>
          <h1 className="text-display mt-3 max-w-[20ch] text-[1.9rem] leading-[1.1] sm:text-[2.6rem] md:text-[3.1rem]">
            {landing.hero.title}
          </h1>
          <p className="mt-5 max-w-[44ch] text-base leading-relaxed text-muted-foreground sm:text-lg">{landing.hero.text}</p>
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
          <ul className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
            {landing.hero.highlights.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          {product ? (
            <Link
              to="/produtos/$slug"
              params={{ slug: product.slug }}
              className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Ver ${product.name}`}
            >
              <PhotoSpotlight
                src={productPhoto(product)}
                alt={`Embalagem de ${product.name}, Opção Natural`}
                className="h-[280px] rounded-2xl sm:h-[360px]"
                imgClassName="p-6 sm:p-8"
              />
            </Link>
          ) : (
            <div className="h-[280px] animate-pulse rounded-2xl bg-muted sm:h-[360px]" aria-hidden />
          )}
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
          ) : null}
        </div>
      </div>
    </section>
  );
}
