import { createFileRoute } from "@tanstack/react-router";
import { isStripeCheckoutUrl, LOVABLE_STOREFRONT_ORIGIN, SITE_ORIGIN } from "@/lib/site";
import { stripeModeForSecret } from "@/lib/stripe-webhook";

type CartRequest = {
  cep?: unknown;
  idempotencyKey?: unknown;
  items?: unknown;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  price: number | string | null;
  stock_quantity: number | null;
  is_active: boolean;
};

function checkoutHeaders(request: Request) {
  const headers = new Headers({ "cache-control": "no-store", vary: "Origin" });
  if (new URL(request.url).origin === SITE_ORIGIN &&
    request.headers.get("origin") === LOVABLE_STOREFRONT_ORIGIN) {
    headers.set("access-control-allow-origin", LOVABLE_STOREFRONT_ORIGIN);
  }
  return headers;
}

function json(request: Request, data: Record<string, unknown>, status = 200) {
  return Response.json(data, { status, headers: checkoutHeaders(request) });
}

async function readJsonLimited(request: Request, maxBytes: number): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("empty");
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new RangeError("large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function checkoutStatus(request: Request) {
  const mode = stripeModeForSecret(process.env["STRIPE_SECRET_KEY"]);
  const origin = new URL(request.url).origin;
  const allowedOrigin = process.env["STRIPE_CHECKOUT_ORIGIN"] || SITE_ORIGIN;
  const requiredMode = origin === SITE_ORIGIN ? "live" : process.env["STRIPE_CHECKOUT_MODE"];
  if (!mode || mode !== requiredMode || origin !== allowedOrigin ||
      !process.env["STRIPE_WEBHOOK_SECRET"]?.startsWith("whsec_")) return { available: false, reason: "payment_configuration" };
  const { checkoutDatabase, CheckoutBridgeError } = await import("@/lib/checkout-database.server");
  try {
    if ((await checkoutDatabase({ operation: "ready" })) === true) return { available: true };
  } catch (error) {
    if (error instanceof CheckoutBridgeError) {
      return { available: false, reason: "order_database", upstreamStatus: error.status };
    }
  }
  return { available: false, reason: "order_database" };

}

