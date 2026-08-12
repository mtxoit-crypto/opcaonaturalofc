import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Trash2, MessageCircle, Truck } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";
import {
  storeSettingsQuery,
  shippingFor,
  lookupCep,
  createOrder,
  whatsappLink,
  type CheckoutAddress,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Finalizar pedido com Pix · Opção Natural" },
      {
        name: "description",
        content:
          "Revise seu carrinho, informe o endereço de entrega e finalize o pedido pelo WhatsApp pagando com Pix.",
      },
      { property: "og:title", content: "Finalizar pedido com Pix · Opção Natural" },
      {
        property: "og:description",
        content: "Carrinho, endereço e frete — pagamento por Pix confirmado no WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://natural-pot-showcase.lovable.app/checkout" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://natural-pot-showcase.lovable.app/checkout" }],
  }),
  component: CheckoutPage,
});

const emptyAddress: CheckoutAddress = {
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

function CheckoutPage() {
  const { items, subtotal, setQuantity, remove, clear } = useCart();
  const { data: settings } = useQuery(storeSettingsQuery);
  const [address, setAddress] = useState<CheckoutAddress>(emptyAddress);
  const [sending, setSending] = useState(false);

  const shipping = settings ? shippingFor(subtotal, settings) : 0;
  const total = subtotal + shipping;
  const set = (patch: Partial<CheckoutAddress>) => setAddress((a) => ({ ...a, ...patch }));

  async function onCepBlur() {
    const found = await lookupCep(address.zip_code);
    if (found) set(found);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!settings || items.length === 0) return;
    setSending(true);
    try {
      const order = await createOrder(address, items);
      const url = whatsappLink(
        settings,
        order.code,
        address,
        items,
        order.subtotal,
        order.shipping_fee,
      );
      clear();
      toast.success(`Pedido ${order.code} criado! Confirme o Pix no WhatsApp.`);
      window.open(url, "_blank", "noopener");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="text-4xl">Seu carrinho está vazio</h1>
        <p className="mt-3 text-muted-foreground">
          Escolha seus suplementos e volte aqui para finalizar com Pix.
        </p>
        <Button asChild className="mt-6">
          <Link to="/produtos">Ver produtos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-4xl">Finalizar pedido</h1>
      <p className="mt-2 text-muted-foreground">
        Pagamento por <strong>Pix</strong>. Confirmamos tudo com você pelo WhatsApp.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <form className="surface-card space-y-4 p-6" onSubmit={onSubmit}>
          <h2 className="text-xl">Dados de entrega</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome completo">
              <Input
                required
                value={address.customer_name}
                onChange={(e) => set({ customer_name: e.target.value })}
              />
            </Field>
            <Field label="WhatsApp">
              <Input
                required
                placeholder="(00) 00000-0000"
                value={address.customer_phone}
                onChange={(e) => set({ customer_phone: e.target.value })}
              />
            </Field>
          </div>
          <Field label="E-mail (opcional)">
            <Input
              type="email"
              value={address.customer_email}
              onChange={(e) => set({ customer_email: e.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
            <Field label="CEP">
              <Input
                required
                placeholder="00000-000"
                value={address.zip_code}
                onChange={(e) => set({ zip_code: e.target.value })}
                onBlur={onCepBlur}
              />
            </Field>
            <Field label="Rua">
              <Input
                required
                value={address.street}
                onChange={(e) => set({ street: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Número">
              <Input
                required
                value={address.number}
                onChange={(e) => set({ number: e.target.value })}
              />
            </Field>
            <Field label="Complemento">
              <Input
                value={address.complement}
                onChange={(e) => set({ complement: e.target.value })}
              />
            </Field>
            <Field label="Bairro">
              <Input
                required
                value={address.district}
                onChange={(e) => set({ district: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
            <Field label="Cidade">
              <Input
                required
                value={address.city}
                onChange={(e) => set({ city: e.target.value })}
              />
            </Field>
            <Field label="UF">
              <Input
                required
                maxLength={2}
                value={address.state}
                onChange={(e) => set({ state: e.target.value.toUpperCase() })}
              />
            </Field>
          </div>
          <Field label="Observações">
            <Textarea
              rows={3}
              value={address.notes}
              onChange={(e) => set({ notes: e.target.value })}
            />
          </Field>

          <Button type="submit" size="lg" className="w-full" disabled={sending}>
            <MessageCircle className="size-4" />
            {sending ? "Enviando…" : "Finalizar no WhatsApp (Pix)"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Enviamos a chave Pix e o valor final pelo WhatsApp após a confirmação do pedido.
          </p>
        </form>

        <aside className="surface-card h-fit space-y-4 p-6">
          <h2 className="text-xl">Seu carrinho</h2>
          {items.map((i) => (
            <div key={i.id} className="flex gap-3 border-b border-border/60 pb-4">
              {i.image_url ? (
                <img
                  src={i.image_url}
                  alt={i.name}
                  loading="lazy"
                  className="size-16 rounded-lg object-cover"
                />
              ) : (
                <div className="size-16 rounded-lg bg-secondary" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate">{i.name}</p>
                <p className="text-sm text-muted-foreground">{formatPrice(i.price)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-7"
                    onClick={() => setQuantity(i.id, i.quantity - 1)}
                  >
                    <Minus className="size-3" />
                  </Button>
                  <span className="w-6 text-center text-sm">{i.quantity}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-7"
                    onClick={() => setQuantity(i.id, i.quantity + 1)}
                  >
                    <Plus className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="ml-auto size-7"
                    onClick={() => remove(i.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Frete</dt>
              <dd>{shipping === 0 ? "Grátis" : formatPrice(shipping)}</dd>
            </div>
            <div className="flex justify-between pt-2 text-lg">
              <dt>Total</dt>
              <dd className="text-accent">{formatPrice(total)}</dd>
            </div>
          </dl>

          {settings && shipping > 0 && settings.free_shipping_min > 0 ? (
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Truck className="mt-0.5 size-3.5 shrink-0" />
              Faltam {formatPrice(settings.free_shipping_min - subtotal)} para frete grátis.
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
