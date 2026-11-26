export const landing = {
  hero: {
    title: "Bem-estar que encontra espaço na sua rotina",
    text: "Conheça uma seleção de suplementos em cápsulas e kits da Opção Natural. Consulte composição, quantidade e modo de uso de cada produto com clareza.",
    primary: "Explorar produtos",
    secondary: "Conhecer os kits",
    highlights: [
      "Produtos com informações claras",
      "Entrega calculada pelo CEP",
      "Atendimento próximo no WhatsApp",
    ],
  },
  trust: [
    { title: "Informação transparente", detail: "Detalhes para escolher com confiança." },
    { title: "Entrega nacional", detail: "Consulte prazo e valor pelo seu CEP." },
    { title: "Atendimento próximo", detail: "Nossa equipe está no WhatsApp." },
  ],
  story: {
    title: "Cuidado e constância, todos os dias.",
    p1: "A Opção Natural nasceu de uma história familiar de mudança de hábitos e atenção ao bem-estar. Acreditamos em escolhas conscientes, informação transparente e cuidado que cabe na vida real.",
    p2: "Cada jornada é individual. Consulte as informações do rótulo e converse com um profissional de saúde antes de incluir suplementos na sua rotina.",
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
      a: "Informe seu CEP no carrinho. O valor e o prazo da entrega são calculados antes do pagamento.",
    },
    {
      q: "Onde o pagamento é realizado?",
      a: "A finalização online será liberada assim que a loja concluir a configuração dos meios de pagamento. Nossa equipe pode ajudar pelo WhatsApp.",
    },
    {
      q: "Vocês entregam em todo o Brasil?",
      a: "Sim. Atendemos todo o Brasil. Prazo e frete variam conforme o CEP informado no checkout.",
    },
    {
      q: "Como acompanho meu pedido?",
      a: "Após a confirmação, você recebe os detalhes do pedido no e-mail informado durante o checkout.",
    },
    {
      q: "Suplementos substituem alimentação equilibrada?",
      a: "Não. Suplementos não substituem uma alimentação equilibrada nem o acompanhamento de um profissional de saúde.",
    },
  ],
  close: {
    title: "Sua próxima escolha começa com informação clara.",
    primary: "Ver todos os produtos",
    secondary: "Ver kits",
  },
  diffs: [
    { t: "Escolha informada", d: "Consulte apresentação, quantidade e detalhes de cada item antes de decidir." },
    { t: "Compra simples", d: "Encontre o que procura e veja as opções disponíveis em poucos passos." },
    { t: "Entrega transparente", d: "Consulte as opções de envio, prazo e valor usando seu CEP." },
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
