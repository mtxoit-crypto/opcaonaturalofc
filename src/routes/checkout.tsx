import { checkoutEndpoint, isStripeCheckoutUrl } from "@/lib/site";
import { useRef, useState } from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Truck, Loader2, Minus, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/stores/cartStore";
import { formatMoney } from "@/lib/money";
import { shippingZonesQuery, estimateShipping, cleanCep } from "@/lib/shipping";
import { storeSettingsQuery } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout seguro · Opção Natural" },
      {
        name: "description",
        content: "Revise seu pedido e pague com segurança pelo checkout da Stripe.",
      },
      { property: "og:title", content: "Checkout seguro · Opção Natural" },
      { property: "og:description", content: "Pagamento seguro processado pela Stripe." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutRoute,
});

function CheckoutRoute() {
  const success = useRouterState({
    select: (s) => s.matches.some((m) => m.routeId === "/checkout/sucesso"),
  });
  return success ? <Outlet /> : <CartPage />;
}

function CartPage() {
  const { items, isLoading, updateQuantity, removeItem } = useCartStore();
  const [cep, setCep] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    data: zones,
    isPending: shippingPending,
    isError: shippingError,
    refetch: retryShipping,
  } = useQuery(shippingZonesQuery);
  const { data: settings } = useQuery(storeSettingsQuery);

  const attempt = useRef({ cart: "", key: "" });
  const submitting = useRef(false);
  const {
    data: available,
    isPending: paymentPending,
    refetch: retryPayment,
  } = useQuery({
    queryKey: ["stripe-checkout-available"],
    queryFn: async () => {
      const response = await fetch(checkoutEndpoint(), { cache: "no-store" });
      return response.ok && (await response.json()).available === true;
    },
  });

  const subtotal = items.reduce((sum, item) => sum + Number(item.price.amount) * item.quantity, 0);
  const postalCode = cleanCep(cep);
  const estimate = estimateShipping(cep, zones, subtotal, settings?.free_shipping_min ?? 0);
  const outsideCoverage =
    postalCode.length === 8 && !shippingPending && !shippingError && !estimate;
  const shippingMessage =
    postalCode.length < 8
      ? "Informe os 8 dígitos para ver o frete e liberar o pagamento."
      : shippingPending
        ? "Calculando a entrega…"
        : shippingError
          ? "Falha ao consultar a entrega. Tente novamente."
          : outsideCoverage
            ? "Confira o CEP. Ainda não temos entrega cadastrada para este endereço."
            : "";
  const paymentLabel = isSubmitting
    ? "Abrindo pagamento…"
    : !estimate
      ? "Informe o CEP para continuar"
      : paymentPending
        ? "Verificando pagamento…"
        : !available
          ? "Pagamento online indisponível"
          : "Continuar para pagamento seguro";

  async function checkout() {
    const postalCode = cleanCep(cep);
    if (postalCode.length !== 8 || !estimate) {
      toast.error("Informe um CEP válido para calcular a entrega.");
      return;
    }
    if (submitting.current || !available) return;
    submitting.current = true;
    setIsSubmitting(true);
    try {
      const cartItems = items.map(({ slug, quantity }) => ({ slug, quantity }));
      const cart = JSON.stringify([postalCode, cartItems]);
      if (attempt.current.cart !== cart) attempt.current = { cart, key: crypto.randomUUID() };
      const response = await fetch(checkoutEndpoint(), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          cep: postalCode,
          idempotencyKey: attempt.current.key,
          items: cartItems,
        }),
      });
      const payload = (await response.json()) as {
        url?: string;
        sessionId?: string;
        error?: string;
      };
      if (!response.ok || !isStripeCheckoutUrl(payload.url)) {
        throw new Error(payload.error || "Não foi possível iniciar o checkout.");
      }
      try {
        sessionStorage.setItem(
          "stripe-return-cart",
          JSON.stringify([payload.sessionId, cartItems]),
        );
      } catch {
        /* Checkout also works with browser storage disabled. */
      }
      track({ name: "begin_checkout" });
      window.location.assign(payload.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível iniciar o checkout.");
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <h1 className="text-display text-4xl leading-[1.15]">Seu carrinho está vazio</h1>
        <p className="mt-3 text-muted-foreground">
          Escolha um produto disponível no catálogo para continuar.
        </p>
        <Button asChild className="mt-6 min-h-11">
          <Link to="/produtos">Ver produtos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <Link
        to="/produtos"
        className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Continuar comprando
      </Link>
      <h1 className="mt-4 text-4xl">Revise seu pedido</h1>
      <p className="mt-2 text-muted-foreground">
        O pagamento e os dados de entrega serão concluídos no ambiente seguro da Stripe.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="surface-card space-y-4 p-6">
          {items.map((item) => (
            <div key={item.slug} className="flex gap-3 border-b border-border/60 pb-4">
              <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-sand">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="size-full object-contain"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {formatMoney(item.price.amount, item.price.currencyCode)}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-11"
                    aria-label={`Diminuir ${item.title}`}
                    onClick={() => updateQuantity(item.slug, item.quantity - 1)}
                  >
                    <Minus className="size-3" />
                  </Button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-11"
                    aria-label={`Aumentar ${item.title}`}
                    onClick={() => updateQuantity(item.slug, item.quantity + 1)}
                  >
                    <Plus className="size-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="ml-auto size-11"
                    aria-label={`Remover ${item.title}`}
                    onClick={() => removeItem(item.slug)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="surface-card h-fit space-y-4 p-5 lg:sticky lg:top-24">
          <div className="space-y-2 rounded-xl bg-secondary p-4">
            <Label htmlFor="checkout-cep" className="flex items-center gap-2 text-base">
              <Truck className="size-4" aria-hidden /> CEP de entrega
            </Label>
            <Input
              id="checkout-cep"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              maxLength={9}
              value={cep}
              aria-describedby="checkout-cep-status"
              aria-invalid={outsideCoverage || undefined}
              onChange={(event) =>
                setCep(
                  cleanCep(event.target.value)
                    .slice(0, 8)
                    .replace(/^(\d{5})(\d)/, "$1-$2"),
                )
              }
            />
            <div
              id="checkout-cep-status"
              role="status"
              className={
                outsideCoverage || shippingError
                  ? "text-sm text-destructive"
                  : "text-sm text-muted-foreground"
              }
            >
              {estimate
                ? `${estimate.zone} · ${estimate.fee === 0 ? "Frete grátis" : formatMoney(estimate.fee)} · ${estimate.days_min} a ${estimate.days_max} dias úteis`
                : shippingMessage}
            </div>
            {shippingError ? (
              <Button size="sm" variant="outline" onClick={() => void retryShipping()}>
                Consultar frete novamente
              </Button>
            ) : null}
          </div>
          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Entrega</span>
              <span>
                {estimate
                  ? estimate.fee === 0
                    ? "Grátis"
                    : formatMoney(estimate.fee)
                  : "Informe o CEP"}
              </span>
            </div>
            <div className="flex justify-between border-t border-border/60 pt-3 text-lg">
              <span>{estimate ? "Total estimado" : "Total com frete"}</span>
              <span className="text-accent">
                {estimate ? formatMoney(subtotal + estimate.fee) : "—"}
              </span>
            </div>
          </div>
          <Button
            className="min-h-12 w-full"
            size="lg"
            onClick={checkout}
            disabled={!available || isLoading || isSubmitting || !estimate}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            {paymentLabel}
          </Button>
          {estimate && !paymentPending && !available ? (
            <Button variant="outline" className="w-full" onClick={() => void retryPayment()}>
              Verificar novamente
            </Button>
          ) : null}
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            A Stripe coleta seu endereço completo e processa o pagamento. O pedido é confirmado após
            a validação segura do pagamento.
          </p>
        </aside>
      </div>
    </div>
  );
}
