import { createFileRoute } from "@tanstack/react-router";
import { parseCartMetadata, stripeModeForSecret, verifyStripeSignature } from "@/lib/stripe-webhook";

type StripeCheckoutSession = {
  id?: string;
  mode?: string;
  currency?: string;
  payment_status?: string;
  amount_total?: number;
  customer_details?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  customer_email?: string | null;
  shipping_details?: {
    address?: StripeAddress | null;
  } | null;
  collected_information?: {
    shipping_details?: {
      address?: StripeAddress | null;
    } | null;
  } | null;
  custom_fields?: Array<{
    key?: string;
    text?: { value?: string | null } | null;
  }>;
  metadata?: Record<string, string | undefined>;
};

type StripeAddress = {
  line1?: string | null;
  line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  state?: string | null;
};

type StripeEvent = {
  type?: string;
  livemode?: boolean;
  data?: { object?: StripeCheckoutSession };
};

function json(status: number) {
  return Response.json(
    { received: status < 400 },
    { status, headers: { "cache-control": "no-store" } },
  );
}

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("stripe-signature");
        const signingSecret = process.env["STRIPE_WEBHOOK_SECRET"];
        if (!signingSecret || !signature) return json(400);
        const declaredLength = Number(request.headers.get("content-length") ?? 0);
        if (declaredLength > 512_000) return json(413);

        const rawBody = await request.text();
        if (rawBody.length > 512_000) return json(413);
        if (!(await verifyStripeSignature(rawBody, signature, signingSecret))) return json(400);

        let event: StripeEvent;
        try {
          event = JSON.parse(rawBody) as StripeEvent;
        } catch {
          return json(400);
        }
        const stripeSecret = process.env["STRIPE_SECRET_KEY"];
        const configuredMode = stripeModeForSecret(stripeSecret);
        const expectedLiveMode = configuredMode === "live";
        if (
          !configuredMode ||
          event.livemode !== expectedLiveMode
        ) return json(400);
        if (
          event.type !== "checkout.session.completed" &&
          event.type !== "checkout.session.async_payment_succeeded"
        ) {
          return json(200);
        }

        const session = event.data?.object;
        if (!session || session.mode !== "payment" || session.payment_status !== "paid")
          return json(200);
        if (session.metadata?.["store"] !== "opcao-natural" && !session.metadata?.["cart"])
          return json(200);
        const sessionId = session.id ?? "";
        const cep = session.metadata?.["cep"]?.replace(/\D/g, "") ?? "";
        const items = parseCartMetadata(session.metadata?.["cart"]);
        const address =
          session.collected_information?.shipping_details?.address ??
          session.shipping_details?.address;
        const custom = new Map(
          (session.custom_fields ?? []).map((field) => [
            field.key ?? "",
            field.text?.value?.trim() ?? "",
          ]),
        );
        const postalCode = address?.postal_code?.replace(/\D/g, "") ?? "";
        const customerName = session.customer_details?.name?.trim() ?? "";
        const customerPhone = session.customer_details?.phone?.trim() ?? "";
        const amount = session.amount_total;

        if (
          !new RegExp(`^cs_${configuredMode}_[A-Za-z0-9]+$`).test(sessionId) ||
          session.currency?.toLowerCase() !== "brl" ||
          !/^\d{8}$/.test(cep) ||
          !/^\d{8}$/.test(postalCode) ||
          !items ||
          !Number.isSafeInteger(amount) ||
          !address?.line1?.trim() ||
          !custom.get("address_number") ||
          !custom.get("district") ||
          !address.city?.trim() ||
          !address.state?.trim() ||
          !customerName ||
          !customerPhone
        ) {
          console.error("Stripe completed session failed validation", sessionId);
          return json(400);
        }

        const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
        if (!serviceKey) return json(500);
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const rpc = supabaseAdmin.rpc.bind(supabaseAdmin) as unknown as (
            fn: string,
            args: Record<string, unknown>,
          ) => Promise<{ error: { code?: string; message?: string } | null }>;
          const { error } = await rpc("record_stripe_checkout_order", {
            _stripe_session_id: sessionId,
            _customer_name: customerName,
            _customer_phone: customerPhone,
            _customer_email: session.customer_details?.email ?? session.customer_email ?? null,
            // The database recomputes freight for the actual delivery address.
            _zip_code: postalCode,
            _street: address.line1,
            _number: custom.get("address_number")!,
            _complement: address.line2 ?? null,
            _district: custom.get("district")!,
            _city: address.city,
            _state: address.state,
            _items: items,
            _amount_total_cents: amount!,
          });
          if (error) {
            console.error("Stripe order recording failed", error.code, error.message);
            return json(500);
          }
          return json(200);
        } catch (error) {
          console.error("Stripe order recording failed", error);
          return json(500);
        }
      },
    },
  },
});
