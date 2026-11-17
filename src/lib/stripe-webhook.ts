const encoder = new TextEncoder();

export function stripeModeForSecret(secret: string | undefined): "live" | "test" | null {
  if (!secret || !/^sk_(test|live)_[A-Za-z0-9]+$/.test(secret)) return null;
  return secret.startsWith("sk_live_") ? "live" : "test";
}

function toHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  if (!header || !secret) return false;
  const parts = header.split(",").map((part) => part.trim().split("=", 2));
  const timestamp = parts.find((part) => part[0] === "t")?.[1];
  const signatures = parts
    .filter((part) => part[0] === "v1")
    .map((part) => part[1])
    .filter((signature): signature is string => typeof signature === "string");
  if (!timestamp || !/^\d+$/.test(timestamp) || signatures.length === 0) return false;
  const signedAt = Number(timestamp);
  if (!Number.isSafeInteger(signedAt) || Math.abs(nowSeconds - signedAt) > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = toHex(
    await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${payload}`)),
  );
  return signatures.some(
    (signature) => /^[a-f\d]{64}$/i.test(signature) && constantTimeEqual(signature, digest),
  );
}

export function parseCartMetadata(value: string | undefined) {
  if (!value || value.length > 500) return null;
  const pairs = value.split(",");
  if (pairs.length === 0 || pairs.length > 10) return null;
  const items: Array<{ product_id: string; quantity: number }> = [];
  const seen = new Set<string>();
  for (const pair of pairs) {
    const [productId, rawQuantity, ...extra] = pair.split(":");
    if (
      extra.length > 0 ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        productId ?? "",
      ) ||
      !/^[1-9]\d{0,1}$/.test(rawQuantity ?? "") ||
      seen.has(productId ?? "")
    ) {
      return null;
    }
    const quantity = Number(rawQuantity);
    if (quantity > 99) return null;
    seen.add(productId!);
    items.push({ product_id: productId!, quantity });
  }
  return items;
}
