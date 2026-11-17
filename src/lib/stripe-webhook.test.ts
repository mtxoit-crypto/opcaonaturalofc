import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCartMetadata, stripeModeForSecret, verifyStripeSignature } from "./stripe-webhook.ts";

const secret = "whsec_unit_test_secret";

async function sign(payload: string, timestamp: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  const hex = Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `t=${timestamp},v1=${hex}`;
}

test("accepts the exact Stripe webhook payload and rejects a modified body", async () => {
  const timestamp = 1_800_000_000;
  const payload = '{"type":"checkout.session.completed"}';
  const header = await sign(payload, timestamp);

  assert.equal(await verifyStripeSignature(payload, header, secret, timestamp), true);
  assert.equal(await verifyStripeSignature(`${payload} `, header, secret, timestamp), false);
});

test("rejects missing and stale webhook signatures", async () => {
  const now = 1_800_000_000;
  const header = await sign("{}", now - 301);

  assert.equal(await verifyStripeSignature("{}", null, secret, now), false);
  assert.equal(await verifyStripeSignature("{}", header, secret, now), false);
});

test("parses bounded product cart metadata", () => {
  const firstId = "b013662d-f85a-4fae-8ea4-1eff9b7f460a";
  const secondId = "cde912ec-c571-4eac-b9c3-a4b329872d70";
  assert.deepEqual(parseCartMetadata(`${firstId}:2,${secondId}:1`), [
    { product_id: firstId, quantity: 2 },
    { product_id: secondId, quantity: 1 },
  ]);
  assert.equal(parseCartMetadata(`${firstId}:0`), null);
  assert.equal(parseCartMetadata(`${firstId}:100`), null);
  assert.equal(parseCartMetadata(`${firstId}:1,${firstId}:2`), null);
  assert.equal(parseCartMetadata("invalid:1"), null);
});

test("selects only a valid Stripe key mode", () => {
  assert.equal(stripeModeForSecret("sk_test_example123"), "test");
  assert.equal(stripeModeForSecret("sk_live_example123"), "live");
  assert.equal(stripeModeForSecret(undefined), null);
  assert.equal(stripeModeForSecret("pk_live_example123"), null);
});
