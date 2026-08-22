import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { SITE_ORIGIN } from "@/lib/site";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de privacidade · Opção Natural" },
      { name: "description", content: "Como a Opção Natural trata dados pessoais neste site." },
    ],
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/privacidade` }],
  }),
  component: Page,
});

function Page() {
  return (
    <LegalPage title="Política de privacidade">
      <p>TODO_CONTEUDO_REAL: completar com o responsável pelo tratamento, bases legais e prazos de retenção.</p>
      <p>
        Este site usa o catálogo e o carrinho para montar o pedido. O pagamento ocorre no checkout da Shopify. Dados
        que você envia em avaliações ou no login administrativo ficam no Supabase da loja.
      </p>
      <p>Não publicamos aqui CNPJ, e-mail ou telefone até esses dados serem confirmados.</p>
    </LegalPage>
  );
}
