import { supabase } from "@/integrations/supabase/client";

export type ProductInventory = {
  id: string;
  stock_quantity: number | null;
  low_stock_threshold: number | null;
};

export const productInventoryQuery = (enabled = true) => ({
  queryKey: ["product-inventory"],
  enabled,
  queryFn: async (): Promise<ProductInventory[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("id,stock_quantity,low_stock_threshold");
    if (error) throw error;
    return data ?? [];
  },
});

export function hasNumericInventory(
  row: ProductInventory,
): row is ProductInventory & { stock_quantity: number; low_stock_threshold: number } {
  return row.stock_quantity !== null && row.low_stock_threshold !== null;
}

export function isLowStock(row: ProductInventory) {
  return hasNumericInventory(row) && row.stock_quantity <= row.low_stock_threshold;
}
