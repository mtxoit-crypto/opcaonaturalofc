export const landing = {
  hero: {
    title: "Suplementos naturais para a sua rotina",
    text: "Conheça os produtos e kits da Opção Natural, com informações claras para escolher com tranquilidade.",
    primary: "Encontrar meu suplemento",
    secondary: "Ver kits",
    highlights: [
      "Frete para todo o Brasil",
      "Pagamento seguro",
      "Atendimento no WhatsApp",
    ],
  },
  trust: [
    { title: "Checkout seguro", detail: "Pagamento somente na Shopify." },
    { title: "Envio nacional", detail: "Entrega para todo o Brasil." },
    { title: "Catálogo atualizado", detail: "Preço e estoque vêm da loja." },
  ],
  story: {
    title: "Uma história de mudança de hábitos.",
    p1: "Meu pai passou por uma mudança pessoal que envolveu disciplina, alimentação e uma rotina constante. Esta história é individual e não representa um resultado esperado com qualquer produto.",
    p2: "Compartilhamos essa experiência como parte da história da família. Suplementos não substituem uma alimentação equilibrada nem a orientação de um profissional de saúde.",
    cta: "Conheça os produtos",
  },
  faq: [
    {
      q: "Como escolher um produto?",
      a: "Compare nome, benefícios cadastrados e descrição em cada página. Confira também a quantidade de cápsulas, o modo de uso e se o item está disponível antes de adicionar ao carrinho.",
    },
    {
      q: "Quantas cápsulas vêm no frasco?",
      a: "A quantidade está em cada produto, no campo Conteúdo. Na maior parte do catálogo são 60 cápsulas; quando for diferente, isso aparece na página do item.",
    },
    {
      q: "Como consultar o frete?",
      a: "Use o cálculo por CEP na página do produto ou no carrinho. O valor e o prazo finais são confirmados no checkout da Shopify.",
    },
    {
      q: "Onde o pagamento é realizado?",
      a: "Somente no checkout seguro da Shopify. Cartão, Pix e demais opções ficam lá; este site não processa pagamento.",
    },
    {
      q: "Vocês entregam em todo o Brasil?",
      a: "Sim. Atendemos todo o Brasil. Prazo e frete variam conforme o CEP informado no checkout.",
    },
    {
      q: "Como acompanho meu pedido?",
      a: "Depois do pagamento, acompanhe pelo e-mail e pela conta da Shopify usados na compra. As atualizações de envio chegam por lá.",
    },
    {
      q: "Suplementos substituem alimentação equilibrada?",
      a: "Não. Suplementos não substituem uma alimentação equilibrada nem o acompanhamento de um profissional de saúde.",
    },
  ],
  close: {
    title: "Encontre o suplemento que combina com a sua rotina.",
    primary: "Ver todos os produtos",
    secondary: "Ver kits",
  },
  diffs: [
    { t: "Qualidade", d: "Suplementos em cápsulas com rótulo, quantidade e modo de uso claros em cada produto." },
    { t: "Praticidade", d: "Escolha, adicione ao carrinho e pague em poucos cliques, com Pix ou cartão." },
    { t: "Entrega nacional", d: "Enviamos para todo o Brasil, com frete e prazo calculados pelo seu CEP." },
  ],
} as const;

export function objectiveGroups(benefits: string[]) {
  const groups: { id: string; label: string; match: string[] }[] = [
    { id: "fibras", label: "Fibras", match: ["fibra", "saciedade"] },
    { id: "minerais", label: "Minerais", match: ["mineral"] },
    { id: "vitaminas", label: "Vitaminas", match: ["vitamina"] },
    { id: "vitalidade", label: "Vitalidade", match: ["vitalidade"] },
    { id: "rotina", label: "Rotina", match: ["rotina", "tradição", "tradicao"] },
  ];
  const text = benefits.join(" ").toLowerCase();
  return groups.filter((g) => g.match.some((m) => text.includes(m)));
}
