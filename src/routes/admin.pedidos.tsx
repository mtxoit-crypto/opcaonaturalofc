import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageCircle, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminShell } from "@/components/AdminShell";

type OrderItem = { product_name: string; quantity: number; unit_price: number };
type Order = {
  id: string;
  code: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  state: string;
  street: string;
  number: string;
  district: string;
  zip_code: string;
  total: number;
  created_at: string;
  order_items: OrderItem[];
};

const STATUSES = ["pendente", "pago", "enviado", "entregue", "cancelado", "teste"];

type AuditEntry = {
  id: string;
  order_code: string;
  customer_name: string | null;
  total: number;
  status: string | null;
  actor_email: string | null;
  created_at: string;
};

export const Route = createFileRoute("/admin/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos · Painel Opção Natural" },
      { name: "description", content: "Acompanhe e atualize os pedidos da loja Opção Natural." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrdersPage,
});

function waLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

function OrdersPage() {
  const { isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");

  const { data: orders } = useQuery({
    queryKey: ["orders"],
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id,code,status,customer_name,customer_phone,city,state,street,number,district,zip_code,total,created_at,order_items(product_name,quantity,unit_price)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
    enabled: isAdmin,
  });

  const setOrderStatus = useMutation({
    mutationFn: async ({ id, status: next }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status: next }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["admin-order-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error: itemsError } = await supabase.from("order_items").delete().eq("order_id", id);
      if (itemsError) throw itemsError;
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pedido excluído");
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order-audit-log"] });
      qc.invalidateQueries({ queryKey: ["admin-order-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: auditLog } = useQuery({
    queryKey: ["order-audit-log"],
    queryFn: async (): Promise<AuditEntry[]> => {
      const { data, error } = await supabase
        .from("order_audit_log")
        .select("id,order_code,customer_name,total,status,actor_email,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as AuditEntry[];
    },
    enabled: isAdmin,
  });

  const testOrders = (orders ?? []).filter((o) => o.status === "teste");
  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (orders ?? []).filter((o) => {
      if (status !== "todos" && o.status !== status) return false;
      if (!term) return true;
      return [o.code, o.customer_name, o.customer_phone, o.city].some((s) =>
        s.toLowerCase().includes(term),
      );
    });
  }, [orders, q, status]);

  const removeTestOrders = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error: itemsError } = await supabase.from("order_items").delete().in("order_id", ids);
      if (itemsError) throw itemsError;
      const { error } = await supabase.from("orders").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pedidos de teste excluídos");
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order-audit-log"] });
      qc.invalidateQueries({ queryKey: ["admin-order-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) return <div className="mx-auto max-w-6xl px-5 py-20">Carregando…</div>;
  if (!isAdmin)
    return (
      <div className="mx-auto max-w-2xl px-5 py-20">
        <h1 className="text-3xl">Acesso restrito</h1>
      </div>
    );

  return (
    <AdminShell title="Pedidos" hint="Busque, filtre por status e fale com o cliente no WhatsApp.">
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Código, nome, telefone ou cidade"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="todos">Todos os status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          className="text-destructive hover:text-destructive"
          disabled={testOrders.length === 0 || removeTestOrders.isPending}
          onClick={() => {
            if (
              window.confirm(
                `Excluir ${testOrders.length} pedido(s) com status "teste"? Essa ação não pode ser desfeita.`,
              )
            )
              removeTestOrders.mutate(testOrders.map((o) => o.id));
          }}
        >
          <Trash2 className="size-4" /> Excluir testes ({testOrders.length})
        </Button>
      </div>

      <div className="mt-8 space-y-4">
        {visible.length === 0 ? (
          <p className="text-muted-foreground">Nenhum pedido nesse filtro.</p>
        ) : null}
        {visible.map((o) => {
          const wa = waLink(o.customer_phone);
          return (
            <div key={o.id} className="surface-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg">
                    {o.code} · {o.customer_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {o.customer_phone} · {o.street}, {o.number} — {o.district}, {o.city}/{o.state} ·
                    CEP {o.zip_code}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <p className="text-xl text-accent">{formatPrice(o.total)}</p>
              </div>

              <ul className="mt-3 text-sm text-muted-foreground">
                {(o.order_items ?? []).map((i, idx) => (
                  <li key={idx}>
                    {i.quantity}x {i.product_name} — {formatPrice(i.unit_price * i.quantity)}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {STATUSES.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={o.status === s ? "default" : "outline"}
                    onClick={() => setOrderStatus.mutate({ id: o.id, status: s })}
                  >
                    {s}
                  </Button>
                ))}
                {wa ? (
                  <Button size="sm" variant="secondary" asChild>
                    <a href={wa} target="_blank" rel="noreferrer">
                      <MessageCircle className="size-4" /> WhatsApp
                    </a>
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto text-destructive hover:text-destructive"
                  disabled={removeOrder.isPending}
                  onClick={() => {
                    if (window.confirm(`Excluir o pedido ${o.code}? Essa ação não pode ser desfeita.`))
                      removeOrder.mutate(o.id);
                  }}
                >
                  <Trash2 className="size-4" /> Excluir
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <section className="mt-14">
        <h2 className="text-2xl">Log de exclusões</h2>
        <p className="text-sm text-muted-foreground">Registro de quem excluiu cada pedido e quando.</p>
        <div className="mt-4 space-y-2">
          {(auditLog ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma exclusão registrada.</p>
          ) : null}
          {(auditLog ?? []).map((entry) => (
            <div
              key={entry.id}
              className="surface-card flex flex-wrap items-center justify-between gap-2 p-4 text-sm"
            >
              <span>
                <strong>{entry.order_code}</strong>
                {entry.customer_name ? ` · ${entry.customer_name}` : ""} · {formatPrice(entry.total)}
                {entry.status ? ` · status ${entry.status}` : ""}
              </span>
              <span className="text-muted-foreground">
                excluído por {entry.actor_email ?? "desconhecido"} em{" "}
                {new Date(entry.created_at).toLocaleString("pt-BR")}
              </span>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
