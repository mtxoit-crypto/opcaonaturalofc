export type StripeEnv = "sandbox" | "live";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/stripe";

function encode(params: unknown, prefix = "", out: string[] = []): string[] {
  if (params === undefined || params === null) return out;
  if (Array.isArray(params)) {
    params.forEach((value, index) => encode(value, `${prefix}[${index}]`, out));
    return out;
  }
  if (typeof params === "object") {
    for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
      encode(value, prefix ? `${prefix}[${key}]` : key, out);
    }
    return out;
  }
  out.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(params))}`);
  return out;
}

/**
 * Chamadas ao provedor de pagamento passam pelo gateway gerenciado da Lovable.
 * As chaves do projeto são identificadores de conexão, não chaves diretas do provedor.
 */
export async function stripeRequest<T>(
  environment: StripeEnv,
  method: "GET" | "POST",
  path: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const lovableApiKey = process.env["LOVABLE_API_KEY"];
  const connectionKey =
    environment === "live"
      ? process.env["STRIPE_LIVE_API_KEY"]
      : process.env["STRIPE_SANDBOX_API_KEY"];

  if (!lovableApiKey || !connectionKey) {
    throw new Error("Pagamentos não configurados para este ambiente.");
  }

  const body = method === "POST" && params ? encode(params).join("&") : undefined;
  const query = method === "GET" && params ? `?${encode(params).join("&")}` : "";

  const response = await fetch(`${GATEWAY_URL}${path}${query}`, {
    method,
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": connectionKey,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    ...(body ? { body } : {}),
  });

  const text = await response.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* resposta não-JSON */
  }

  if (!response.ok) {
    const message =
      (json as { error?: { message?: string }; message?: string } | null)?.error?.message ??
      (json as { message?: string } | null)?.message ??
      text;
    console.error(`Stripe request failed [${response.status}]: ${text}`);
    throw new Error(message || `Falha no pagamento (${response.status})`);
  }

  return json as T;
}

export function getStripeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Não foi possível iniciar o pagamento. Tente novamente.";
}
