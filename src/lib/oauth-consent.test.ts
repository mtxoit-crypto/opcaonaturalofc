import assert from "node:assert/strict";
import { test } from "node:test";
import { oauthReturnPath } from "./oauth-return-path.ts";
import { loadConsent, decideConsent } from "./oauth-consent.ts";

test("consent return paths preserve queries and fragments and reject external redirects", () => {
  const next = "/.lovable/oauth/consent?authorization_id=abc#decision";
  assert.equal(oauthReturnPath(next), next);
  for (const value of ["//evil.test", "/\\evil.test", "https://evil.test", "/auth\n", null]) {
    assert.equal(oauthReturnPath(value), "/");
  }
});

const details = { client: { name: "Agent" }, redirect_uri: "https://agent.test/callback", scope: "openid email", user: { email: "test@example.test" } };
const api = {
  getAuthorizationDetails: async (_id: string) => ({ data: details, error: null }),
  approveAuthorization: async (_id: string) => ({ data: { redirect_url: "https://agent.test/callback?code=ok" }, error: null }),
  denyAuthorization: async (_id: string) => ({ data: { redirect_url: "https://agent.test/callback?error=access_denied" }, error: null }),
};
test("consent loads client identity", async () => {
  assert.deepEqual(await loadConsent(api, "valid"), { details, redirect: null });
});
test("approve and deny use their distinct provider actions", async () => {
  assert.equal(await decideConsent(api, "valid", true), "https://agent.test/callback?code=ok");
  assert.equal(await decideConsent(api, "valid", false), "https://agent.test/callback?error=access_denied");
});
test("already authorized consent follows the provider redirect", async () => {
  const approved = { ...api, getAuthorizationDetails: api.approveAuthorization };
  assert.equal((await loadConsent(approved, "valid")).redirect, "https://agent.test/callback?code=ok");
});
test("missing, expired and failed requests never become successful authorizations", async () => {
  await assert.rejects(loadConsent(api, ""));
  const fail = async (_id: string) => ({ data: null, error: { message: "provider failed" } });
  await assert.rejects(loadConsent({ ...api, getAuthorizationDetails: fail }, "expired"));
  for (const approve of [true, false]) {
    await assert.rejects(decideConsent({ ...api, approveAuthorization: fail, denyAuthorization: fail }, "valid", approve));
  }
  await assert.rejects(decideConsent({ ...api, approveAuthorization: async () => ({ data: {}, error: null }) }, "valid", true));
});