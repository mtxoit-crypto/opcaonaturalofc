import { supabase } from "@/integrations/supabase/client";
import { productsQuery, type Product } from "@/lib/products";

export type KitItem = {
  id: string;
  product_id: string;
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
  "id,slug,name,subtitle,description,benefits,dosage,capsule_count,price,capsule_color,jar_color,lid_color,image_url,in_stock,is_active,sort_order";

const KIT_SELECT = `id,slug,name,subtitle,description,price,image_url,is_active,sort_order,kit_items(id,product_id,sort_order,products(${PRODUCT_COLUMNS}))`;

function mapKit(k: Record<string, unknown>): Kit {
  const raw = (k["kit_items"] ?? []) as {
    id: string;
    product_id: string;
    sort_order: number;
    products: Product | null;
  }[];
  const items: KitItem[] = raw
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => ({
      id: i.id,
      product_id: i.product_id,
      sort_order: i.sort_order,
      product: i.products,
    }));
  return {
    ...(k as unknown as Omit<Kit, "items" | "products">),
    items,
    products: items.map((i) => i.product).filter((p): p is Product => Boolean(p)),
  };
}

const KIT_TESTOSTERONA_SLUGS = [
  "ginseng",
  "tribulus-terrestris",
  "feno-grego",
  "maca-peruana-negra",
  "marapuama",
  "mucuna-preta",
  "catuaba",
];

const KIT_EMAGRECIMENTO_SLUGS = [
  "marapuama",
  "hibisco",
  "laranja-moro",
  "gengibre",
  "glucomannan",
  "psyllium",
  "cha-verde",
];

const KIT_ANSIEDADE_SLUGS = ["mulungu", "gaba", "glicina", "maracuja", "ashwagandha", "capim-limao"];

function kitFromSlugs(
  products: Product[],
  spec: {
    id: string;
    slug: string;
    name: string;
    subtitle: string;
    description: string;
    price: number | null;
    image_url: string;
    sort_order: number;
    slugs: string[];
  },
): Kit {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const items: KitItem[] = spec.slugs.flatMap((slug, i) => {
    const product = bySlug.get(slug);
    if (!product) return [];
    return [{ id: `${spec.id}-${slug}`, product_id: product.id, sort_order: i, product }];
  });
  return {
    id: spec.id,
    slug: spec.slug,
    name: spec.name,
    subtitle: spec.subtitle,
    description: spec.description,
    price: spec.price,
    image_url: spec.image_url,
    is_active: true,
    sort_order: spec.sort_order,
    items,
    products: items.map((i) => i.product).filter((p): p is Product => Boolean(p)),
  };
}

export function localKitsFromCatalog(products: Product[]): Kit[] {
  return [
    kitFromSlugs(products, {
      id: "local-kit-emagrecimento",
      slug: "kit-emagrecimento",
      name: "Kit Emagrecimento",
      subtitle: "7 potes da linha de rotina",
      description:
        "Conjunto com Marapuama, Hibisco, Laranja Moro, Gengibre, Glucomannan, Psyllium e Chá Verde. Cada pote contém 60 cápsulas. Não substitui alimentação equilibrada nem avaliação profissional.",
      price: 189.99,
      image_url: "/kits/kit-emagrecimento.png",
      sort_order: 0,
      slugs: KIT_EMAGRECIMENTO_SLUGS,
    }),
    kitFromSlugs(products, {
      id: "local-kit-testosterona",
      slug: "kit-testosterona",
      name: "Kit Testosterona",
      subtitle: "7 potes da linha de vitalidade",
      description:
        "Conjunto com Ginseng, Tribulus Terrestris, Feno Grego, Maca Peruana Negra, Marapuama, Mucuna Preta e Catuaba. Cada pote contém 60 cápsulas. Este kit reúne fitoterápicos da rotina; não substitui avaliação médica nem promete alteração hormonal.",
      price: null,
      image_url: "/kits/kit-testosterona.png",
      sort_order: 1,
      slugs: KIT_TESTOSTERONA_SLUGS,
    }),
    kitFromSlugs(products, {
      id: "local-kit-ansiedade",
      slug: "kit-ansiedade",
      name: "Kit Ansiedade",
      subtitle: "6 potes da rotina noturna",
      description:
        "Conjunto com Mulungu, GABA, Glicina, Maracujá, Ashuwagandá e Capim Limão. O GABA contém 30 cápsulas; os demais, 60. Não substitui avaliação profissional nem tratamento.",
      price: null,
      image_url: "/kits/kit-ansiedade.png",
      sort_order: 2,
      slugs: KIT_ANSIEDADE_SLUGS,
    }),
  ].filter((k) => k.products.length > 0);
}

export function kitTestosteronaFromCatalog(products: Product[]): Kit {
  return localKitsFromCatalog(products).find((k) => k.slug === "kit-testosterona")!;
}

export const kitsQuery = {
  queryKey: ["kits"],
  queryFn: async (): Promise<Kit[]> => {
    const { data, error } = await supabase
      .from("kits")
      .select(KIT_SELECT)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    const kits = (data ?? []).map((k) => mapKit(k as Record<string, unknown>));
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
