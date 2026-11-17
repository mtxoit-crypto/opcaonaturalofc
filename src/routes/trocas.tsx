import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { SITE_ORIGIN } from "@/lib/site";

export const Route = createFileRoute("/trocas")({
  head: () => ({
    meta: [
      { title: "Trocas e devoluções · Opção Natural" },
      { name: "description", content: "Como solicitar troca ou devolução na Opção Natural." },
      { property: "og:title", content: "Trocas e devoluções · Opção Natural" },
      { property: "og:description", content: "Como solicitar troca ou devolução na Opção Natural." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/trocas` }],
  }),
  component: Page,
});

function Page() {
  return (
    <LegalPage title="Trocas e devoluções">
      <p>TODO_CONTEUDO_REAL: prazos, custos de reenvio e exceções para produtos abertos.</p>
      <p>
        Pedidos pagos pela Stripe seguem as regras da loja e a legislação brasileira de consumo. Entre em contato pelo
        canal informado no rodapé ou pelo e-mail informado durante a compra.
      </p>
    </LegalPage>
  );
}