export const Route = createFileRoute("/api/stripe/checkout")({
  server: {
    handlers: {
      OPTIONS: ({ request }) => {
        const headers = checkoutHeaders(request);
        if (!headers.has("access-control-allow-origin")) return new Response(null, { status: 403, headers });
        headers.set("access-control-allow-methods", "GET, POST, OPTIONS");
        headers.set("access-control-allow-headers", "Content-Type");
        return new Response(null, { status: 204, headers });
      },
      GET: async ({ request }) => {
        const session = new URL(request.url).searchParams.get("session_id");
        if (session === null) return json(request, await checkoutStatus(request));
        if (!/^cs_(live|test)_[A-Za-z0-9]{16,200}$/.test(session)) return json(request, { confirmed: false }, 400);
        try {
          const { checkoutDatabase } = await import("@/lib/checkout-database.server");
          return json(request, { confirmed: (await checkoutDatabase({ operation: "confirm", session })) === true });
        } catch {
          return json(request, { confirmed: false }, 503);
        }
      },
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        const serverOrigin = new URL(request.url).origin;
        if (!origin || (origin !== serverOrigin && !checkoutHeaders(request).has("access-control-allow-origin"))) {
          return json(request, { error: "Origem inválida." }, 403);
        }
        if (
          request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() !==
          "application/json"
        ) {
          return json(request, { error: "Formato de pedido inválido." }, 415);
        }
        const contentLength = Number(request.headers.get("content-length") ?? 0);
        if (contentLength > 16_000) return json(request, { error: "Pedido muito grande." }, 413);

        let input: CartRequest;
        try {
          input = (await readJsonLimited(request, 16_000)) as CartRequest;
        } catch (error) {
          if (error instanceof RangeError) return json(request, { error: "Pedido muito grande." }, 413);
          return json(request, { error: "Não foi possível ler o pedido." }, 400);
        }

        if (!input || typeof input !== "object") return json(request, { error: "Pedido inválido." }, 400);
        const cep = typeof input.cep === "string" ? input.cep.replace(/\D/g, "") : "";
        if (
          !/^\d{8}$/.test(cep) ||
          !Array.isArray(input.items) ||
          input.items.length === 0 ||
          input.items.length > 10
        ) {
          return json(request, { error: "Carrinho ou CEP inválido." }, 400);
        }
        if (
          typeof input.idempotencyKey !== "string" ||
          !/^[0-9a-f-]{36}$/i.test(input.idempotencyKey)
        ) {
          return json(request, { error: "Identificador de checkout inválido." }, 400);
        }
        const quantities = new Map<string, number>();
        for (const entry of input.items) {
          if (!entry || typeof entry !== "object")
            return json(request, { error: "Item inválido no carrinho." }, 400);
          const row = entry as { slug?: unknown; quantity?: unknown };
          if (
            typeof row.slug !== "string" ||
            !/^[a-z0-9-]{2,80}$/.test(row.slug) ||
            typeof row.quantity !== "number" ||
            !Number.isInteger(row.quantity) ||
            row.quantity < 1 ||
            row.quantity > 99
          ) {
            return json(request, { error: "Item inválido no carrinho." }, 400);
          }
          quantities.set(row.slug, Math.min(99, (quantities.get(row.slug) ?? 0) + row.quantity));
        }
        if (quantities.size > 10)
          return json(request, { error: "O carrinho pode ter até 10 produtos diferentes." }, 400);

        const stripeSecret = process.env["STRIPE_SECRET_KEY"];
        if (!(await checkoutStatus(request)).available) {
          return json(request, { error: "Checkout Stripe não está configurado pela loja." }, 503);
        }
        try {
          const { checkoutDatabase } = await import("@/lib/checkout-database.server");
          const { products, zones, settings } = await checkoutDatabase({
            operation: "catalog",
            slugs: [...quantities.keys()],
          });

          const productsBySlug = new Map(
            (products as ProductRow[]).map((product) => [product.slug, product]),
          );
          const lines = [] as Array<{ product: ProductRow; quantity: number; unitAmount: number }>;
          for (const [slug, quantity] of quantities) {
            const product = productsBySlug.get(slug);
            if (
              !product ||
              !product.is_active ||
              product.price === null ||
              Number(product.price) <= 0
            ) {
              return json(request, { error: "Um produto do carrinho não está disponível." }, 409);
            }
            if (product.stock_quantity === null || product.stock_quantity < quantity) {
              return json(request, { error: `${product.name} está sem estoque suficiente.` }, 409);
            }
            const unitAmount = Math.round(Number(product.price) * 100);
            if (!Number.isSafeInteger(unitAmount) || unitAmount < 1)
              return json(request, { error: "Preço inválido no catálogo." }, 409);
            lines.push({ product, quantity, unitAmount });
          }

          const zone = zones.find(
            (candidate) => Number(cep) >= candidate.cep_start && Number(cep) <= candidate.cep_end,
          );
          if (!zone)
            return json(request, { error: "Ainda não temos entrega cadastrada para este CEP." }, 422);
          const subtotalCents = lines.reduce(
            (sum, line) => sum + line.unitAmount * line.quantity,
            0,
          );
          const freeShippingMin = Math.round(Number(settings?.free_shipping_min ?? 0) * 100);
          const shippingCents =
            freeShippingMin > 0 && subtotalCents >= freeShippingMin
              ? 0
              : Math.round(Number(zone.fee) * 100);
          if (!Number.isSafeInteger(subtotalCents + shippingCents))
            return json(request, { error: "Total do pedido inválido." }, 409);

          const metadataCart = lines
            .map(({ product, quantity }) => `${product.id}:${quantity}`)
            .join(",");
          const params = new URLSearchParams();
          params.set("mode", "payment");
          params.set(
            "success_url",
            `${origin}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
          );
          params.set("cancel_url", `${origin}/checkout?cancelled=1`);
          params.set("shipping_address_collection[allowed_countries][0]", "BR");
          params.set("phone_number_collection[enabled]", "true");
          params.set("payment_method_types[0]", "card");
          params.set("payment_method_types[1]", "pix");
          params.set("metadata[store]", "opcao-natural");
          params.set("custom_text[shipping_address][message]", `Use o CEP ${cep} para a entrega com o frete calculado.`);
          params.set("metadata[cart]", metadataCart);
          params.set("metadata[cep]", cep);
          params.set("metadata[shipping_cents]", String(shippingCents));
          params.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
          params.set("shipping_options[0][shipping_rate_data][display_name]", zone.name);
          params.set(
            "shipping_options[0][shipping_rate_data][fixed_amount][amount]",
            String(shippingCents),
          );
          params.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "brl");
          params.set("custom_fields[0][key]", "address_number");
          params.set("custom_fields[0][label][type]", "custom");
          params.set("custom_fields[0][label][custom]", "Número");
          params.set("custom_fields[0][type]", "text");
          params.set("custom_fields[0][optional]", "false");
          params.set("custom_fields[1][key]", "district");
          params.set("custom_fields[1][label][type]", "custom");
          params.set("custom_fields[1][label][custom]", "Bairro");
          params.set("custom_fields[1][type]", "text");
          params.set("custom_fields[1][optional]", "false");
          lines.forEach(({ product, quantity, unitAmount }, index) => {
            params.set(`line_items[${index}][price_data][currency]`, "brl");
            params.set(`line_items[${index}][price_data][unit_amount]`, String(unitAmount));
            params.set(`line_items[${index}][price_data][product_data][name]`, product.name);
            params.set(`line_items[${index}][quantity]`, String(quantity));
          });

          const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
            method: "POST",
            headers: {
              authorization: `Bearer ${stripeSecret}`,
              "content-type": "application/x-www-form-urlencoded",
              "idempotency-key": `opcaonatural-${input.idempotencyKey}`,
            },
            body: params,
          });
          const session = (await stripeResponse.json()) as {
            id?: string;
            url?: string;
            error?: { message?: string };
          };
          if (!stripeResponse.ok || !isStripeCheckoutUrl(session.url) || !session.id) {
            console.error(
              "Stripe Checkout Session creation failed",
              stripeResponse.status,
              session.error?.message,
            );
            return json(
              request,
              { error: "A Stripe não conseguiu abrir o pagamento. Tente novamente." },
              502,
            );
          }
          return json(request, { url: session.url, sessionId: session.id });
        } catch (error) {
          console.error("Stripe checkout request failed", error);
          return json(request, { error: "Não foi possível abrir o pagamento agora." }, 503);
        }
      },
    },
  },
});
