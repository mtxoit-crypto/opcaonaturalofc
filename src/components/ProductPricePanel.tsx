import { useEffect, useState } from "react";
import { formatPrice as catalogPrice } from "@/lib/products";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function parseBrl(raw: string): number | null {
  const cleaned = raw.replace(/[^\d,.-]/g, "").trim();
  if (!cleaned) return null;
  const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) / 100 : null;
}

function editValue(price: number | null) {
  if (price == null) return "";
  return price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ProductPricePanel({
  price,
  onChange,
}: {
  price: number | null;
  onChange: (price: number | null) => void;
}) {
  const [draft, setDraft] = useState(() => editValue(price));

  useEffect(() => {
    setDraft(editValue(price));
  }, [price]);

  return (
    <section className="rounded-2xl bg-sand/60 p-4">
      <h3 className="text-base font-semibold tracking-tight">Preço</h3>
      <p className="mt-3 font-sans text-4xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
        {catalogPrice(price)}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Preço do catálogo e base do checkout seguro Stripe.
      </p>

      <div className="mt-4 space-y-1.5">
        <Label htmlFor="product-price">Valor no catálogo (R$)</Label>
        <Input
          id="product-price"
          inputMode="decimal"
          placeholder="0,00"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            onChange(parseBrl(event.target.value));
          }}
          onBlur={() => setDraft(editValue(price))}
        />
      </div>
      <p className="mt-3 rounded-xl bg-card/80 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        O servidor confirma novamente o preço salvo no catálogo antes de criar a cobrança.
      </p>
    </section>
  );
}
