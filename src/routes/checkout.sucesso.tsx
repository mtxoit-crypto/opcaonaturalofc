import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";

export const Route = createFileRoute("/checkout/sucesso")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } =>
    typeof search["session_id"] === "string" && /^cs_(test|live)_[A-Za-z0-9]+$/.test(search["session_id"])
      ? { session_id: search["session_id"] }
      : {},
  component: CheckoutSuccessPage,
});

function CheckoutSuccessPage() {
  const { session_id: sessionId } = Route.useSearch();
  const clearCart = useCartStore((state) => state.clearCart);

  const { data: confirmed } = useQuery({
    queryKey: ["stripe-order-confirmed", sessionId],
    enabled: Boolean(sessionId),
    queryFn: async () => {
      const response = await fetch(`/api/stripe/checkout?session_id=${encodeURIComponent(sessionId!)}`, { cache: "no-store" });
      return response.ok && (await response.json()).confirmed === true;
    },
    refetchInterval: (query) => query.state.data || query.state.dataUpdateCount >= 12 ? false : 5000,
  });
  useEffect(() => {
    if (!confirmed || !sessionId) return;
    try {
      const items = useCartStore.getState().items.map(({ slug, quantity }) => ({ slug, quantity }));
      if (sessionStorage.getItem("stripe-return-cart") === JSON.stringify([sessionId, items])) {
        sessionStorage.removeItem("stripe-return-cart");
        clearCart();
      }
    } catch { /* Preserve the cart when storage is unavailable. */ }
  }, [confirmed, clearCart, sessionId]);

  return (
    <main className="mx-auto max-w-xl px-5 py-20 text-center">
      <CheckCircle2 className="mx-auto size-14 text-accent" aria-hidden />
      <p className="mt-5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Pagamento Stripe
      </p>
      <h1 className="text-display mt-3 text-4xl">{confirmed ? "Pedido confirmado" : "Consulte a confirmação do pedido"}</h1>
      <p className="mt-4 text-muted-foreground">
        {confirmed ? "Recebemos o pagamento e registramos seu pedido." : "O pedido aparece como confirmado assim que a loja registra o pagamento. Se você já pagou, aguarde a confirmação ou fale com a loja."}
      </p>
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <PackageCheck className="size-4" /> Em caso de dúvida, entre em contato pelo WhatsApp da loja.
      </div>
      <Button asChild className="mt-8 min-h-11">
        <Link to="/produtos">Voltar ao catálogo</Link>
      </Button>
    </main>
  );
}
