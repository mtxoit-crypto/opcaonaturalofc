import { supabase } from "@/integrations/supabase/client";
import {
  firstVariant,
  shopifyProductsQuery,
  type ShopifyProduct,
} from "@/lib/shopify";

export type Product = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  benefits: string[];
  dosage: string | null;
  capsule_count: number;
  price: number | null;
  capsule_color: string;
  jar_color: string;
  lid_color: string;
  image_url: string | null;
  model_url: string | null;
  in_stock: boolean;
  is_active: boolean;
  sort_order: number;
};

const COLUMNS =
  "id,slug,name,subtitle,description,benefits,dosage,capsule_count,price,capsule_color,jar_color,lid_color,image_url,model_url,in_stock,is_active,sort_order";

const LOCAL: Array<{
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  benefits: string[];
  price: number;
}> = [
  {
    slug: "banana-verde",
    name: "Banana Verde",
    subtitle: "Farinha de banana verde em cápsulas",
    description: "Banana verde em cápsulas para incluir fibras na rotina alimentar.",
    benefits: ["Fibras", "Saciedade"],
    price: 39.9,
  },
  {
    slug: "catuaba",
    name: "Catuaba",
    subtitle: "Extrato de catuaba em cápsulas",
    description: "Catuaba em cápsulas, clássico da fitoterapia brasileira.",
    benefits: ["Vitalidade"],
    price: 49.9,
  },
  {
    slug: "cha-verde",
    name: "Chá Verde",
    subtitle: "Chá verde em cápsulas",
    description: "Chá verde em cápsulas para o dia a dia, sem infusão.",
    benefits: ["Antioxidantes"],
    price: 39.9,
  },
  {
    slug: "feno-grego",
    name: "Feno Grego",
    subtitle: "Feno grego em cápsulas",
    description: "Feno grego em cápsulas, semente tradicional da alimentação.",
    benefits: ["Tradição herbal"],
    price: 49.9,
  },
  {
    slug: "gengibre",
    name: "Gengibre",
    subtitle: "Gengibre em cápsulas",
    description: "Gengibre em cápsulas para ter o rizoma à mão na rotina.",
    benefits: ["Digestão"],
    price: 35,
  },
  {
    slug: "ginseng",
    name: "Ginseng",
    subtitle: "Ginseng em cápsulas",
    description: "Ginseng em cápsulas para a rotina de energia do dia.",
    benefits: ["Vitalidade"],
    price: 49.9,
  },
  {
    slug: "glucomannan",
    name: "Glucomannan",
    subtitle: "Glucomannan em cápsulas",
    description: "Glucomannan em cápsulas, fibra solúvel para a alimentação.",
    benefits: ["Fibras", "Saciedade"],
    price: 49.9,
  },
  {
    slug: "hibisco",
    name: "Hibisco",
    subtitle: "Hibisco em cápsulas",
    description: "Hibisco em cápsulas, a flor do chá em formato prático.",
    benefits: ["Rotina leve"],
    price: 39.9,
  },
  {
    slug: "laranja-moro",
    name: "Laranja Moro",
    subtitle: "Laranja moro em cápsulas",
    description: "Laranja moro em cápsulas, o citrus em formato prático.",
    benefits: ["Citrus"],
    price: 35,
  },
  {
    slug: "maca-peruana-negra",
    name: "Maca Peruana Negra",
    subtitle: "Maca peruana negra em cápsulas",
    description: "Maca peruana negra em cápsulas, raiz andina para o dia a dia.",
    benefits: ["Vitalidade"],
    price: 49.9,
  },
  {
    slug: "magnesio-inositol",
    name: "Magnésio + Inositol",
    subtitle: "Magnésio com inositol em cápsulas",
    description: "Magnésio e inositol juntos em cápsulas para a rotina.",
    benefits: ["Mineral"],
    price: 49.9,
  },
  {
    slug: "magnesio-quelato",
    name: "Magnésio Quelato",
    subtitle: "Magnésio quelato em cápsulas",
    description: "Magnésio quelato em cápsulas para complementar a alimentação.",
    benefits: ["Mineral essencial"],
    price: 49.9,
  },
  {
    slug: "marapuama",
    name: "Marapuama",
    subtitle: "Marapuama em cápsulas",
    description: "Marapuama em cápsulas, planta amazônica da fitoterapia brasileira.",
    benefits: ["Tradição amazônica"],
    price: 49.9,
  },
  {
    slug: "mucuna-preta",
    name: "Mucuna Preta",
    subtitle: "Mucuna preta em cápsulas",
    description: "Mucuna preta em cápsulas, semente tradicional em formato prático.",
    benefits: ["Tradição herbal"],
    price: 49.9,
  },
  {
    slug: "oleo-de-alho",
    name: "Óleo de Alho",
    subtitle: "Óleo de alho em cápsulas",
    description: "Óleo de alho em cápsulas para incluir o alho na rotina.",
    benefits: ["Rotina simples"],
    price: 39.9,
  },
  {
    slug: "picolinato-cromo",
    name: "Picolinato de Cromo",
    subtitle: "Picolinato de cromo em cápsulas",
    description: "Picolinato de cromo em cápsulas para complementar a alimentação.",
    benefits: ["Mineral"],
    price: 39.9,
  },
  {
    slug: "psyllium",
    name: "Psyllium",
    subtitle: "Psyllium em cápsulas",
    description: "Psyllium em cápsulas, fibra conhecida para a alimentação.",
    benefits: ["Fibras", "Saciedade"],
    price: 39.9,
  },
  {
    slug: "tribulus-terrestris",
    name: "Tribulus Terrestris",
    subtitle: "Tribulus terrestris em cápsulas",
    description: "Tribulus terrestris em cápsulas para a rotina de treino.",
    benefits: ["Vitalidade"],
    price: 49.9,
  },
  {
    slug: "vitamina-b12",
    name: "Vitamina B12",
    subtitle: "Vitamina B12 em cápsulas",
    description: "Vitamina B12 em cápsulas para complementar a alimentação.",
    benefits: ["Vitamina essencial"],
    price: 39.9,
  },
  {
    slug: "zinco-quelato",
    name: "Zinco Quelato",
    subtitle: "Zinco quelato em cápsulas",
    description: "Zinco quelato em cápsulas para complementar a alimentação.",
    benefits: ["Mineral essencial"],
    price: 39.9,
  },
  {
    slug: "ashwagandha",
    name: "Ashuwagandá",
    subtitle: "Ashwagandha em cápsulas",
    description: "Ashwagandha em cápsulas para a rotina do dia e da noite.",
    benefits: ["Rotina"],
    price: 49.9,
  },
  {
    slug: "capim-limao",
    name: "Capim Limão",
    subtitle: "Capim-limão em cápsulas",
    description: "Capim-limão em cápsulas para a rotina antes de dormir.",
    benefits: ["Rotina noturna"],
    price: 49.9,
  },
  {
    slug: "gaba",
    name: "GABA",
    subtitle: "GABA em cápsulas",
    description: "GABA em cápsulas para a rotina meia hora antes de dormir.",
    benefits: ["Rotina noturna"],
    price: 49.9,
  },
  {
    slug: "glicina",
    name: "Glicina",
    subtitle: "Glicina em cápsulas",
    description: "Glicina em cápsulas para a rotina antes de dormir.",
    benefits: ["Rotina noturna"],
    price: 49.9,
  },
  {
    slug: "maracuja",
    name: "Maracujá",
    subtitle: "Maracujá em cápsulas",
    description: "Maracujá em cápsulas para a rotina da noite.",
    benefits: ["Rotina noturna"],
    price: 49.9,
  },
  {
    slug: "mulungu",
    name: "Mulungu",
    subtitle: "Mulungu em cápsulas",
    description: "Mulungu em cápsulas para a rotina da noite.",
    benefits: ["Rotina noturna"],
    price: 49.9,
  },
];

