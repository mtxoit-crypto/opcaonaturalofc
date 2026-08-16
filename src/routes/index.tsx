import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Leaf, ArrowRight, ShieldCheck, PackageCheck, Truck } from "lucide-react";
import { productsQuery, formatPrice } from "@/lib/products";
import { JarViewer } from "@/components/JarViewer";
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

  return (
    <div>
      <section className="hero-natural grain-bg">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-[0.9fr_1.1fr] md:py-24">
          <div>
            <p className="eyebrow"><Leaf className="size-3.5" /> Bem-estar que cabe na rotina</p>
            <h1 className="mt-5 text-5xl leading-[1.02] md:text-7xl">
              Escolhas naturais.<br />Uma vida com <em>mais presença.</em>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Suplementos selecionados para acompanhar hábitos reais, com informação clara e cuidado em cada escolha.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/produtos">Conhecer os produtos <ArrowRight className="size-4" /></Link>
              </Button>
              {featured ? (
                <Button asChild size="lg" variant="outline">
                  <Link to="/produtos/$slug" params={{ slug: featured.slug }}>
                    Ver {featured.name}
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="hero-product-stage"><span className="hero-note">Arraste para girar<br /><strong>produto em 3D</strong></span><JarViewer
            jarColor={featured?.jar_color ?? "#F2F1EE"}
            lidColor={featured?.lid_color ?? "#6FC49A"}
            capsuleColor={featured?.capsule_color ?? "#C9A227"}
            capsuleCount={featured?.capsule_count ?? 24}
            name={featured?.name}
            dosage={featured?.dosage ?? undefined}
            subtitle={featured?.subtitle ?? undefined}
            imageUrl={featured?.image_url ?? undefined}
          /></div>

        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:py-24">
        <div className="story-panel grid gap-10 md:grid-cols-[0.85fr_1.15fr] md:items-center">
          <div>
            <p className="eyebrow">A história por trás da marca</p>
            <p className="story-number">90<span>kg</span></p>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">eliminados com constância, alimentação e uma mudança completa de hábitos.</p>
          </div>
          <div>
            <h2 className="text-4xl leading-tight md:text-5xl">A Opção Natural nasceu de uma transformação vivida dentro de casa.</h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">Quando meu pai retomou a própria saúde, entendemos que bem-estar não acontece de uma hora para outra. Ele é construído todos os dias. A marca nasceu para compartilhar produtos que fazem parte dessa rotina, escolhidos com responsabilidade e propósito.</p>
            <Link to="/produtos" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-accent">Conheça nossa seleção <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="eyebrow">Nosso jeito de fazer</p>
        <h2 className="mt-3 max-w-xl text-4xl">Menos promessa. Mais clareza em cada etapa.</h2>
        <div className="principles-grid mt-9 grid sm:grid-cols-3">
          {[
            { icon: PackageCheck, t: "Seleção cuidadosa", d: "Produtos escolhidos para uma rotina de bem-estar simples e possível." },
            { icon: ShieldCheck, t: "Informação transparente", d: "Você entende o que está levando antes de comprar." },
            { icon: Truck, t: "Do pedido à entrega", d: "Acompanhamento e envio para todo o Brasil pelos Correios." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="principle-item p-6">
              <Icon className="size-5 text-accent" />
              <h3 className="mt-3 text-lg">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-8">
        <div className="flex items-end justify-between gap-4">
          <div><p className="eyebrow">Seleção da casa</p><h2 className="mt-2 text-4xl">Produtos para conhecer</h2></div>
          <Link to="/produtos" className="text-sm text-accent underline-offset-4 hover:underline">
            Ver todas
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(products ?? [])
            .filter((p) => p.is_active)
            .slice(0, 4)
            .map((p) => (
              <Link
                key={p.id}
                to="/produtos/$slug"
                params={{ slug: p.slug }}
                className="home-product group"
              >
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={`Pote de ${p.name} — suplemento natural em cápsulas`}
                    loading="lazy"
                    className="h-52 w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="h-32 rounded-xl"
                    style={{
                      background: `linear-gradient(160deg, ${p.jar_color}, ${p.lid_color})`,
                    }}
                  />
                )}
                <div className="p-5"><h3 className="text-xl">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.subtitle}</p>
                <p className="mt-4 text-sm font-medium text-accent">{formatPrice(p.price)}</p></div>
              </Link>
            ))}
        </div>

      </section>
    </div>
  );
}
