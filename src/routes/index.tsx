import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { productsQuery, formatPrice } from "@/lib/products";
import { JarViewer } from "@/components/JarViewer";
import { WordReveal } from "@/components/WordReveal";
import { BenefitCarousel } from "@/components/BenefitCarousel";
import { PhotoSpotlight } from "@/components/PhotoSpotlight";
import { FatherStory } from "@/components/FatherStory";
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
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 py-10 md:grid-cols-[1.15fr_0.85fr] md:py-12">
          <div>
            <WordReveal
              className="mt-0"
              lines={[
                [{ text: "A", dim: true }, { text: "força" }, { text: "da", dim: true }],
                [{ text: "natureza", italic: true }],
                [
                  { text: "em", dim: true },
                  { text: "cada" },
                  { text: "cápsula", accent: true },
                ],
              ]}
            />
            <p className="mt-4 max-w-[38ch] text-muted-foreground">
              Gire o pote em 3D, abra a tampa e veja as cápsulas antes de escolher.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/produtos">
                  Ver produtos <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              {featured ? (
                <Button asChild variant="outline">
                  <Link to="/produtos/$slug" params={{ slug: featured.slug }}>
                    Ver {featured.name}
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          <JarViewer
            compact
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

        <div className="relative z-10 grid grid-cols-1 overflow-hidden border-t border-border md:grid-cols-[1.4fr_1fr_1.2fr]">
          <div className="bg-muted px-5 py-5 md:px-6">
            <p className="text-display max-w-[280px] text-xl leading-[1.15] lg:text-2xl">
              Comece pelo equilíbrio natural
            </p>
            <Link to="/produtos" className="mt-3 inline-block text-sm underline underline-offset-4">
              Ver o catálogo
            </Link>
          </div>
          <BenefitCarousel />
          <div className="flex items-center gap-4 bg-primary px-5 py-5 text-primary-foreground md:px-6">
            <div>
              <p className="text-display text-2xl tracking-tight tabular-nums">{catalogCount}</p>
              <p className="mt-1 max-w-[200px] text-sm text-primary-foreground/70">
                {catalogCount ? "fórmulas ativas no catálogo" : "Catálogo em atualização"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pt-8">
        <div className="grid items-start gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.15fr)] md:gap-12">
          <div className="md:sticky md:top-24 md:pt-4">
            <h2 className="text-display text-4xl leading-[1.1]">
              A <span className="italic font-normal">história</span>
            </h2>
            <p className="mt-5 max-w-[42ch] text-muted-foreground">
              Meu pai mudou de vida com disciplina, alimentação e suplementos naturais. Eliminou 90
              kg. O corpo mudou porque os hábitos mudaram, e os produtos que usamos em casa fizeram
              parte desse caminho.
            </p>
            <p className="mt-3 max-w-[42ch] text-muted-foreground">
              Vendo aquela virada, entendi: saúde transforma vidas. A Opção Natural existe para
              oferecer o que ajudou nessa jornada, e pode ajudar na sua.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">
              Passe as fotos. É o filme da virada.
            </p>
          </div>
          <FatherStory />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10">
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