const DOSAGE: Record<string, string> = {
  "ashwagandha": "1 cápsula de manhã e 1 cápsula à noite",
  "banana-verde": "1 cápsula 30 min antes do almoço e do jantar",
  "capim-limao": "1 a 2 cápsulas antes de dormir",
  "catuaba": "1 cápsula de manhã e 1 cápsula após o almoço",
  "cha-verde": "1 cápsula de manhã e 1 cápsula após o almoço",
  "feno-grego": "1 cápsula de manhã e 1 cápsula após o almoço",
  "gaba": "1 cápsula meia hora antes de dormir",
  "gengibre": "1 cápsula de manhã e 1 cápsula à noite",
  "ginseng": "1 cápsula de manhã e 1 cápsula após o almoço",
  "glicina": "1 ou 2 cápsulas antes de dormir",
  "glucomannan": "1 cápsula meia hora antes do almoço e do jantar",
  "hibisco": "1 cápsula de manhã e 1 cápsula após o almoço",
  "laranja-moro": "1 cápsula de manhã e 1 cápsula à noite",
  "maca-peruana-negra": "1 cápsula de manhã e 1 cápsula após o almoço",
  "maracuja": "1 a 2 cápsulas à noite",
  "marapuama": "1 cápsula de manhã e 1 cápsula após o almoço",
  "mucuna-preta": "1 cápsula de manhã e 1 cápsula após o almoço",
  "mulungu": "1 a 2 cápsulas à noite",
  "psyllium": "2 cápsulas meia hora antes do almoço e 2 antes do jantar",
  "tribulus-terrestris": "1 cápsula de manhã e 1 cápsula após o almoço",
};

