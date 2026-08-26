export type MediaFile = {
  name: string;
  type: string;
  size: number;
};

export type MediaType = "image" | "video" | "model";

export const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const MODEL_MAX_BYTES = 50 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
const MODEL_TYPES = new Set(["model/gltf-binary", "application/octet-stream", ""]);

function sniffType(file: MediaFile) {
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

export function mediaMimeTypeFor(file: MediaFile) {
  return sniffType(file);
}

export function mediaTypeFor(file: MediaFile) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "glb") return "model" as const;
  if (sniffType(file).startsWith("video")) return "video";
  return "image" as const;
}

export function partitionMediaFiles<T extends MediaFile>(files: Iterable<T>) {
  const images: T[] = [];
  const videos: T[] = [];
  const models: T[] = [];
  const invalid: T[] = [];
  for (const file of files) {
    if (file.name.toLowerCase().endsWith(".gltf")) {
      invalid.push(file);
      continue;
    }
    const type = mediaTypeFor(file);
    if (type === "video") videos.push(file);
    else if (type === "model") models.push(file);
    else images.push(file);
  }
  return { images, videos, models, invalid };
}

export function assertMediaFile(file: MediaFile) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "gltf") {
    throw new Error(`${file.name}: use um modelo .glb (não .gltf).`);
  }
  if (ext === "svg" || sniffType(file) === "image/svg+xml") {
    throw new Error(`${file.name}: SVG não é permitido.`);
  }
  const type = mediaTypeFor(file);
  if (type === "model") {
    if (ext !== "glb" || !MODEL_TYPES.has(file.type)) {
      throw new Error(`${file.name}: use um modelo .glb válido.`);
    }
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
