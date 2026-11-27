import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Truck } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { shippingZonesQuery, estimateShipping, cleanCep } from "@/lib/shipping";
import { storeSettingsQuery } from "@/lib/store";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ShippingCalculator({
  compact = false,
  productPrice,
}: {
  compact?: boolean;
  productPrice?: number;
}) {
  const [cep, setCep] = useState("");
  const [submitted, setSubmitted] = useState("");
  const { data: zones, isPending, isError, refetch } = useQuery(shippingZonesQuery);
  const { data: settings } = useQuery(storeSettingsQuery);
  const items = useCartStore((s) => s.items);

  const subtotal =
    productPrice ?? items.reduce((sum, i) => sum + Number(i.price.amount) * i.quantity, 0);
  const estimate = submitted
    ? estimateShipping(submitted, zones, subtotal, settings?.free_shipping_min ?? 0)
    : null;

  return (
    <div className={compact ? "space-y-2" : "surface-card space-y-3 p-5"}>
      <p className="flex items-center gap-2 text-sm">
        <Truck className="size-4 text-accent" />
        Calcular frete e prazo
      </p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(cep);
        }}
      >
        <Input
          aria-label="CEP para estimar entrega"
          autoComplete="postal-code"
          inputMode="numeric"
          placeholder="00000-000"
          maxLength={9}
          value={cep}
          onChange={(e) => {
            setCep(
              cleanCep(e.target.value)
                .slice(0, 8)
                .replace(/^(\d{5})(\d)/, "$1-$2"),
            );
            setSubmitted("");
          }}
        />
        <Button type="submit" variant="outline">
          Calcular
        </Button>
      </form>
      {submitted && !estimate ? (
        <p role="status" className="text-xs text-muted-foreground">
          {cleanCep(submitted).length !== 8
            ? "Digite um CEP com 8 dígitos."
            : isPending
              ? "Consultando entrega…"
              : isError
                ? "Não foi possível consultar a entrega."
                : "Não encontramos uma faixa de entrega para esse CEP."}
        </p>
      ) : null}
      {estimate ? (
        <p role="status" className="text-sm text-muted-foreground">
          <strong className="text-foreground">{estimate.zone}</strong> ·{" "}
          {estimate.fee === 0 ? "Frete grátis" : formatMoney(estimate.fee)} · {estimate.days_min} a{" "}
          {estimate.days_max} dias úteis
        </p>
      ) : null}
      {submitted && isError ? (
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Tentar novamente
        </Button>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {productPrice !== undefined ? "Estimativa para uma unidade. " : "Estimativa. "} O valor
        final do frete é confirmado no checkout.
      </p>
    </div>
  );
}
