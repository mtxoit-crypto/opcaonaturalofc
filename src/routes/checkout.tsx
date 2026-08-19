import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, ExternalLink, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cartStore";
import { formatMoney } from "@/lib/shopify";
import { productsQuery } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";
import { ShippingCalculator } from "@/components/ShippingCalculator";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Carrinho · Opção Natural" },
      {
        name: "description",
        content:
          "Revise seu carrinho, calcule o frete pelo CEP e finalize a compra no checkout seguro com cartão, Pix ou boleto.",
      },
      { property: "og:title", content: "Carrinho · Opção Natural" },
      {
        property: "og:description",
        content: "Carrinho e frete — finalize com cartão, Pix ou boleto.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://opcaonaturalofc.lovable.app/checkout" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://opcaonaturalofc.lovable.app/checkout" }],
  }),
  component: CartPage,
});

const emptyForm = {
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  zip_code: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  notes: "",
};

function CartPage() {
  const { items, isLoading, isSyncing, updateQuantity, removeItem, getCheckoutUrl } =
    useCartStore();
  const { data: catalog } = useQuery(productsQuery);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + Number(i.price.amount) * i.quantity, 0);
  const currency = items[0]?.price.currencyCode ?? "BRL";

  function checkout() {
    const url = getCheckoutUrl();
    if (url) window.open(url, "_blank");
  }

  function resolveProductId(handle: string, title: string) {
    const normalized = handle.toLowerCase();
    const match =
      catalog?.find((p) => p.slug === normalized) ??
      catalog?.find((p) => p.name.toLowerCase() === title.toLowerCase());
    return match?.id ?? null;
  }

  async function startLocalCheckout(event: React.FormEvent) {
    event.preventDefault();
    const payloadItems = items
      .map((i) => ({ product_id: resolveProductId(i.handle, i.title), quantity: i.quantity }))
      .filter((i) => i.product_id);

    if (payloadItems.length !== items.length) {
      toast.error("Alguns itens não estão disponíveis para pagamento no site.");
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.rpc("create_order", {
        _customer_name: form.customer_name,
        _customer_phone: form.customer_phone,
        _customer_email: form.customer_email,
        _zip_code: form.zip_code,
        _street: form.street,
        _number: form.number,
        _complement: form.complement,
        _district: form.district,
        _city: form.city,
        _state: form.state.toUpperCase(),
        _notes: form.notes,
        _items: payloadItems,
      });
      if (error) throw error;
      const created = Array.isArray(data) ? data[0] : data;
      if (!created?.id) throw new Error("Não foi possível criar o pedido.");
      setOrderId(created.id as string);
    } catch (error) {
      toast.error((error as Error).message || "Não foi possível criar o pedido.");
    } finally {
      setCreating(false);
    }
  }

  if (items.length === 0 && !orderId) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="text-4xl">Seu carrinho está vazio</h1>
        <p className="mt-3 text-muted-foreground">
          Escolha seus suplementos e volte aqui para finalizar a compra.
        </p>
        <Button asChild className="mt-6">
          <Link to="/produtos">Ver produtos</Link>
        </Button>
      </div>
    );
  }

  if (orderId) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <PaymentTestModeBanner />
        <h1 className="mt-6 text-3xl">Pagamento</h1>
        <p className="mt-2 text-muted-foreground">
          Conclua o pagamento abaixo com cartão de crédito ou Pix.
        </p>
        <div className="mt-6">
          <StripeEmbeddedCheckout orderId={orderId} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="text-4xl">Seu carrinho</h1>
      <p className="mt-2 text-muted-foreground">
        Pagamento com <strong>cartão de crédito, Pix ou boleto</strong> no checkout seguro.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="surface-card space-y-4 p-6">
            {items.map((i) => (
              <div key={i.variantId} className="flex gap-3 border-b border-border/60 pb-4">
                <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-sand">
                  {i.image ? (
                    <img
                      src={i.image}
                      alt={i.title}
                      loading="lazy"
                      className="size-full object-contain"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate">{i.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatMoney(i.price.amount, i.price.currencyCode)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-7"
                      onClick={() => updateQuantity(i.variantId, i.quantity - 1)}
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-6 text-center text-sm">{i.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-7"
                      onClick={() => updateQuantity(i.variantId, i.quantity + 1)}
                    >
                      <Plus className="size-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="ml-auto size-7"
                      onClick={() => removeItem(i.variantId)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showForm ? (
            <form onSubmit={startLocalCheckout} className="surface-card space-y-4 p-6">
              <h2 className="text-2xl">Dados de entrega</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome completo" required value={form.customer_name} onChange={(v) => setForm({ ...form, customer_name: v })} />
                <Field label="WhatsApp" required value={form.customer_phone} onChange={(v) => setForm({ ...form, customer_phone: v })} />
                <Field label="E-mail" type="email" value={form.customer_email} onChange={(v) => setForm({ ...form, customer_email: v })} />
                <Field label="CEP" required value={form.zip_code} onChange={(v) => setForm({ ...form, zip_code: v })} />
                <Field label="Rua" required value={form.street} onChange={(v) => setForm({ ...form, street: v })} />
                <Field label="Número" required value={form.number} onChange={(v) => setForm({ ...form, number: v })} />
                <Field label="Complemento" value={form.complement} onChange={(v) => setForm({ ...form, complement: v })} />
                <Field label="Bairro" required value={form.district} onChange={(v) => setForm({ ...form, district: v })} />
                <Field label="Cidade" required value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                <Field label="UF" required maxLength={2} value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={creating}>
                {creating ? <Loader2 className="size-4 animate-spin" /> : "Ir para o pagamento"}
              </Button>
            </form>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="surface-card space-y-3 p-6">
            <div className="flex justify-between text-lg">
              <span>Subtotal</span>
              <span className="text-accent">{formatMoney(subtotal, currency)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Frete calculado conforme o endereço de entrega.
            </p>
            <Button
              className="w-full"
              size="lg"
              onClick={() => setShowForm(true)}
              disabled={showForm}
            >
              <CreditCard className="size-4" />
              Pagar aqui (cartão ou Pix)
            </Button>
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={checkout}
              disabled={isLoading || isSyncing}
            >
              {isLoading || isSyncing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <ExternalLink className="size-4" />
                  Checkout Shopify
                </>
              )}
            </Button>
          </div>
          <ShippingCalculator />
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  maxLength?: number;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        required={required}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
