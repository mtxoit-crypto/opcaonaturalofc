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
              <Leaf className="size-3.5" /> 100% natural
            </span>
            <h1 className="mt-5 text-5xl leading-[1.05] md:text-6xl">
              Vitaminas que você pode
              <span className="text-accent"> ver por dentro</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Nada de foto genérica: gire o pote em 3D, abra a tampa e conheça as cápsulas antes de
              escolher a sua fórmula.
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
            jarColor={featured?.jar_color ?? "#2A3A2C"}
            lidColor={featured?.lid_color ?? "#C98A3C"}
            capsuleColor={featured?.capsule_color ?? "#E8B54A"}
            capsuleCount={featured?.capsule_count ?? 24}
          />
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
          {(products ?? []).slice(0, 4).map((p) => (
            <Link
              key={p.id}
              to="/produtos/$slug"
              params={{ slug: p.slug }}
              className="surface-card group p-5 transition-transform hover:-translate-y-1"
            >
              <div
                className="h-28 rounded-xl"
                style={{
                  background: `linear-gradient(160deg, ${p.jar_color}, ${p.lid_color})`,
                }}
              />
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
