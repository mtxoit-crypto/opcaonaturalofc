import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  firstVariant as shopifyVariant,
  formatMoney as shopifyMoney,
  matchShopifyProduct as shopifyMatch,
  shopifyProductsQuery as shopifyQuery,
} from "@/lib/shopify";
import { formatPrice as catalogPrice } from "@/lib/products";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function parseBrl(raw: string): number | null {
  const cleaned = raw.replace(/[^\d,.-]/g, "").trim();
  if (!cleaned) return null;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

function editValue(price: number | null) {
  if (price == null) return "";
  return price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ProductPricePanel({
  slug,
  name,
  price,
  onChange,
}: {
  slug?: string;
  name?: string;
  price: number | null;
  onChange: (price: number | null) => void;
}) {
  const { data: shopify } = useQuery(shopifyQuery);
  const [draft, setDraft] = useState(() => editValue(price));

  useEffect(() => {
    setDraft(editValue(price));
  }, [price, slug, name]);

  const variant = shopifyVariant(shopifyMatch(shopify, slug ?? "", name));
  const checkout = variant ? Number(variant.price.amount) : null;
  const display = useMemo(() => catalogPrice(price), [price]);
  const checkoutLabel =
    checkout == null ? null : shopifyMoney(checkout, variant?.price.currencyCode ?? "BRL");
  const mismatch = checkout != null && price != null && Math.abs(checkout - price) >= 0.01;

  return (
    <section className="rounded-2xl bg-sand/60 p-4">
      <h3 className="text-base font-semibold tracking-tight">Preço</h3>
      <p className="mt-3 font-sans text-4xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
        {display}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">Como aparece na vitrine do site.</p>

      <div className="mt-4 space-y-1.5">
        <Label htmlFor="product-price">Valor no catálogo (R$)</Label>
        <Input
          id="product-price"
          inputMode="decimal"
          placeholder="0,00"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            onChange(parseBrl(e.target.value));
          }}
          onBlur={() => setDraft(editValue(price))}
        />
      </div>

      <div className="mt-3 rounded-xl bg-card/80 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        {checkoutLabel ? (
          <>
            <p>
              No checkout da Shopify o cliente paga{" "}
              <span className="font-medium text-foreground">{checkoutLabel}</span>.
            </p>
            {mismatch ? (
              <p className="mt-1 text-clay">
                Esse valor é cobrado no pagamento. O campo acima só atualiza o preço mostrado no
                site e neste painel — altere o produto na Shopify se quiser mudar o checkout.
              </p>
            ) : (
              <p className="mt-1">
                Os dois valores estão iguais. Salve o produto para gravar o preço do catálogo.
              </p>
            )}
          </>
        ) : (
          <p>
            Este item ainda não tem par na Shopify. O preço salvo aqui aparece no site; a cobrança
            só existe depois que o produto estiver na loja Shopify.
          </p>
        )}
      </div>
    </section>
  );
}
