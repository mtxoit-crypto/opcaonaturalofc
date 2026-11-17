import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";

export const Route = createFileRoute("/checkout/sucesso")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } =>
    typeof search["session_id"] === "string" && /^cs_test_[A-Za-z0-9]+$/.test(search["session_id"])
      ? { session_id: search["session_id"] }
      : {},
  component: CheckoutSuccessPage,
});

function CheckoutSuccessPage() {
  const { session_id: sessionId } = Route.useSearch();
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    if (sessionId) clearCart();
  }, [clearCart, sessionId]);

  return (
    <main className="mx-auto max-w-xl px-5 py-20 text-center">
      <CheckCircle2 className="mx-auto size-14 text-accent" aria-hidden />
      <p className="mt-5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Pagamento Stripe
      </p>
      <h1 className="text-display mt-3 text-4xl">Recebemos seu retorno</h1>
      <p className="mt-4 text-muted-foreground">
        Estamos validando o pagamento e registrando seu pedido com segurança. A confirmação será
        enviada para o e-mail informado no checkout.
      </p>
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <PackageCheck className="size-4" /> Você pode fechar esta página depois de receber a
        confirmação.
      </div>
      <Button asChild className="mt-8 min-h-11">
        <Link to="/produtos">Voltar ao catálogo</Link>
      </Button>
    </main>
  );
}
