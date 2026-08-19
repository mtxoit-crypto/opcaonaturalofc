import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmOrderPayment } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/products";

export const Route = createFileRoute("/pedido-confirmado")({
  head: () => ({
    meta: [
      { title: "Pedido confirmado · Opção Natural" },
      {
        name: "description",
        content: "Confirmação do seu pedido de suplementos naturais na Opção Natural.",
      },
      { property: "og:title", content: "Pedido confirmado · Opção Natural" },
      { property: "og:description", content: "Acompanhe a confirmação do seu pedido." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search["session_id"] === "string" ? search["session_id"] : undefined,
  }),
  component: OrderConfirmedPage,
});

function OrderConfirmedPage() {
  const { session_id: sessionId } = Route.useSearch();
  const clearCart = useCartStore((s) => s.clearCart);
  const [state, setState] = useState<
    { loading: true } | { loading: false; status?: "pago" | "pendente"; code?: string; total?: number; error?: string }
  >({ loading: true });

  useEffect(() => {
    if (!sessionId) {
      setState({ loading: false, error: "Sessão de pagamento não encontrada." });
      return;
    }
    let active = true;
    confirmOrderPayment({ data: { sessionId, environment: getStripeEnvironment() } })
      .then((result) => {
        if (!active) return;
        if ("error" in result) {
          setState({ loading: false, error: result.error });
          return;
        }
        if (result.status === "pago") clearCart();
        setState({ loading: false, status: result.status, code: result.code, total: result.total });
      })
      .catch((error: unknown) => {
        if (active) setState({ loading: false, error: (error as Error).message });
      });
    return () => {
      active = false;
    };
  }, [sessionId, clearCart]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-20 text-center">
      {state.loading ? (
        <>
          <Loader2 className="mx-auto size-10 animate-spin text-accent" />
          <p className="mt-4 text-muted-foreground">Confirmando seu pagamento…</p>
        </>
      ) : state.error ? (
        <>
          <h1 className="text-3xl">Não conseguimos confirmar o pagamento</h1>
          <p className="mt-3 text-muted-foreground">{state.error}</p>
        </>
      ) : state.status === "pago" ? (
        <>
          <CheckCircle2 className="mx-auto size-12 text-accent" />
          <h1 className="mt-4 text-4xl">Pagamento aprovado!</h1>
          <p className="mt-3 text-muted-foreground">
            Pedido <strong>{state.code}</strong> no valor de {formatPrice(state.total ?? 0)}. Já
            estamos preparando seu envio.
          </p>
        </>
      ) : (
        <>
          <Clock className="mx-auto size-12 text-accent" />
          <h1 className="mt-4 text-4xl">Pagamento em processamento</h1>
          <p className="mt-3 text-muted-foreground">
            Pedido <strong>{state.code}</strong>. Assim que o pagamento for compensado, ele aparece
            como pago no seu painel.
          </p>
        </>
      )}
      <Button asChild className="mt-8">
        <Link to="/produtos">Continuar comprando</Link>
      </Button>
    </div>
  );
}
