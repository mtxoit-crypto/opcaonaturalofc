import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const checkoutBridgePath = "/api/stripe/database-bridge";

import type { Database } from "@/integrations/supabase/types";

type GeneratedOrderArgs = Database["public"]["Functions"]["record_stripe_checkout_order"]["Args"];
type OrderArgs = Omit<GeneratedOrderArgs, "_customer_email" | "_complement"> & {
  _customer_email: string | null;
  _complement: string | null;
};
type BridgeRequest =
  | { operation: "ready" }
  | { operation: "confirm"; session: string }
  | { operation: "catalog"; slugs: string[] }
  | { operation: "record"; args: OrderArgs };

async function execute(input: BridgeRequest) {
  switch (input.operation) {
    case "ready": {
      const { data, error } = await supabaseAdmin.rpc("stripe_checkout_ready");
      if (error) throw new Error("Checkout database readiness check failed");
      return data === true;
    }
    case "confirm": {
      if (!/^cs_(test|live)_[A-Za-z0-9]{16,200}$/.test(input.session)) throw new Error("Invalid session");
      const { data, error } = await supabaseAdmin.from("orders").select("id")
        .eq("external_order_id", input.session).eq("payment_method", "stripe")
        .eq("payment_status", "paid").maybeSingle();
      if (error) throw new Error("Checkout order lookup failed");
      return Boolean(data);
    }
    case "catalog": {
      if (!Array.isArray(input.slugs) || input.slugs.length < 1 || input.slugs.length > 10 ||
        input.slugs.some(slug => typeof slug !== "string" || !/^[a-z0-9-]{2,80}$/.test(slug))) {
        throw new Error("Invalid catalog request");
      }
      const [products, zones, settings] = await Promise.all([
        supabaseAdmin.from("products").select("id,slug,name,price,stock_quantity,is_active").in("slug", input.slugs),
        supabaseAdmin.from("shipping_zones").select("name,cep_start,cep_end,fee").order("sort_order"),
        supabaseAdmin.from("store_settings").select("free_shipping_min").maybeSingle(),
      ]);
      if (products.error || zones.error || settings.error || !products.data || !zones.data) throw new Error("Checkout catalog lookup failed");
      return { products: products.data, zones: zones.data, settings: settings.data };
    }
    case "record": {
      const { error } = await supabaseAdmin.rpc("record_stripe_checkout_order", input.args as GeneratedOrderArgs);
      if (error) throw new Error("Checkout order recording failed");
      return true;
    }
    default:
      throw new Error("Unknown checkout database operation");
  }
}

type Catalog = Exclude<Awaited<ReturnType<typeof execute>>, boolean>;
export function checkoutDatabase(input: Extract<BridgeRequest, { operation: "catalog" }>): Promise<Catalog>;
export function checkoutDatabase(input: Exclude<BridgeRequest, { operation: "catalog" }>): Promise<boolean>;
export async function checkoutDatabase(input: BridgeRequest) {
  const bridge = process.env["STRIPE_DB_BRIDGE_URL"];
  if (!bridge) return execute(input);
  const secret = process.env["CHECKOUT_BRIDGE_SECRET"];
  const url = new URL(bridge);
  if (!secret || secret.length < 43 || url.protocol !== "https:" || url.pathname !== checkoutBridgePath ||
    url.username || url.password || url.search || url.hash) throw new Error("Invalid checkout bridge configuration");
  const response = await fetch(url, {
    method: "POST",
    redirect: "error",
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Checkout database bridge failed");
  return response.json();
}

export async function handleCheckoutBridge(request: Request) {
  const reply = (data: unknown, status = 200) => Response.json(data, {
    status, headers: { "cache-control": "no-store" },
  });
  const secret = process.env["CHECKOUT_BRIDGE_SECRET"];
  if (request.method !== "POST" || !secret || secret.length < 43 ||
    !process.env["SUPABASE_SERVICE_ROLE_KEY"] || process.env["STRIPE_DB_BRIDGE_URL"]) return reply(null, 404);
  const expected = `Bearer ${secret}`;
  const provided = request.headers.get("authorization") ?? "";
  let difference = expected.length ^ provided.length;
  for (let index = 0; index < expected.length; index++) {
    difference |= expected.charCodeAt(index) ^ (provided.charCodeAt(index) || 0);
  }
  if (difference !== 0) return reply(null, 401);

  try {
    const reader = request.body?.getReader();
    if (!reader) return reply(null, 400);
    const decoder = new TextDecoder();
    let body = "";
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 16_384) {
        await reader.cancel();
        return reply(null, 413);
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    return reply(await execute(JSON.parse(body) as BridgeRequest));
  } catch {
    return reply(null, 503);
  }
}
