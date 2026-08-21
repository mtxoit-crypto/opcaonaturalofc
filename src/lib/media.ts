import { supabase } from "@/integrations/supabase/client";

export type ProductMedia = {
  id: string;
  product_id: string;
  storage_path: string;
  media_type: string;
  alt: string | null;
  sort_order: number;
  url: string;
};

export const MEDIA_BUCKET = "produtos-midia";

async function withUrls(
  rows: Omit<ProductMedia, "url">[] | null,
): Promise<ProductMedia[]> {
  if (!rows?.length) return [];
  const { data } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrls(rows.map((r) => r.storage_path), 60 * 60 * 24);
  return rows.map((r, i) => ({ ...r, url: data?.[i]?.signedUrl ?? "" })).filter((r) => r.url);
}

export const productMediaQuery = (productId: string | undefined) => ({
  queryKey: ["product-media", productId],
  enabled: Boolean(productId),
  queryFn: async (): Promise<ProductMedia[]> => {
    if (!productId) return [];
    const { data, error } = await supabase
      .from("product_media")
      .select("id,product_id,storage_path,media_type,alt,sort_order")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return withUrls(data as Omit<ProductMedia, "url">[]);
  },
});

export function mediaTypeFor(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "glb" || ext === "gltf") return "model";
  if (file.type.startsWith("video")) return "video";
  return "image";
}

export async function uploadProductMedia(productId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${productId}/${crypto.randomUUID()}.${ext}`;
  const type = mediaTypeFor(file);
  const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    contentType: type === "model" ? "model/gltf-binary" : file.type,
    upsert: false,
  });
  if (upErr) throw upErr;
  const { error } = await supabase.from("product_media").insert({
    product_id: productId,
    storage_path: path,
    media_type: type,
    alt: file.name,
  });
  if (error) throw error;
}

export async function publicMediaUrl(storagePath: string) {
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function deleteProductMedia(media: ProductMedia) {
  await supabase.storage.from(MEDIA_BUCKET).remove([media.storage_path]);
  const { error } = await supabase.from("product_media").delete().eq("id", media.id);
  if (error) throw error;
}
