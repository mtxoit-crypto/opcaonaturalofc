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

export const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const MODEL_MAX_BYTES = 50 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

export function isRemoteMediaPath(path: string) {
  return /^https:\/\//i.test(path);
}

export function isDatabaseProductId(id: string | undefined | null) {
  return Boolean(
    id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
  );
}

function sniffType(file: File) {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg"].includes(ext)) return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "avif") return "image/avif";
  if (ext === "mp4") return "video/mp4";
  if (ext === "webm") return "video/webm";
  return "";
}

export function mediaTypeFor(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "glb" || ext === "gltf") return "model";
  if (sniffType(file).startsWith("video")) return "video";
  return "image";
}

export function partitionMediaFiles(files: Iterable<File>) {
  const images: File[] = [];
  const videos: File[] = [];
  const models: File[] = [];
  for (const file of files) {
    const type = mediaTypeFor(file);
    if (type === "video") videos.push(file);
    else if (type === "model") models.push(file);
    else images.push(file);
  }
  return { images, videos, models };
}

export function assertMediaFile(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "svg" || sniffType(file) === "image/svg+xml") {
    throw new Error(`${file.name}: SVG não é permitido.`);
  }
  const type = mediaTypeFor(file);
  if (type === "model") {
    if (file.size > MODEL_MAX_BYTES) throw new Error(`${file.name}: modelo até 50 MB.`);
    return type;
  }
  if (type === "video") {
    if (!VIDEO_TYPES.has(sniffType(file))) {
      throw new Error(`${file.name}: use MP4 ou WebM.`);
    }
    if (file.size > VIDEO_MAX_BYTES) throw new Error(`${file.name}: vídeo até 50 MB.`);
    return type;
  }
  if (!IMAGE_TYPES.has(sniffType(file))) {
    throw new Error(`${file.name}: use JPEG, PNG, WebP, GIF ou AVIF.`);
  }
  if (file.size > IMAGE_MAX_BYTES) throw new Error(`${file.name}: foto até 8 MB.`);
  return type;
}

export function assertVideoUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Cole um endereço https do vídeo.");
  if (trimmed.length > 2048) throw new Error("O endereço do vídeo é longo demais.");
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Endereço de vídeo inválido.");
  }
  if (url.protocol !== "https:") throw new Error("Use um endereço https.");
  const path = url.pathname.toLowerCase();
  if (!/\.(mp4|webm)(\?|$)/.test(path) && !/\.(mp4|webm)(\?|$)/.test(url.search.toLowerCase())) {
    if (!path.endsWith(".mp4") && !path.endsWith(".webm")) {
      throw new Error("Use um arquivo .mp4 ou .webm (não YouTube/Vimeo).");
    }
  }
  return url.toString();
}

async function withUrls(rows: Omit<ProductMedia, "url">[] | null): Promise<ProductMedia[]> {
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

async function nextSortOrder(productId: string) {
  const { data } = await supabase
    .from("product_media")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1);
  return (data?.[0]?.sort_order ?? -1) + 1;
}

export async function uploadProductMedia(productId: string, file: File) {
  const type = assertMediaFile(file);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${productId}/${crypto.randomUUID()}.${ext}`;
  const sort_order = await nextSortOrder(productId);
  const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    contentType: type === "model" ? "model/gltf-binary" : sniffType(file) || file.type,
    upsert: false,
  });
  if (upErr) throw upErr;
  const { error } = await supabase.from("product_media").insert({
    product_id: productId,
    storage_path: path,
    media_type: type,
    alt: file.name,
    sort_order,
  });
  if (error) throw error;
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

export async function setProductCover(productId: string, imageUrl: string) {
  const { error } = await supabase.from("products").update({ image_url: imageUrl }).eq("id", productId);
  if (error) throw error;
}

export async function publicMediaUrl(storagePath: string) {
  if (isRemoteMediaPath(storagePath)) return storagePath;
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function deleteProductMedia(media: ProductMedia) {
  if (!isRemoteMediaPath(media.storage_path)) {
    await supabase.storage.from(MEDIA_BUCKET).remove([media.storage_path]);
  }
  const { error } = await supabase.from("product_media").delete().eq("id", media.id);
  if (error) throw error;
}
