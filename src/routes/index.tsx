import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { productsQuery, formatPrice } from "@/lib/products";
import { JarViewer } from "@/components/JarViewer";
import { WordReveal } from "@/components/WordReveal";
import { BenefitCarousel } from "@/components/BenefitCarousel";
import { PhotoSpotlight } from "@/components/PhotoSpotlight";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Opção Natural · Vitaminas naturais com pote 3D interativo" },
      {
        name: "description",
        content:
          "Conheça nossas vitaminas naturais em cápsulas. Gire o pote em 3D, abra a tampa e veja as cápsulas por dentro.",
      },
      { property: "og:title", content: "Opção Natural · Vitaminas naturais com pote 3D interativo" },
      {
        property: "og:description",
        content: "Gire o pote em 3D, abra a tampa e conheça as cápsulas das nossas vitaminas.",
      },
      { property: "og:url", content: "https://opcaonaturalofc.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://opcaonaturalofc.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Opção Natural",
            url: "https://opcaonaturalofc.lovable.app",
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Opção Natural",
            url: "https://opcaonaturalofc.lovable.app",
            description:
              "Vitaminas e suplementos naturais em cápsulas, com pote 3D interativo e entrega para todo o Brasil.",
          },
        ]),
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: products } = useQuery(productsQuery);
  const featured = products?.[0];
  const catalogCount = (products ?? []).filter((p) => p.is_active).length;

  return (
    <div>
      <section className="relative overflow-hidden grain-bg">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "radial-gradient(800px 420px at 20% 0%, color-mix(in oklch, var(--color-leaf) 40%, transparent), transparent)",
          }}
        />
        <div className="relative mx-auto grid min-h-[min(100dvh,820px)] max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <WordReveal
              className="mt-0"
              lines={[
                [{ text: "A", dim: true }, { text: "força" }, { text: "da", dim: true }],
                [
                  { text: "natureza", italic: true },
                  { text: "em", dim: true },
                  { text: "cada" },
                ],
                [{ text: "cápsula", accent: true }],
              ]}
            />
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Mais que vender produtos: levamos até você o que há de melhor da natureza. Gire o pote
              em 3D, abra a tampa e veja as cápsulas antes de escolher.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/produtos">
                  Ver produtos <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              {featured ? (
                <Button asChild size="lg" variant="outline">
                  <Link to="/produtos/$slug" params={{ slug: featured.slug }}>
                    Explorar {featured.name}
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          <JarViewer
            jarColor={featured?.jar_color ?? "#F2F1EE"}
            lidColor={featured?.lid_color ?? "#6FC49A"}
            capsuleColor={featured?.capsule_color ?? "#C9A227"}
            capsuleCount={featured?.capsule_count ?? 24}
            name={featured?.name}
            dosage={featured?.dosage ?? undefined}
            subtitle={featured?.subtitle ?? undefined}
            imageUrl={featured?.image_url ?? undefined}
          />
        </div>

        <div className="relative z-10 grid grid-cols-1 overflow-hidden border-t border-border md:grid-cols-[2fr_1fr_2fr]">
          <div className="bg-muted p-6 md:p-8">
            <p className="text-display max-w-[350px] text-2xl leading-[1.1] lg:text-[32px]">
              Comece seu caminho até o equilíbrio natural
            </p>
            <Link to="/produtos" className="mt-4 inline-block text-sm underline underline-offset-4">
              Ver o catálogo
            </Link>
          </div>
          <BenefitCarousel />
          <div className="flex items-center gap-5 bg-primary p-6 text-primary-foreground md:p-8">
            <div>
              <p className="text-display text-3xl tracking-tight">{catalogCount}</p>
              <p className="mt-1 max-w-[220px] text-sm text-primary-foreground/70">
                {catalogCount
                  ? "fórmulas ativas no catálogo, prontas para você girar em 3D"
                  : "Catálogo em atualização"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pt-4">
        <div className="surface-card grid gap-8 p-8 md:grid-cols-[1.1fr_1fr] md:p-10">
          <div>
            <h2 className="text-display text-3xl">Nossa história</h2>
            <p className="mt-4 text-muted-foreground">
              Tudo começou quando meu pai mudou de vida com disciplina, alimentação e o uso de
              suplementos naturais, eliminando 90 kg e transformando sua saúde e seus hábitos.
            </p>
            <p className="mt-3 text-muted-foreground">
              Vendo meu pai renascer, entendi de verdade: saúde transforma vidas. Foi assim que
              decidi oferecer os produtos que usamos no dia a dia, selecionados com cuidado,
              qualidade e segurança.
            </p>
            <p className="mt-3 text-muted-foreground">
              Meu propósito é compartilhar o que transformou a vida do meu pai e pode transformar a
              sua também.
            </p>
          </div>
          <div className="grid gap-3 self-center">
            {[
              { t: "Perdeu 90 kg", d: "Com disciplina, alimentação e suplementação." },
              { t: "Produtos que usamos", d: "Selecionados com cuidado e segurança." },
              { t: "Saúde e bem-estar", d: "O melhor da natureza no seu dia a dia." },
            ].map((i, idx) => (
              <div
                key={i.t}
                className="story-card border-b border-border py-4 last:border-b-0 last:pb-0 first:pt-0"
                style={{ animationDelay: `${idx * 55}ms` }}
              >
                <p className="text-display text-lg">{i.t}</p>
                <p className="text-sm text-muted-foreground">{i.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl">
            Nossas <span className="italic font-normal">vitaminas</span>
          </h2>
          <Link to="/produtos" className="text-sm text-accent underline-offset-4 hover:underline">
            Ver todas
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(products ?? [])
            .filter((p) => p.is_active)
            .slice(0, 4)
            .map((p) => (
              <div key={p.id} className="lift-card">
                <Link
                  to="/produtos/$slug"
                  params={{ slug: p.slug }}
                  className="surface-card group block p-5"
                >
                {p.image_url ? (
                  <PhotoSpotlight
                    src={p.image_url}
                    alt={`Pote de ${p.name}, suplemento natural em cápsulas`}
                    className="h-32 rounded-xl"
                    imgClassName="h-32 p-2"
                  />
                ) : (
                  <div
                    className="h-32 rounded-xl"
                    style={{
                      background: `linear-gradient(160deg, ${p.jar_color}, ${p.lid_color})`,
                    }}
                  />
                )}
                <h3 className="mt-4 text-xl">{p.name}</h3>
                <p className="text-sm text-muted-foreground">{p.subtitle}</p>
                <p className="mt-3 text-sm font-medium text-accent">{formatPrice(p.price)}</p>
              </Link>
              </div>
            ))}
        </div>

      </section>
    </div>
  );
}
