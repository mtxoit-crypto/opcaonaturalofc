import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import type { Database } from "@/integrations/supabase/types";

function projectUrl() {
  const url = process.env['SUPABASE_URL'] ?? import.meta.env['VITE_SUPABASE_URL'];
  if (!url) throw new Error("Database URL is not configured");
  return url;
}

function publishableKey() {
  const direct = process.env['SUPABASE_PUBLISHABLE_KEY'] ?? import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
  if (direct) return direct;
  const dictionary = process.env['SUPABASE_PUBLISHABLE_KEYS'];
  if (dictionary) {
    try {
      const parsed: unknown = JSON.parse(dictionary);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const keys = parsed as Record<string, unknown>;
        const key = [keys.default, ...Object.values(keys)].find((value): value is string => typeof value === "string" && value.startsWith("sb_publishable_"));
        if (key) return key;
      }
    } catch { /* A legacy key may still be configured. */ }
  }
  const legacy = process.env['SUPABASE_ANON_KEY'] ?? import.meta.env['VITE_SUPABASE_ANON_KEY'];
  if (legacy) return legacy;
  throw new Error("Database publishable key is not configured");
}

export function supabaseForUser(ctx: ToolContext) {
  const token = ctx.getToken();
  if (!token) throw new Error("Verified OAuth token required");
  return createClient<Database>(projectUrl(), publishableKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}