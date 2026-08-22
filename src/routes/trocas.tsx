import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { SITE_ORIGIN } from "@/lib/site";

export const Route = createFileRoute("/trocas")({
  head: () => ({
    meta: [
      { title: "Trocas e devoluções · Opção Natural" },
      { name: "description", content: "Como solicitar troca ou devolução na Opção Natural." },
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
        Pedidos pagos pela Shopify seguem as regras da loja e a legislação brasileira de consumo. Entre em contato pelo
        canal informado no rodapé, quando disponível, ou pelo e-mail da compra na Shopify.
      </p>
    </LegalPage>
  );
}
