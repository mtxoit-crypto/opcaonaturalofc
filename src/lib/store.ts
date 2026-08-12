import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/lib/cart";
import { formatPrice } from "@/lib/products";

export type StoreSettings = {
  whatsapp_number: string;
  pix_key: string | null;
  shipping_fee: number;
  free_shipping_min: number;
};

export const storeSettingsQuery = {
  queryKey: ["store-settings"],
  queryFn: async (): Promise<StoreSettings> => {
    const { data, error } = await supabase
      .from("store_settings")
      .select("whatsapp_number,pix_key,shipping_fee,free_shipping_min")
      .maybeSingle();
    if (error) throw error;
    return (
      (data as StoreSettings) ?? {
        whatsapp_number: "5500000000000",
        pix_key: null,
        shipping_fee: 19.9,
        free_shipping_min: 199,
      }
    );
  },
};

export type CheckoutAddress = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  notes: string;
};

export function shippingFor(subtotal: number, settings: StoreSettings) {
  if (subtotal <= 0) return 0;
  if (settings.free_shipping_min > 0 && subtotal >= settings.free_shipping_min) return 0;
  return Number(settings.shipping_fee ?? 0);
}

export async function lookupCep(cep: string) {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    erro?: boolean;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  };
  if (data.erro) return null;
  return {
    street: data.logradouro ?? "",
    district: data.bairro ?? "",
    city: data.localidade ?? "",
    state: data.uf ?? "",
  };
}

export async function createOrder(
  address: CheckoutAddress,
  items: CartItem[],
  subtotal: number,
  shipping_fee: number,
) {
  const { data, error } = await supabase
    .from("orders")
    .insert({
      customer_name: address.customer_name,
      customer_phone: address.customer_phone,
      customer_email: address.customer_email || null,
      zip_code: address.zip_code,
      street: address.street,
      number: address.number,
      complement: address.complement || null,
      district: address.district,
      city: address.city,
      state: address.state,
      notes: address.notes || null,
      payment_method: "pix",
      subtotal,
      shipping_fee,
      total: subtotal + shipping_fee,
    })
    .select("id,code")
    .single();
  if (error) throw error;

  const { error: itemsError } = await supabase.from("order_items").insert(
    items.map((i) => ({
      order_id: data.id,
      product_id: i.id,
      product_name: i.name,
      unit_price: i.price,
      quantity: i.quantity,
    })),
  );
  if (itemsError) throw itemsError;

  return data as { id: string; code: string };
}

export function whatsappLink(
  settings: StoreSettings,
  code: string,
  address: CheckoutAddress,
  items: CartItem[],
  subtotal: number,
  shipping_fee: number,
) {
  const lines = [
    `Olá! Quero finalizar meu pedido *${code}* na Opção Natural.`,
    "",
    "*Itens:*",
    ...items.map((i) => `• ${i.quantity}x ${i.name} — ${formatPrice(i.price * i.quantity)}`),
    "",
    `Subtotal: ${formatPrice(subtotal)}`,
    `Frete: ${shipping_fee === 0 ? "Grátis" : formatPrice(shipping_fee)}`,
    `*Total: ${formatPrice(subtotal + shipping_fee)}*`,
    "",
    "*Pagamento:* Pix",
    "",
    "*Entrega:*",
    address.customer_name,
    `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ""}`,
    `${address.district} · ${address.city}/${address.state} · CEP ${address.zip_code}`,
    address.customer_phone,
    address.notes ? `Obs.: ${address.notes}` : "",
  ].filter(Boolean);

  const phone = settings.whatsapp_number.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}
