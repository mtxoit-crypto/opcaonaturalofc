import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { SITE_ORIGIN } from "@/lib/site";

export const Route = createFileRoute("/entrega")({
  head: () => ({
    meta: [
      { title: "Política de entrega · Opção Natural" },
      { name: "description", content: "Como funciona o envio dos pedidos Opção Natural." },
      { property: "og:title", content: "Política de entrega · Opção Natural" },
      { property: "og:description", content: "Como funciona o envio dos pedidos Opção Natural." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/entrega` }],
  }),
  component: Page,
});

function Page() {
  return (
    <LegalPage title="Política de entrega">
      <p>TODO_CONTEUDO_REAL: transportadoras e prazos médios por região, quando forem definidos.</p>
      <p>
        Enviamos para todo o Brasil. O valor do frete e o prazo aparecem no cálculo por CEP e são confirmados no
        checkout seguro da Stripe.
      </p>
    </LegalPage>
  );
}
