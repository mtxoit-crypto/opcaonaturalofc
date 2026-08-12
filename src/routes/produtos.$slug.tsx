import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronLeft, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { productQuery, formatPrice } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { JarViewer } from "@/components/JarViewer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/produtos/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} · Opção Natural` },
      {
        name: "description",
        content:
          "Veja este suplemento natural em 3D: gire o pote, abra a tampa e compre com Pix, com entrega em todo o Brasil.",
      },
      { property: "og:title", content: `Opção Natural · ${params.slug.replace(/-/g, " ")}` },
      {
        property: "og:description",
        content: "Gire o pote em 3D, conheça os benefícios e compre com Pix.",
      },
      { property: "og:type", content: "product" },
      {
        property: "og:url",
        content: `https://natural-pot-showcase.lovable.app/produtos/${params.slug}`,
      },
    ],
    links: [
      {
        rel: "canonical",
        href: `https://natural-pot-showcase.lovable.app/produtos/${params.slug}`,
      },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useQuery(productQuery(slug));
  const { add } = useCart();
  const navigate = useNavigate();

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

  const p = product;
  function buy(now: boolean) {
    add({ id: p.id, slug: p.slug, name: p.name, price: p.price ?? 0, image_url: p.image_url });
    if (now) navigate({ to: "/checkout" });
    else toast.success(`${p.name} adicionado ao carrinho`);
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
        <div className="space-y-4">
          {p.image_url ? (
            <img
              src={p.image_url}
              alt={`Pote de ${p.name} — suplemento natural em cápsulas`}
              className="w-full rounded-2xl bg-sand object-contain p-4"
            />
          ) : null}
          <JarViewer
            jarColor={p.jar_color}
            lidColor={p.lid_color}
            capsuleColor={p.capsule_color}
            capsuleCount={p.capsule_count}
          />
        </div>

        <div>
          <h1 className="text-4xl">{p.name}</h1>
          <p className="mt-1 text-muted-foreground">{p.subtitle}</p>
          <p className="mt-6 text-lg leading-relaxed">{p.description}</p>

          <ul className="mt-6 space-y-2">
            {p.benefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 text-accent" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-8 grid grid-cols-2 gap-4">
            <div className="surface-card p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Conteúdo</dt>
              <dd className="mt-1 text-lg">{p.capsule_count} cápsulas</dd>
            </div>
            <div className="surface-card p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Dosagem</dt>
              <dd className="mt-1 text-lg">{p.dosage ?? "—"}</dd>
            </div>
          </dl>

          <p className="mt-8 text-3xl text-accent">{formatPrice(p.price)}</p>
          <p className="text-sm text-muted-foreground">Pagamento via Pix pelo WhatsApp</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              size="lg"
              variant="outline"
              disabled={!p.in_stock || p.price == null}
              onClick={() => buy(false)}
            >
              <ShoppingBag className="size-4" />
              Adicionar ao carrinho
            </Button>
            <Button size="lg" disabled={!p.in_stock || p.price == null} onClick={() => buy(true)}>
              Comprar agora
            </Button>
          </div>
          {!p.in_stock ? (
            <p className="mt-3 text-sm text-muted-foreground">Produto temporariamente esgotado.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
