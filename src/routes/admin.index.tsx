import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { productsQuery, type Product } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Painel do catálogo · Opção Natural" },
      { name: "description", content: "Gerencie os produtos naturais do catálogo Opção Natural." },
      { property: "og:title", content: "Painel do catálogo · Opção Natural" },
      { property: "og:description", content: "Gerencie os produtos do catálogo." },
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
  jar_color: "#2A3A2C",
  lid_color: "#C98A3C",
  is_active: true,
  sort_order: 99,
};

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: products } = useQuery(productsQuery);
  const [form, setForm] = useState<Partial<Product>>(empty);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const save = useMutation({
    mutationFn: async (values: Partial<Product>) => {
      const slug =
        values.slug ||
        (values.name ?? "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      const payload = {
        slug,
        name: values.name ?? "",
        subtitle: values.subtitle ?? null,
        description: values.description ?? null,
        benefits: values.benefits ?? [],
        dosage: values.dosage ?? null,
        capsule_count: values.capsule_count ?? 60,
        price: values.price ?? null,
        capsule_color: values.capsule_color ?? "#E8B54A",
        jar_color: values.jar_color ?? "#2A3A2C",
        lid_color: values.lid_color ?? "#C98A3C",
        is_active: values.is_active ?? true,
        sort_order: values.sort_order ?? 99,
      };
      const { error } = values.id
        ? await supabase.from("products").update(payload).eq("id", values.id)
        : await supabase.from("products").insert(payload);
      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("Produto salvo");
      setForm(empty);
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
          Sua conta ({user.email}) ainda não tem permissão de administrador. Peça a um administrador
          para liberar o acesso.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="text-4xl">Painel do catálogo</h1>
      <p className="mt-2 text-muted-foreground">Crie, edite e remova os produtos do site.</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {(products ?? []).map((p) => (
            <div key={p.id} className="surface-card flex items-center gap-4 p-4">
              <div
                className="size-12 shrink-0 rounded-lg"
                style={{ background: `linear-gradient(160deg, ${p.jar_color}, ${p.lid_color})` }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg">{p.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {p.slug} · {p.capsule_count} cápsulas {p.is_active ? "" : "· inativo"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setForm(p)}>
                Editar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => remove.mutate(p.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        <form
          className="surface-card space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(form);
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl">{form.id ? "Editar produto" : "Novo produto"}</h2>
            {form.id ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setForm(empty)}>
                <Plus className="size-4" />
              </Button>
            ) : null}
          </div>

          <Field label="Nome">
            <Input
              value={form.name ?? ""}
              required
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Subtítulo">
            <Input
              value={form.subtitle ?? ""}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            />
          </Field>
          <Field label="Descrição">
            <Textarea
              value={form.description ?? ""}
              rows={4}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="Benefícios (um por linha)">
            <Textarea
              value={(form.benefits ?? []).join("\n")}
              rows={3}
              onChange={(e) =>
                setForm({ ...form, benefits: e.target.value.split("\n").filter(Boolean) })
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cápsulas">
              <Input
                type="number"
                value={form.capsule_count ?? 60}
                onChange={(e) => setForm({ ...form, capsule_count: Number(e.target.value) })}
              />
            </Field>
            <Field label="Preço (R$)">
              <Input
                type="number"
                step="0.01"
                value={form.price ?? ""}
                onChange={(e) =>
                  setForm({ ...form, price: e.target.value ? Number(e.target.value) : null })
                }
              />
            </Field>
          </div>
          <Field label="Dosagem">
            <Input
              value={form.dosage ?? ""}
              onChange={(e) => setForm({ ...form, dosage: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Pote">
              <Input
                type="color"
                value={form.jar_color ?? "#2A3A2C"}
                onChange={(e) => setForm({ ...form, jar_color: e.target.value })}
              />
            </Field>
            <Field label="Tampa">
              <Input
                type="color"
                value={form.lid_color ?? "#C98A3C"}
                onChange={(e) => setForm({ ...form, lid_color: e.target.value })}
              />
            </Field>
            <Field label="Cápsula">
              <Input
                type="color"
                value={form.capsule_color ?? "#E8B54A"}
                onChange={(e) => setForm({ ...form, capsule_color: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="active">Visível no site</Label>
            <Switch
              id="active"
              checked={form.is_active ?? true}
              onCheckedChange={(v) => setForm({ ...form, is_active: v })}
            />
          </div>
          <Button type="submit" className="w-full" disabled={save.isPending}>
            Salvar produto
          </Button>
        </form>
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
