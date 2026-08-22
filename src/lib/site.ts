/** Troque aqui quando o domínio próprio estiver no ar. */
export const SITE_ORIGIN = "https://opcaonaturalofc.lovable.app";

export function absoluteUrl(path = "/") {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized}`;
}

/** Imagem social: foto real do catálogo até existir um OG dedicado. */
export const DEFAULT_OG_IMAGE = absoluteUrl("/produtos/ginseng.png");
