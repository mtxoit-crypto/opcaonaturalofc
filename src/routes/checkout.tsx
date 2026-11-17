import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Minus, Plus, ShieldCheck, Trash2 } from "lucide-react";
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
  component: CartPage,
});

function CartPage() {
  const { items, isLoading, updateQuantity, removeItem } = useCartStore();
  const [cep, setCep] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: zones } = useQuery(shippingZonesQuery);
  const { data: settings } = useQuery(storeSettingsQuery);

  const subtotal = items.reduce((sum, item) => sum + Number(item.price.amount) * item.quantity, 0);
  const estimate = estimateShipping(cep, zones, subtotal, settings?.free_shipping_min ?? 0);

  async function checkout() {
    const postalCode = cleanCep(cep);
    if (postalCode.length !== 8 || !estimate) {
      toast.error("Informe um CEP válido para calcular a entrega.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          cep: postalCode,
          idempotencyKey: crypto.randomUUID(),
          items: items.map(({ slug, quantity }) => ({ slug, quantity })),
        }),
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Não foi possível iniciar o checkout.");
      }
      track({ name: "begin_checkout" });
      window.location.assign(payload.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível iniciar o checkout.");
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

        <aside className="surface-card h-fit space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="checkout-cep">CEP de entrega</Label>
            <Input
              id="checkout-cep"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              maxLength={9}
              value={cep}
              onChange={(event) => setCep(event.target.value)}
            />
            {cleanCep(cep).length === 8 && !estimate ? (
              <p className="text-xs text-destructive">
                Ainda não temos entrega cadastrada para este CEP.
              </p>
            ) : null}
            {estimate ? (
              <p className="text-xs text-muted-foreground">
                {estimate.zone} · {estimate.fee === 0 ? "Frete grátis" : formatMoney(estimate.fee)}{" "}
                · {estimate.days_min} a {estimate.days_max} dias úteis
              </p>
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
              <span>Total estimado</span>
              <span className="text-accent">{formatMoney(subtotal + (estimate?.fee ?? 0))}</span>
            </div>
          </div>
          <Button
            className="min-h-12 w-full"
            size="lg"
            onClick={checkout}
            disabled={isLoading || isSubmitting || !estimate}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            {isSubmitting ? "Abrindo pagamento…" : "Continuar para pagamento seguro"}
          </Button>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            A Stripe coleta seu endereço completo e processa o pagamento. O pedido é confirmado após
            a validação segura do pagamento.
          </p>
        </aside>
      </div>
    </div>
  );
}
