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
  in_stock: boolean;
  is_active: boolean;
  sort_order: number;
};

const COLUMNS =
  "id,slug,name,subtitle,description,benefits,dosage,capsule_count,price,capsule_color,jar_color,lid_color,image_url,in_stock,is_active,sort_order";

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
];

function localCatalog(): Product[] {
  return LOCAL.map((p, i) => ({
    id: `local-${p.slug}`,
    slug: p.slug,
    name: p.name,
    subtitle: p.subtitle,
    description: p.description,
    benefits: p.benefits,
    dosage: "1 cápsula ao dia",
    capsule_count: 60,
    price: p.price,
    capsule_color: "#E8B54A",
    jar_color: "#F4F3F0",
    lid_color: "#C98A3C",
    image_url: `/produtos/${p.slug}.png`,
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
    dosage: "1 cápsula ao dia",
    capsule_count: 60,
    price: Number.isFinite(amount) ? amount : (local?.price ?? null),
    capsule_color: "#E8B54A",
    jar_color: "#F4F3F0",
    lid_color: "#C98A3C",
    image_url: `/produtos/${n.handle}.png`,
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
  try {
    const shopify = await shopifyProductsQuery.queryFn();
    if (shopify.length) return shopify.map(fromShopify);
  } catch {
    /* usa o catálogo local */
  }
  return localCatalog();
}

export const productsQuery = {
  queryKey: ["products"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase.from("products").select(COLUMNS).order("sort_order", {
      ascending: true,
    });
    if (error) throw error;
    if (data?.length) return data as Product[];
    return storefrontCatalog();
  },
};

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
