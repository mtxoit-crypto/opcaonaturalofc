import { supabase } from "@/integrations/supabase/client";
import { productsQuery, type Product } from "@/lib/products";

export type KitItem = {
  id: string;
  product_id: string;
  quantity: number;
  sort_order: number;
  product: Product | null;
};

export type Kit = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  price: number | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  items: KitItem[];
  products: Product[];
};

const PRODUCT_COLUMNS =
  "id,slug,name,subtitle,description,benefits,dosage,capsule_count,price,stock_quantity,capsule_color,jar_color,lid_color,image_url,in_stock,is_active,sort_order";

const KIT_SELECT = `id,slug,name,subtitle,description,price,image_url,is_active,sort_order,kit_items(id,product_id,quantity,sort_order,products(${PRODUCT_COLUMNS}))`;

const KIT_PHOTOS: Record<string, string> = {
  "kit-emagrecimento": "/produtos/kit-emagrecimento-completo.jpg",
  "kit-testosterona": "/produtos/kit-testo-completo.jpg",
  "kit-ansiedade": "/produtos/kit-ansiedade-completo.jpg",
};

function mapKit(k: Record<string, unknown>): Kit {
  const raw = (k["kit_items"] ?? []) as {
    id: string;
    product_id: string;
    quantity: number;
    sort_order: number;
    products: Product | null;
  }[];
  const items: KitItem[] = raw
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => ({
      id: i.id,
      product_id: i.product_id,
      quantity: i.quantity,
      sort_order: i.sort_order,
      product: i.products,
    }));
  const kit = k as unknown as Omit<Kit, "items" | "products">;
  return {
    ...kit,
    image_url: KIT_PHOTOS[kit.slug] ?? kit.image_url,
    items,
    products: items.map((i) => i.product).filter((p): p is Product => Boolean(p)),
  };
}

const STORE_KITS = [
  {
    slug: "kit-selecao-7-potes",
    name: "Kit Seleção de 7 Potes",
    description: "Ginseng, Tribulus Terrestris, Feno Grego, Maca Peruana Negra, Catuaba, Marapuama e Mucuna Preta.",
    imageUrl: "/produtos/kit-selecao-7-potes.jpg",
    slugs: ["ginseng", "tribulus-terrestris", "feno-grego", "maca-peruana-negra", "catuaba", "marapuama", "mucuna-preta"],
  },
  {
    slug: "kit-raizes-e-sementes",
    name: "Kit Raízes e Sementes",
    description: "Ginseng, Tribulus Terrestris, Feno Grego e Maca Peruana Negra.",
    slugs: ["ginseng", "tribulus-terrestris", "feno-grego", "maca-peruana-negra"],
  },
  {
    slug: "kit-selecao-botanica",
    name: "Kit Seleção Botânica",
    description: "Catuaba, Marapuama, Mucuna Preta, Gengibre e Laranja Moro.",
    slugs: ["catuaba", "marapuama", "mucuna-preta", "gengibre", "laranja-moro"],
  },
  {
    slug: "kit-fibras-e-plantas",
    name: "Kit Fibras e Plantas",
    description: "Psyllium, Glucomannan, Chá Verde e Hibisco.",
    slugs: ["psyllium", "glucomannan", "cha-verde", "hibisco"],
  },
];

export function localKitsFromCatalog(products: Product[]): Kit[] {
  const bySlug = new Map(products.filter((product) => product.is_active).map((product) => [product.slug, product]));
  return STORE_KITS.flatMap(({ slug, name, description, imageUrl, slugs }, sort_order) => {
    const items = slugs.flatMap((productSlug, index) => {
      const product = bySlug.get(productSlug);
      return product ? [{ id: productSlug, product_id: product.id, quantity: 1, sort_order: index, product }] : [];
    });
    if (items.length !== slugs.length) return [];
    return [{
      id: slug, slug, name, description, subtitle: `${items.length} potes · 1 de cada`,
      price: null, image_url: imageUrl ?? null, is_active: true, sort_order,
      items, products: items.map((item) => item.product),
    }];
  });
}

export const kitsQuery = {
  queryKey: ["kits"],
  queryFn: async (): Promise<Kit[]> => {
    const { data, error } = await supabase
      .from("kits")
      .select(KIT_SELECT)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    const kits = (error ? [] : data ?? []).map((k) => mapKit(k as Record<string, unknown>));
    const products = await productsQuery.queryFn();
    const bySlug = new Map(kits.map((k) => [k.slug, k]));
    for (const local of localKitsFromCatalog(products)) {
      const existing = bySlug.get(local.slug);
      if (!existing || existing.products.length === 0) bySlug.set(local.slug, local);
    }
    return [...bySlug.values()].sort((a, b) => a.sort_order - b.sort_order);
  },
};

/** Todos os kits, inclusive os ocultos — usado no painel admin. */
export const adminKitsQuery = {
  queryKey: ["admin-kits"],
  queryFn: async (): Promise<Kit[]> => {
    const { data, error } = await supabase
      .from("kits")
      .select(KIT_SELECT)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((k) => mapKit(k as Record<string, unknown>));
  },
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
