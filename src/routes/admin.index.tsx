import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { productsQuery, formatPrice, productPhoto, type Product } from "@/lib/products";
import { isDatabaseProductId } from "@/lib/media";
import { isPaidOrder } from "@/lib/orders";
import { storeSettingsQuery, type StoreSettings } from "@/lib/store";
import { adminKitsQuery } from "@/lib/kits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductEditor } from "@/components/ProductEditor";
import { AdminMembers } from "@/components/AdminMembers";
import { AdminKits } from "@/components/AdminKits";
import { AdminReviews } from "@/components/AdminReviews";
import { AdminShell, AdminTabs } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Painel · Opção Natural" },
      { name: "description", content: "Gerencie catálogo, kits, avaliações e a loja Opção Natural." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const empty: Partial<Product> = {
  slug: "",
  name: "",
  subtitle: "",
  description: "",
  benefits: [],
  dosage: "1 cápsula ao dia",
  capsule_count: 60,
  price: null,
  capsule_color: "#E8B54A",
  jar_color: "#F4F3F0",
  lid_color: "#C98A3C",
  image_url: null,
  in_stock: true,
  is_active: true,
  sort_order: 99,
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: products } = useQuery(productsQuery);
  const { data: kits } = useQuery(adminKitsQuery);
  const { data: settings } = useQuery(storeSettingsQuery);
  const [tab, setTab] = useState("visao");
  const [form, setForm] = useState<Partial<Product>>(empty);
  const [store, setStore] = useState<StoreSettings | null>(null);
  const [pixKey, setPixKey] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"todos" | "ativos" | "ocultos" | "sem-estoque">("todos");

  const { data: adminPix } = useQuery({
    queryKey: ["admin-pix-key", isAdmin],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_pix_key");
      if (error) throw error;
      return (data as string | null) ?? "";
    },
  });

  const { data: pendingReviews = 0 } = useQuery({
    queryKey: ["admin-reviews-count"],
    enabled: isAdmin,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("product_reviews")
        .select("id", { count: "exact", head: true })
        .eq("is_approved", false);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: orderStats } = useQuery({
    queryKey: ["admin-order-stats"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("id,status,total,payment_status,financial_status");
      if (error) throw error;
      const rows = (data ?? []).filter(isPaidOrder);
      return {
        total: rows.length,
        pending: rows.filter((o) => o.status === "pago").length,
        revenue: rows
          .filter((o) => o.status !== "cancelado")
          .reduce((s, o) => s + Number(o.total ?? 0), 0),
      };
    },
  });

  useEffect(() => {
    if (typeof adminPix === "string") setPixKey(adminPix);
  }, [adminPix]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (settings && !store) setStore(settings);
  }, [settings, store]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (products ?? []).filter((p) => {
      if (filter === "ativos" && !p.is_active) return false;
      if (filter === "ocultos" && p.is_active) return false;
      if (filter === "sem-estoque" && p.in_stock) return false;
      if (!term) return true;
      return [p.name, p.slug, p.subtitle].some((s) => s?.toLowerCase().includes(term));
    });
  }, [products, q, filter]);

  const saveSettings = useMutation({
    mutationFn: async (values: StoreSettings & { pix_key: string }) => {
      const { error } = await supabase
        .from("store_settings")
        .update({ ...values, pix_key: values.pix_key || null })
        .not("id", "is", null);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações salvas");
      qc.invalidateQueries({ queryKey: ["store-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: async (values: Partial<Product>) => {
      const slug = values.slug || slugify(values.name ?? "");
      const payload = {
        slug,
        name: values.name ?? "",
        subtitle: values.subtitle ?? null,
        description: values.description ?? null,
        benefits: (values.benefits ?? []).map((b) => b.trim()).filter(Boolean),
        dosage: values.dosage ?? null,
        capsule_count: values.capsule_count ?? 60,
        price: values.price ?? null,
        capsule_color: values.capsule_color ?? "#E8B54A",
        jar_color: values.jar_color ?? "#F4F3F0",
        lid_color: values.lid_color ?? "#C98A3C",
        image_url: values.image_url || null,
        in_stock: values.in_stock ?? true,
        is_active: values.is_active ?? true,
        sort_order: values.sort_order ?? 99,
      };
      if (isDatabaseProductId(values.id)) {
        const { error } = await supabase.from("products").update(payload).eq("id", values.id);
        if (error) throw error;
        return values.id;
      }
      const { data, error } = await supabase.from("products").insert(payload).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success("Produto salvo");
      setForm((f) => ({ ...f, id }));
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto removido");
      if (form.id) setForm(empty);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) return <div className="mx-auto max-w-6xl px-5 py-20">Carregando…</div>;

  if (user && !isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20">
        <h1 className="text-3xl">Acesso restrito</h1>
        <p className="mt-3 text-muted-foreground">
          Sua conta ({user.email}) ainda não tem permissão de administrador.
        </p>
      </div>
    );
  }

  const activeCount = (products ?? []).filter((p) => p.is_active).length;

  return (
    <AdminShell title="Painel" hint="Catálogo, kits, avaliações, sócios e configurações da loja.">
      <AdminTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "visao", label: "Visão geral" },
          { id: "catalogo", label: "Catálogo", count: products?.length ?? 0 },
          { id: "kits", label: "Kits", count: kits?.length ?? 0 },
          { id: "avaliacoes", label: "Avaliações", count: pendingReviews },
          { id: "loja", label: "Loja" },
          { id: "equipe", label: "Equipe" },
        ]}
      />

      {tab === "visao" ? (
        <div className="mt-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "Produtos no ar", n: String(activeCount), go: "catalogo" },
            { t: "Kits", n: String(kits?.length ?? 0), go: "kits" },
            { t: "Pedidos em aberto", n: String(orderStats?.pending ?? "—"), href: "/admin/pedidos" },
            { t: "Avaliações pendentes", n: String(pendingReviews), go: "avaliacoes" },
          ].map((c) =>
            c.href ? (
              <a key={c.t} href={c.href} className="surface-card block p-4 hover:bg-sand">
                <p className="text-xs text-muted-foreground">{c.t}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{c.n}</p>
              </a>
            ) : (
              <button
                key={c.t}
                type="button"
                className="surface-card p-4 text-left hover:bg-sand"
                onClick={() => setTab(c.go ?? "visao")}
              >
                <p className="text-xs text-muted-foreground">{c.t}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{c.n}</p>
              </button>
            ),
          )}
          </div>
          <div className="surface-card mt-3 flex flex-wrap items-end justify-between gap-3 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Faturamento (sem testes/cancelados)</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                {formatPrice(orderStats?.revenue ?? 0)}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{orderStats?.total ?? 0} pedidos no total</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setTab("catalogo")}>
                Abrir catálogo
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href="/admin/pedidos">Pedidos</a>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "catalogo" ? (
        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nome ou slug"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
            >
              <option value="todos">Todos</option>
              <option value="ativos">Visíveis</option>
              <option value="ocultos">Ocultos</option>
              <option value="sem-estoque">Sem estoque</option>
            </select>
          </div>

          <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
            <div className="space-y-2">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum produto nesse filtro.</p>
              ) : null}
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className={`surface-card flex items-center gap-3 p-3 ${form.id === p.id ? "ring-1 ring-clay" : ""}`}
                >
                  {productPhoto(p) ? (
                    <img src={productPhoto(p)} alt="" className="size-12 shrink-0 rounded-md object-contain bg-sand" />
                  ) : (
                    <div
                      className="size-12 shrink-0 rounded-md"
                      style={{ background: `linear-gradient(160deg, ${p.jar_color}, ${p.lid_color})` }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatPrice(p.price)}
                      {p.is_active ? "" : " · oculto"}
                      {p.in_stock ? "" : " · sem estoque"}
                    </p>
                  </div>
                  <Button variant={form.id === p.id ? "secondary" : "outline"} size="sm" onClick={() => setForm(p)}>
                    {form.id === p.id ? "Aberto" : "Editar"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Duplicar"
                    onClick={() => {
                      const { id: _id, ...rest } = p;
                      setForm({
                        ...rest,
                        name: `${p.name} (cópia)`,
                        slug: `${p.slug}-copia`,
                        sort_order: (p.sort_order ?? 99) + 1,
                      });
                    }}
                  >
                    <Copy className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(`Remover ${p.name} do catálogo?`)) remove.mutate(p.id);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            <form
              className="surface-card h-fit p-5"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(form);
              }}
            >
              <ProductEditor
                form={form}
                setForm={setForm}
                saving={save.isPending}
                onNew={() => setForm(empty)}
              />
            </form>
          </div>
        </div>
      ) : null}

      {tab === "kits" ? <AdminKits /> : null}
      {tab === "avaliacoes" ? <AdminReviews /> : null}

      {tab === "loja" && store ? (
        <form
          className="surface-card mt-8 grid gap-3 p-6 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            saveSettings.mutate({ ...store, pix_key: pixKey });
          }}
        >
          <Field label="WhatsApp (com DDI, ex. 556199...)">
            <Input
              value={store.whatsapp_number}
              onChange={(e) => setStore({ ...store, whatsapp_number: e.target.value })}
            />
          </Field>
          <Field label="Chave Pix">
            <Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} />
          </Field>
          <Field label="Frete (R$)">
            <Input
              type="number"
              step="0.01"
              value={store.shipping_fee}
              onChange={(e) => setStore({ ...store, shipping_fee: Number(e.target.value) })}
            />
          </Field>
          <Field label="Frete grátis acima de (R$)">
            <Input
              type="number"
              step="0.01"
              value={store.free_shipping_min}
              onChange={(e) => setStore({ ...store, free_shipping_min: Number(e.target.value) })}
            />
          </Field>
          <Button type="submit" className="sm:col-span-2" variant="secondary">
            Salvar configurações da loja
          </Button>
        </form>
      ) : null}

      {tab === "equipe" ? <AdminMembers /> : null}
    </AdminShell>
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
