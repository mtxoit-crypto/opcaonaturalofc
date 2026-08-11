import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronLeft } from "lucide-react";
import { productQuery, formatPrice } from "@/lib/products";
import { JarViewer } from "@/components/JarViewer";

export const Route = createFileRoute("/produtos/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} · Naturalis` },
      {
        name: "description",
        content:
          "Veja este suplemento natural em 3D: gire o pote, abra a tampa e conheça as cápsulas, benefícios e dosagem.",
      },
      { property: "og:title", content: `Naturalis · ${params.slug.replace(/-/g, " ")}` },
      {
        property: "og:description",
        content: "Gire o pote em 3D, abra a tampa e conheça as cápsulas deste suplemento natural.",
      },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useQuery(productQuery(slug));

  if (isLoading) {
    return <div className="mx-auto max-w-6xl px-5 py-20 text-muted-foreground">Carregando…</div>;
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-20">
        <h1 className="text-3xl">Produto não encontrado</h1>
        <Link to="/produtos" className="mt-4 inline-block text-accent hover:underline">
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <Link
        to="/produtos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Produtos
      </Link>

      <div className="mt-6 grid items-start gap-12 md:grid-cols-2">
        <JarViewer
          jarColor={product.jar_color}
          lidColor={product.lid_color}
          capsuleColor={product.capsule_color}
          capsuleCount={product.capsule_count}
        />

        <div>
          <h1 className="text-4xl">{product.name}</h1>
          <p className="mt-1 text-muted-foreground">{product.subtitle}</p>
          <p className="mt-6 text-lg leading-relaxed">{product.description}</p>

          <ul className="mt-6 space-y-2">
            {product.benefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 text-accent" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-8 grid grid-cols-2 gap-4">
            <div className="surface-card p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Conteúdo</dt>
              <dd className="mt-1 text-lg">{product.capsule_count} cápsulas</dd>
            </div>
            <div className="surface-card p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Dosagem</dt>
              <dd className="mt-1 text-lg">{product.dosage ?? "—"}</dd>
            </div>
          </dl>

          <p className="mt-8 text-2xl text-accent">{formatPrice(product.price)}</p>
        </div>
      </div>
    </div>
  );
}
