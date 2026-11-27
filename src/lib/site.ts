/** URL pública atual do Worker; substitua quando o domínio próprio estiver configurado. */
export const SITE_ORIGIN = "https://opcaonaturalofc.mtxoit.workers.dev";

export const LOVABLE_STOREFRONT_ORIGIN = "https://opcaonaturalofc.lovable.app";

export function checkoutEndpoint() {
  const path = "/api/stripe/checkout";
  return typeof window !== "undefined" && window.location.origin === LOVABLE_STOREFRONT_ORIGIN
    ? SITE_ORIGIN + path
    : path;
}


export function absoluteUrl(path = "/") {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized}`;
}

export const CONTACT = {
  whatsapp: "5544988601285",
  whatsappLabel: "(44) 98860-1285",
  instagram: "@tioxtm",
  instagramUrl: "https://instagram.com/tioxtm",
  /** Preencha com o e-mail da loja. */
  email: "",
};

export const FREE_SHIPPING_TEXT = "75";

export function whatsappLink(
  text = "Olá! Vim pelo site da Opção Natural e gostaria de ajuda com um produto.",
) {
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
}

/** Imagem social: foto real do catálogo até existir um OG dedicado. */
export const DEFAULT_OG_IMAGE = absoluteUrl("/produtos/ginseng.png");

export function isStripeCheckoutUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const url = URL.canParse(value) ? new URL(value) : null;
  return Boolean(url && url.origin === "https://checkout.stripe.com" &&
    !url.username && !url.password && url.pathname.startsWith("/c/pay/"));
}
