export const landing = {
  hero: {
    title: "Sua rotina natural começa com a escolha certa.",
    text: "Cápsulas no catálogo, com preço e estoque claros. Entrega para todo o Brasil.",
    primary: "Encontrar meu suplemento",
    secondary: "Ver kits",
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
      a: "Use a busca e os benefícios listados em cada item. Abra a página do produto para ver descrição, quantidade de cápsulas e disponibilidade.",
    },
    {
      q: "Quantas cápsulas vêm no frasco?",
      a: "A quantidade aparece em cada produto, em geral 60 cápsulas. Confira o campo Conteúdo na página do item.",
    },
    {
      q: "Como consultar o frete?",
      a: "Na página do produto e no carrinho há um cálculo por CEP. O valor final do envio é confirmado no checkout da Shopify.",
    },
    {
      q: "Onde o pagamento é realizado?",
      a: "Somente no checkout seguro da Shopify. O site da Opção Natural não processa cartão nem Pix internamente.",
    },
    {
      q: "Vocês entregam em todo o Brasil?",
      a: "Sim. O envio cobre todo o Brasil. Prazo e valor dependem do CEP informado no checkout.",
    },
    {
      q: "Como acompanho meu pedido?",
      a: "Após o pagamento, o acompanhamento fica no e-mail e na conta da Shopify usados na compra.",
    },
    {
      q: "Suplementos substituem alimentação equilibrada?",
      a: "Não. Suplementos não substituem uma alimentação equilibrada nem acompanhamento profissional.",
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
