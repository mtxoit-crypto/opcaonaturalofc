import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { SITE_ORIGIN } from "@/lib/site";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de uso · Opção Natural" },
      { name: "description", content: "Condições de uso do site Opção Natural." },
      { property: "og:title", content: "Termos de uso · Opção Natural" },
      { property: "og:description", content: "Condições de uso do site Opção Natural." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/termos` }],
  }),
  component: Page,
});

function Page() {
  return (
    <LegalPage title="Termos de uso">
      <p>TODO_CONTEUDO_REAL: revisar com assessoria jurídica antes de publicação oficial.</p>
      <p>
        O catálogo apresenta suplementos em cápsulas. Preços e estoque são validados no servidor antes do pagamento.
        Pedidos só são confirmados após a confirmação do pagamento pela Stripe.
      </p>
      <p>Suplementos não substituem alimentação equilibrada nem orientação profissional.</p>
    </LegalPage>
  );
}
