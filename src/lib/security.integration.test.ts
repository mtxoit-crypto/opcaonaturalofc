import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";

function query(sql: string): Array<Record<string, unknown>> {
  const result = execFileSync("lovable", ["supabase", "query", sql, "--json"], { encoding: "utf8" });
  return JSON.parse(result).rows;
}

test("retired order creation denies visitors and authenticated clients in both schemas", () => {
  const rows = query(`SELECT n.nspname, role_name,
    has_function_privilege(role_name, p.oid, 'EXECUTE') AS allowed
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    CROSS JOIN (VALUES ('anon'), ('authenticated')) roles(role_name)
    WHERE n.nspname IN ('public', 'private') AND p.proname = 'create_order'`);
  assert.equal(rows.length, 4);
  for (const row of rows) assert.equal(row['allowed'], false, `${row['nspname']}: ${row['role_name']}`);
});

test("invited admin assignment is private and bound to the email confirmation transition", () => {
  const rows = query(`SELECT pn.nspname, t.tgenabled,
    pg_get_triggerdef(t.oid) LIKE '%old.email_confirmed_at IS NULL%' AS starts_unconfirmed,
    pg_get_triggerdef(t.oid) LIKE '%new.email_confirmed_at IS NOT NULL%' AS ends_confirmed,
    has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_allowed,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') AS client_allowed
    FROM pg_trigger t JOIN pg_proc p ON t.tgfoid = p.oid
    JOIN pg_namespace pn ON p.pronamespace = pn.oid
    WHERE t.tgname = 'on_auth_user_confirmed_invited_admin'`);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], {
    nspname: "private", tgenabled: "O", starts_unconfirmed: true,
    ends_confirmed: true, anon_allowed: false, client_allowed: false,
  });
});