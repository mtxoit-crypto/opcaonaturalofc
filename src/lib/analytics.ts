export type AnalyticsEvent =
  | { name: "view_home" }
  | { name: "click_hero_cta"; cta: "primary" | "secondary" }
  | { name: "view_product"; slug: string }
  | { name: "add_to_cart"; slug: string }
  | { name: "begin_checkout" }
  | { name: "view_story" }
  | { name: "open_faq"; question: string };

/**
 * Ponte desacoplada. Sem cookies, pixels ou GA por enquanto.
 * Depois: encaminhar `event` para GA4 / Meta a partir daqui.
 */
export function track(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("opcao-analytics", { detail: event }));
}
