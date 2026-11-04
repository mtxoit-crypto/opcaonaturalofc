import { createServerFn } from "@tanstack/react-start";

const BUCKET = "produtos-midia";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Signs download links only for files registered as catalog media.
 * Storage itself stays admin-only; visitors never read the bucket directly.
 */
export const signProductMedia = createServerFn({ method: "POST" })
  .inputValidator((input: { ids: string[] }) => {
    const ids = Array.isArray(input?.ids) ? input.ids.filter((id) => typeof id === "string" && UUID.test(id)) : [];
    return { ids: ids.slice(0, 200) };
  })
  .handler(async ({ data }) => {
    if (!data.ids.length) return {} as Record<string, string>;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("product_media")
      .select("id,storage_path")
      .in("id", data.ids);
    const stored = (rows ?? []).filter((r) => !/^https:\/\//i.test(r.storage_path));
    if (!stored.length) return {} as Record<string, string>;
    const { data: signed } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrls(stored.map((r) => r.storage_path), 60 * 60 * 24);
    const out: Record<string, string> = {};
    stored.forEach((r, i) => {
      const url = signed?.[i]?.signedUrl;
      if (url) out[r.id] = url;
    });
    return out;
  });
