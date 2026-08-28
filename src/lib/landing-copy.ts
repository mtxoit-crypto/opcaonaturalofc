export const landing = {
  hero: {
    title: "Suplementos naturais para energia, vitalidade e bem-estar no dia a dia",
    text: "Encontre cápsulas e kits com preço claro, estoque atualizado e entrega para todo o Brasil.",
    primary: "Encontrar meu suplemento",
    secondary: "Ver kits",
    highlights: [
      "Pagamento seguro pela Shopify",
      "Entrega para todo o Brasil",
      "Atendimento pelo WhatsApp",
    ],
  },
  trust: [
    { title: "Checkout seguro", detail: "Pagamento somente na Shopify." },
    { title: "Envio nacional", detail: "Entrega para todo o Brasil." },
    { title: "Catálogo atualizado", detail: "Preço e estoque vêm da loja." },
  ],
  story: {
    title: "Uma história real de mudança de hábitos.",
    p1: "Meu pai mudou de vida com disciplina, alimentação e uma rotina constante. Eliminou 90 kg. Esse resultado é individual e veio da mudança de hábitos, não de uma promessa de produto.",
    p2: "Os suplementos naturais que usamos em casa fizeram parte da rotina. Eles não substituem alimentação equilibrada e não garantem o mesmo resultado para outras pessoas.",
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
    { t: "Informação no catálogo", d: "Nome, quantidade, benefícios cadastrados e preço visíveis antes da compra." },
    { t: "Compra prática", d: "Carrinho no site e pagamento no checkout da Shopify." },
    { t: "Checkout protegido", d: "Dados de pagamento ficam na Shopify, não neste site." },
    { t: "Navegação clara", d: "Busca, filtros e páginas de produto com o que está cadastrado." },
    { t: "3D opcional", d: "O pote interativo é um extra. Dá para comprar só com a foto e os dados do produto." },
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
