import { ArrowRight } from "lucide-react";
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

  return (
    <section className="overflow-hidden border-b border-border bg-sand">
      <div className="mx-auto grid max-w-6xl gap-7 px-5 py-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center md:gap-14 md:py-16">
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary">Opção Natural</p>
          <h1 className="text-display mt-3 max-w-[20ch] text-[2.2rem] leading-[1.04] sm:text-[3rem] lg:text-[4.15rem]">
            Suplementos em cápsulas para o seu dia a dia
          </h1>
          <p className="mt-5 max-w-[44ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            Compare os produtos por preço e quantidade de cápsulas, ou escolha um kit pronto.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild className="min-h-11">
              <Link
                to="/produtos"
                onClick={() => track({ name: "click_hero_cta", cta: "primary" })}
              >
                Ver produtos <ArrowRight aria-hidden />
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

        <div className="rounded-[1.75rem] bg-primary p-3 sm:p-4">
          {product ? (
            <Link
              to="/produtos/$slug"
              params={{ slug: product.slug }}
              className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Ver ${product.name}`}
            >
              <PhotoSpotlight
                priority
                src={productPhoto(product)}
                alt={`Embalagem de ${product.name}, Opção Natural`}
                className="h-[250px] rounded-[1.25rem] sm:h-[380px]"
                imgClassName="p-6 sm:p-8"
              />
            </Link>
          ) : (
            <Link
              to="/produtos"
              aria-label="Explorar os suplementos do catálogo"
              className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <PhotoSpotlight
                priority
                src="/produtos/ginseng.jpg"
                alt="Embalagem de ginseng da Opção Natural"
                className="h-[250px] rounded-[1.25rem] sm:h-[380px]"
                imgClassName="p-6 sm:p-8"
              />
            </Link>
          )}
          {product ? (
            <div className="flex flex-wrap items-center justify-between gap-3 px-3 pb-1 pt-4 text-primary-foreground">
              <div>
                <p className="text-display text-xl leading-tight">{product.name}</p>
                <p className="mt-1 font-medium">
                  {price != null ? formatMoney(price) : null}
                  <span className="ml-2 text-sm text-primary-foreground/80">
                    {product.capsule_count} cápsulas
                  </span>
                </p>
              </div>
              <Button asChild variant="secondary" className="min-h-11">
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
