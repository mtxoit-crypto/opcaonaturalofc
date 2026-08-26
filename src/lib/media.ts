import { supabase } from "@/integrations/supabase/client";

import {
  assertMediaFile,
  assertVideoUrl,
  mediaMimeTypeFor,
} from "./media-validation";
import type { MediaType } from "./media-validation";

export {
  assertMediaFile,
  assertVideoUrl,
  IMAGE_MAX_BYTES,
  mediaMimeTypeFor,
  mediaTypeFor,
  MODEL_MAX_BYTES,
  partitionMediaFiles,
  VIDEO_MAX_BYTES,
} from "./media-validation";
export type { MediaFile, MediaType } from "./media-validation";

export type ProductMedia = {
  id: string;
  product_id: string;
  storage_path: string;
  media_type: MediaType;
  alt: string | null;
  sort_order: number;
  url: string;
};

export type MediaUploadStage = "validating" | "uploading" | "saving" | "complete";
export type MediaUploadProgress = {
  stage: MediaUploadStage;
  progress: number;
};
export type MediaUploadOptions = {
  onProgress?: (progress: MediaUploadProgress) => void;
};

export const MEDIA_BUCKET = "produtos-midia";

export function isRemoteMediaPath(path: string) {
  return /^https:\/\//i.test(path);
}

export function isDatabaseProductId(id: string | undefined | null) {
  return Boolean(
    id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
  );
}

async function withUrls(rows: Array<Omit<ProductMedia, "url">> | null): Promise<ProductMedia[]> {
  if (!rows?.length) return [];
  const stored = rows.filter((r) => !isRemoteMediaPath(r.storage_path));
  const { data } = stored.length
    ? await supabase.storage
        .from(MEDIA_BUCKET)
        .createSignedUrls(
          stored.map((r) => r.storage_path),
          60 * 60 * 24,
        )
    : { data: [] as { signedUrl?: string }[] };
  const signed = new Map(stored.map((r, i) => [r.id, data?.[i]?.signedUrl ?? ""]));
  return rows
    .map((r) => ({
      ...r,
      url: isRemoteMediaPath(r.storage_path) ? r.storage_path : (signed.get(r.id) ?? ""),
    }))
    .filter((r) => r.url);
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

export const productMediaLibraryQuery = (enabled = true) => ({
  queryKey: ["product-media-library"],
  enabled,
  queryFn: async (): Promise<ProductMedia[]> => {
    const { data, error } = await supabase
      .from("product_media")
      .select("id,product_id,storage_path,media_type,alt,sort_order")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return withUrls((data ?? []) as Omit<ProductMedia, "url">[]);
  },
});

async function nextSortOrder(productId: string) {
  const { data } = await supabase
    .from("product_media")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1);
  return (data?.[0]?.sort_order ?? -1) + 1;
}

export async function uploadProductMedia(
  productId: string,
  file: File,
  options: MediaUploadOptions = {},
) {
  const report = (stage: MediaUploadStage, progress: number) =>
    options.onProgress?.({ stage, progress });
  report("validating", 0);
  const type = assertMediaFile(file);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${productId}/${crypto.randomUUID()}.${ext}`;
  const sort_order = await nextSortOrder(productId);
  report("uploading", 20);
  const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    contentType: type === "model" ? "model/gltf-binary" : mediaMimeTypeFor(file) || file.type,
    upsert: false,
  });
  if (upErr) throw upErr;
  report("saving", 75);
  const { error } = await supabase.from("product_media").insert({
    product_id: productId,
    storage_path: path,
    media_type: type,
    alt: file.name,
    sort_order,
  });
  if (error) {
    await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    throw error;
  }
  report("complete", 100);
  return { type, path };
}

export async function addProductVideoUrl(productId: string, rawUrl: string) {
  const url = assertVideoUrl(rawUrl);
  const sort_order = await nextSortOrder(productId);
  const { error } = await supabase.from("product_media").insert({
    product_id: productId,
    storage_path: url,
    media_type: "video",
    alt: "Vídeo do produto",
    sort_order,
  });
  if (error) throw error;
}

export async function reorderProductMedia(orderedIds: string[]) {
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("product_media").update({ sort_order: index }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

export async function updateProductMediaAlt(mediaId: string, alt: string) {
  const { error } = await supabase
    .from("product_media")
    .update({ alt: alt.trim() || null })
    .eq("id", mediaId);
  if (error) throw error;
}

export async function setProductCover(productId: string, imageUrl: string) {
  const { error } = await supabase.from("products").update({ image_url: imageUrl }).eq("id", productId);
  if (error) throw error;
}

export async function publicMediaUrl(storagePath: string) {
  if (isRemoteMediaPath(storagePath)) return storagePath;
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function replaceProductMedia(
  productId: string,
  previous: ProductMedia,
  file: File,
  options: MediaUploadOptions & { setCover?: boolean } = {},
) {
  const uploaded = await uploadProductMedia(productId, file, options);
  let coverUpdated = false;
  try {
    if (options.setCover) {
      await setProductCover(productId, await publicMediaUrl(uploaded.path));
      coverUpdated = true;
    }
    await deleteProductMedia(previous);
  } catch (error) {
    // Keep a successfully published replacement if only cleanup of the old
    // object failed; rolling it back would leave the cover pointing nowhere.
    if (!coverUpdated) {
      await supabase
        .from("product_media")
        .delete()
        .eq("product_id", productId)
        .eq("storage_path", uploaded.path);
      await supabase.storage.from(MEDIA_BUCKET).remove([uploaded.path]);
    }
    throw error;
  }
  return uploaded;
}

export async function deleteProductMedia(media: ProductMedia) {
  const { error } = await supabase.from("product_media").delete().eq("id", media.id);
  if (error) throw error;
  if (!isRemoteMediaPath(media.storage_path)) {
    const { error: storageError } = await supabase.storage.from(MEDIA_BUCKET).remove([media.storage_path]);
    if (storageError) throw storageError;
  }
}
