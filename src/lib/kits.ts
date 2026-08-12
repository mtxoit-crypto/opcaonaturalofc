import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/products";

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
  products: Product[];
};

const PRODUCT_COLUMNS =
  "id,slug,name,subtitle,description,benefits,dosage,capsule_count,price,capsule_color,jar_color,lid_color,image_url,in_stock,is_active,sort_order";

export const kitsQuery = {
  queryKey: ["kits"],
  queryFn: async (): Promise<Kit[]> => {
    const { data, error } = await supabase
      .from("kits")
      .select(
        `id,slug,name,subtitle,description,price,image_url,is_active,sort_order,kit_items(sort_order,products(${PRODUCT_COLUMNS}))`,
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((k: Record<string, unknown>) => {
      const items = (k.kit_items ?? []) as { sort_order: number; products: Product | null }[];
      return {
        ...(k as unknown as Omit<Kit, "products">),
        products: items
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((i) => i.products)
          .filter((p): p is Product => Boolean(p)),
      };
    });
  },
};
