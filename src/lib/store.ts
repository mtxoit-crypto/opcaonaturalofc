import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/lib/cart";
import { formatPrice } from "@/lib/products";

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
        whatsapp_number: "5500000000000",
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

export async function createOrder(address: CheckoutAddress, items: CartItem[]) {
  const { data, error } = await supabase.rpc("create_order", {
    _customer_name: address.customer_name,
    _customer_phone: address.customer_phone,
    _customer_email: address.customer_email || null,
    _zip_code: address.zip_code,
    _street: address.street,
    _number: address.number,
    _complement: address.complement || null,
    _district: address.district,
    _city: address.city,
    _state: address.state,
    _notes: address.notes || null,
    _items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Não foi possível criar o pedido.");
  return {
    id: row.id as string,
    code: row.code as string,
    subtotal: Number(row.subtotal),
    shipping_fee: Number(row.shipping_fee),
    total: Number(row.total),
  };
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
