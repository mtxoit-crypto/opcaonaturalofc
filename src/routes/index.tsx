import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Leaf, Sparkles, ShieldCheck } from "lucide-react";
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
    ],
  }),
  component: Index,
});

function Index() {
  const { data: products } = useQuery(productsQuery);
  const featured = products?.[0];

  return (
    <div>
      <section className="grain-bg">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
              <Leaf className="size-3.5" /> Suplementos naturais
            </span>
            <h1 className="mt-5 text-5xl leading-[1.05] md:text-6xl">
              Mais disposição
              <span className="text-accent"> para o seu dia</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Mais que vender produtos: levamos até você o que há de melhor da natureza. Gire o pote
              em 3D, abra a tampa e veja as cápsulas antes de escolher.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/produtos">Ver produtos</Link>
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
      </section>

      <section className="mx-auto max-w-6xl px-5 pt-4">
        <div className="surface-card grid gap-8 p-8 md:grid-cols-[1.1fr_1fr] md:p-10">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Quem somos</p>
            <h2 className="text-display mt-2 text-3xl">Nossa história</h2>
            <p className="mt-4 text-muted-foreground">
              Tudo começou quando meu pai mudou de vida com disciplina, alimentação e o uso de
              suplementos naturais — eliminando 90 kg e transformando sua saúde e seus hábitos.
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
            ].map((i) => (
              <div key={i.t} className="rounded-2xl border border-border bg-sand p-5">
                <p className="text-display text-lg">{i.t}</p>
                <p className="text-sm text-muted-foreground">{i.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Sparkles, t: "Fórmulas limpas", d: "Sem corantes nem excipientes dispensáveis." },
            { icon: ShieldCheck, t: "Testado em lote", d: "Cada lote com laudo de pureza e potência." },
            { icon: Leaf, t: "Cápsulas veganas", d: "Invólucro vegetal, fácil de digerir." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="surface-card p-6">
              <Icon className="size-5 text-accent" />
              <h3 className="mt-3 text-lg">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl">Nossas vitaminas</h2>
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
                className="surface-card group p-5 transition-transform hover:-translate-y-1"
              >
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={`Pote de ${p.name} — suplemento natural em cápsulas`}
                    loading="lazy"
                    className="h-32 w-full rounded-xl bg-sand object-contain"
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
            ))}
        </div>

      </section>
    </div>
  );
}
