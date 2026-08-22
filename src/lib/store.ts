import { supabase } from "@/integrations/supabase/client";

export type StoreSettings = {
  whatsapp_number: string;
  shipping_fee: number;
  free_shipping_min: number;
};

export const storeSettingsQuery = {
  queryKey: ["store-settings"],
  queryFn: async (): Promise<StoreSettings> => {
    const { data, error } = await supabase
      .from("store_settings")
      .select("whatsapp_number,shipping_fee,free_shipping_min")
      .maybeSingle();
    if (error) throw error;
    return (
      (data as StoreSettings) ?? {
        whatsapp_number: "",
        shipping_fee: 0,
        free_shipping_min: 0,
      }
    );
  },
};
