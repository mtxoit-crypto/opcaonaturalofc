import { createServerFn } from "@tanstack/react-start";
import { type StripeEnv, stripeRequest, getStripeErrorMessage } from "@/lib/stripe.server";

type CheckoutResult = { clientSecret: string } | { error: string };
type ConfirmResult =
  | { status: "pago" | "pendente"; code: string; total: number }
  | { error: string };

type StripePrice = { id: string; lookup_key: string | null };

/**
 * Cria a sessão de pagamento a partir de um pedido já gravado no banco.
 * Todos os valores vêm do servidor — o frontend nunca define o total.
 */
export const createOrderCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: { orderId: string; returnUrl: string; environment: StripeEnv }) => {
    if (!/^[0-9a-fA-F-]{36}$/.test(data.orderId)) throw new Error("Pedido inválido");
    return data;
  })
  .handler(async ({ data }): Promise<CheckoutResult> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("id,code,customer_email,shipping_fee,total,status")
        .eq("id", data.orderId)
        .maybeSingle();
      if (orderError) throw new Error(orderError.message);
      if (!order) throw new Error("Pedido não encontrado");

      const { data: items, error: itemsError } = await supabaseAdmin
        .from("order_items")
        .select("product_id,product_name,unit_price,quantity")
        .eq("order_id", order.id);
      if (itemsError) throw new Error(itemsError.message);
      if (!items?.length) throw new Error("Pedido sem itens");

      const productIds = items.map((i) => i.product_id).filter(Boolean) as string[];
      const { data: products } = await supabaseAdmin
        .from("products")
        .select("id,slug")
        .in("id", productIds.length ? productIds : ["00000000-0000-0000-0000-000000000000"]);
      const slugById = new Map((products ?? []).map((p) => [p.id, p.slug]));

      const lookupKeys = Array.from(
        new Set(
          items
            .map((i) => (i.product_id ? slugById.get(i.product_id) : null))
            .filter(Boolean)
            .map((slug) => (slug as string).replace(/-/g, "_")),
        ),
      );

      let priceByLookupKey = new Map<string, string>();
      if (lookupKeys.length) {
        const prices = await stripeRequest<{ data: StripePrice[] }>(
          data.environment,
          "GET",
          "/v1/prices",
          { lookup_keys: lookupKeys, limit: 100, active: true },
        );
        priceByLookupKey = new Map(
          prices.data.filter((p) => p.lookup_key).map((p) => [p.lookup_key as string, p.id]),
        );
      }

      const lineItems = items.map((item) => {
        const slug = item.product_id ? slugById.get(item.product_id) : null;
        const priceId = slug ? priceByLookupKey.get(slug.replace(/-/g, "_")) : undefined;
        if (priceId) return { price: priceId, quantity: item.quantity };
        return {
          quantity: item.quantity,
          price_data: {
            currency: "brl",
            unit_amount: Math.round(Number(item.unit_price) * 100),
            product_data: { name: item.product_name },
          },
        };
      });

      const shipping = Math.round(Number(order.shipping_fee) * 100);
      if (shipping > 0) {
        lineItems.push({
          quantity: 1,
          price_data: {
            currency: "brl",
            unit_amount: shipping,
            product_data: { name: "Frete" },
          },
        });
      }

      const session = await stripeRequest<{ client_secret: string | null }>(
        data.environment,
        "POST",
        "/v1/checkout/sessions",
        {
          mode: "payment",
          ui_mode: "embedded_page",
          return_url: data.returnUrl,
          line_items: lineItems,
          ...(order.customer_email ? { customer_email: order.customer_email } : {}),
          payment_intent_data: { description: `Pedido ${order.code} · Opção Natural` },
          metadata: { order_id: order.id, order_code: order.code },
        },
      );

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/** Confirma o pagamento junto ao provedor e marca o pedido como pago no painel. */
export const confirmOrderPayment = createServerFn({ method: "POST" })
  .inputValidator((data: { sessionId: string; environment: StripeEnv }) => {
    if (!/^[a-zA-Z0-9_]+$/.test(data.sessionId)) throw new Error("Sessão inválida");
    return data;
  })
  .handler(async ({ data }): Promise<ConfirmResult> => {
    try {
      const session = await stripeRequest<{
        payment_status: string;
        metadata?: { order_id?: string; order_code?: string };
      }>(data.environment, "GET", `/v1/checkout/sessions/${data.sessionId}`);

      const orderId = session.metadata?.order_id;
      if (!orderId) throw new Error("Pedido não localizado para esta sessão");

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const paid = session.payment_status === "paid";

      if (paid) {
        await supabaseAdmin.from("orders").update({ status: "pago" }).eq("id", orderId);
      }

      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("code,total")
        .eq("id", orderId)
        .maybeSingle();

      return {
        status: paid ? "pago" : "pendente",
        code: order?.code ?? session.metadata?.order_code ?? "",
        total: Number(order?.total ?? 0),
      };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
