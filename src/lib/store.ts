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

/** Digits for wa.me when a real store WhatsApp is configured; otherwise null. */
export function whatsappDigits(value: string | undefined | null) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (/^55?0+$/.test(digits) || digits.includes("000000")) return null;
  return digits;
}

export function whatsappHref(value: string | undefined | null, text?: string) {
  const digits = whatsappDigits(value);
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  if (!text?.trim()) return base;
  return `${base}?text=${encodeURIComponent(text.trim())}`;
}