function productDosage(slug: string) {
  return DOSAGE[slug] ?? "1 cápsula ao dia";
}

function capsuleCount(slug: string) {
  return slug === "gaba" ? 30 : 60;
}

function localCatalog(): Product[] {
  return LOCAL.map((p, i) => ({
    id: `local-${p.slug}`,
    slug: p.slug,
    name: p.name,
    subtitle: p.subtitle,
    description: p.description,
    benefits: p.benefits,
    dosage: productDosage(p.slug),
    capsule_count: capsuleCount(p.slug),
    price: p.price,
    capsule_color: "#E8B54A",
    jar_color: "#F4F3F0",
    lid_color: p.slug === "maracuja" ? "#2F4A8A" : p.slug === "gaba" ? "#F4F3F0" : "#A8D4B8",
    image_url: `/produtos/${p.slug}.png`,
    model_url: null,
    in_stock: true,
    is_active: true,
    sort_order: i + 1,
  }));
}

function fromShopify(edge: ShopifyProduct, index: number): Product {
  const n = edge.node;
  const amount = Number(n.priceRange.minVariantPrice.amount);
  const local = LOCAL.find((p) => p.slug === n.handle);
  return {
    id: n.id,
    slug: n.handle,
    name: n.title,
    subtitle: local?.subtitle ?? null,
    description: n.description || local?.description || null,
    benefits: local?.benefits ?? [],
    dosage: productDosage(n.handle),
    capsule_count: capsuleCount(n.handle),
    price: Number.isFinite(amount) ? amount : (local?.price ?? null),
    capsule_color: "#E8B54A",
    jar_color: "#F4F3F0",
    lid_color: n.handle === "maracuja" ? "#2F4A8A" : n.handle === "gaba" ? "#F4F3F0" : "#A8D4B8",
    image_url: `/produtos/${n.handle}.png`,
    model_url: null,
    in_stock: Boolean(firstVariant(edge)?.availableForSale),
    is_active: true,
    sort_order: index + 1,
  };
}

export function productPhoto(p: Pick<Product, "slug" | "image_url">) {
  if (p.image_url) return p.image_url;
  return `/produtos/${p.slug}.png`;
}

async function storefrontCatalog(): Promise<Product[]> {
  const local = localCatalog();
  try {
    const shopify = await shopifyProductsQuery.queryFn();
    if (!shopify.length) return local;
    const fromShop = shopify.map(fromShopify);
    const seen = new Set(fromShop.map((p) => p.slug));
    return [...fromShop, ...local.filter((p) => !seen.has(p.slug))];
  } catch {
    return local;
  }
}

export const productsQuery = {
  queryKey: ["products"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase.from("products").select(COLUMNS).order("sort_order", {
      ascending: true,
    });
    if (error) throw error;
    const store = await storefrontCatalog();
    if (!data?.length) return store;
    const db = data as Product[];
    const seen = new Set(db.map((p) => p.slug));
    return [...db, ...store.filter((p) => !seen.has(p.slug))];
  },
};

export const adminProductsQuery = (enabled = false) => ({
  queryKey: ["admin-products"],
  enabled,
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase.from("products").select(COLUMNS).order("sort_order", {
      ascending: true,
    });
    if (error) throw error;
    const store = await storefrontCatalog();
    if (!data?.length) return store;
    const db = data as Product[];
    const seen = new Set(db.map((p) => p.slug));
    return [...db, ...store.filter((p) => !seen.has(p.slug))];
  },
});

export const productQuery = (slug: string) => ({
  queryKey: ["product", slug],
  queryFn: async (): Promise<Product | null> => {
    const { data, error } = await supabase.from("products").select(COLUMNS).eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (data) return data as Product;
    const list = await storefrontCatalog();
    return list.find((p) => p.slug === slug) ?? null;
  },
});

export function formatPrice(price: number | null) {
  if (price == null) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);
}
