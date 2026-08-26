import { Plus, Trash2 } from "lucide-react";
import { formatPrice, productPhoto, type Product } from "@/lib/products";
import { ProductMediaManager } from "@/components/ProductMediaManager";
import { ProductPricePanel } from "@/components/ProductPricePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export function ProductEditor({
  form,
  setForm,
  saving,
  onNew,
}: {
  form: Partial<Product>;
  setForm: (next: Partial<Product> | ((prev: Partial<Product>) => Partial<Product>)) => void;
  saving: boolean;
  onNew: () => void;
}) {
  const benefits = form.benefits ?? [];
  const slug = form.slug || "";
  const photo = form.slug ? productPhoto({ slug: form.slug, image_url: form.image_url ?? null }) : "";

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {form.id ? form.name || "Editar produto" : "Novo produto"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {form.id
              ? "Foto de perfil, vídeo, preço e ficha — o que o cliente vê na página."
              : "Preencha o nome e salve uma vez para liberar os quadros de foto e vídeo."}
          </p>
        </div>
        {form.id ? (
          <Button type="button" variant="ghost" size="sm" onClick={onNew}>
            <Plus className="size-4" />
            Novo
          </Button>
        ) : null}
      </div>

      <section className="grid gap-4 sm:grid-cols-[5.5rem_minmax(0,1fr)]">
        <div className="size-[5.5rem] overflow-hidden rounded-2xl bg-sand ring-1 ring-border/70">
          {photo ? (
            <img src={photo} alt="" className="size-full object-contain p-1.5" />
          ) : (
            <div
              className="size-full"
              style={{
                background: `linear-gradient(180deg, ${form.lid_color ?? "#C98A3C"} 28%, ${form.jar_color ?? "#F4F3F0"} 28%)`,
              }}
            />
          )}
        </div>
        <div className="grid gap-3">
          <Field label="Nome na vitrine">
            <Input
              value={form.name ?? ""}
              required
              placeholder="Ex.: Ginseng"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Endereço da página">
            <div className="flex items-center gap-0 overflow-hidden rounded-md border border-input bg-background">
              <span className="shrink-0 px-3 text-xs text-muted-foreground">/produtos/</span>
              <Input
                className="border-0 shadow-none focus-visible:ring-0"
                value={slug}
                placeholder="gerado do nome se vazio"
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
          </Field>
        </div>
      </section>

      <Field label="Linha debaixo do nome">
        <Input
          value={form.subtitle ?? ""}
          placeholder="Ex.: Energia e foco · 60 cápsulas de 500mg"
          onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
        />
      </Field>

      <ProductMediaManager
        productId={form.id}
        coverUrl={form.image_url}
        onCoverChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
      />

      <details className="rounded-xl bg-sand/50 px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium">Endereço da foto (avançado)</summary>
        <div className="pb-2 pt-3">
          <Input
            value={form.image_url ?? ""}
            placeholder="/produtos/gengibre.png"
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Só se a foto já estiver no site. O quadro acima grava sozinho ao soltar o arquivo.
          </p>
        </div>
      </details>

      <ProductPricePanel
        slug={form.slug}
        name={form.name}
        price={form.price ?? null}
        onChange={(price) => setForm({ ...form, price })}
      />

      <section className="space-y-3">
        <h3 className="text-base font-semibold tracking-tight">Ficha</h3>
        <Field label="Texto da página">
          <Textarea
            value={form.description ?? ""}
            rows={4}
            placeholder="O que é o produto, em poucas frases. Sem promessa de cura."
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <div className="space-y-2">
          <Label>Benefícios na página</Label>
          {benefits.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum ainda. Cada linha vira um item na ficha.</p>
          ) : null}
          {benefits.map((line, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={line}
                onChange={(e) => {
                  const next = [...benefits];
                  next[index] = e.target.value;
                  setForm({ ...form, benefits: next });
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remover benefício"
                onClick={() => setForm({ ...form, benefits: benefits.filter((_, i) => i !== index) })}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setForm({ ...form, benefits: [...benefits, ""] })}
          >
            <Plus className="size-3.5" />
            Adicionar linha
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cápsulas por pote">
            <Input
              type="number"
              min={1}
              value={form.capsule_count ?? 60}
              onChange={(e) => setForm({ ...form, capsule_count: Number(e.target.value) })}
            />
          </Field>
          <Field label="Como tomar">
            <Input
              value={form.dosage ?? ""}
              placeholder="1 cápsula ao dia"
              onChange={(e) => setForm({ ...form, dosage: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Ordem no catálogo">
          <Input
            type="number"
            value={form.sort_order ?? 99}
            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
          />
        </Field>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold tracking-tight">Cores do pote 3D</h3>
        <p className="text-sm text-muted-foreground">
          Usadas no visualizador quando não há modelo 3D. Combine com a foto de perfil.
        </p>
        <div className="flex items-end gap-4">
            <div
            className="flex h-20 w-12 flex-col overflow-hidden rounded-md shadow-[0_12px_24px_-16px_oklch(0.28_0.04_140_/_0.5)]"
            aria-hidden
          >
            <div className="h-5 shrink-0" style={{ background: form.lid_color ?? "#C98A3C" }} />
            <div className="min-h-0 flex-1" style={{ background: form.jar_color ?? "#F4F3F0" }} />
          </div>
          <div className="grid flex-1 grid-cols-3 gap-3">
            <ColorField
              label="Pote"
              value={form.jar_color ?? "#F4F3F0"}
              onChange={(jar_color) => setForm({ ...form, jar_color })}
            />
            <ColorField
              label="Tampa"
              value={form.lid_color ?? "#C98A3C"}
              onChange={(lid_color) => setForm({ ...form, lid_color })}
            />
            <ColorField
              label="Cápsula"
              value={form.capsule_color ?? "#E8B54A"}
              onChange={(capsule_color) => setForm({ ...form, capsule_color })}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold tracking-tight">Na loja</h3>
        <div className="flex items-center justify-between gap-4 rounded-xl bg-sand/60 px-3 py-2.5">
          <div>
            <Label htmlFor="stock">Tem estoque</Label>
            <p className="text-xs text-muted-foreground">Desligue para mostrar esgotado.</p>
          </div>
          <Switch
            id="stock"
            checked={form.in_stock ?? true}
            onCheckedChange={(in_stock) => setForm({ ...form, in_stock })}
          />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl bg-sand/60 px-3 py-2.5">
          <div>
            <Label htmlFor="active">Aparece no site</Label>
            <p className="text-xs text-muted-foreground">Oculto continua no painel.</p>
          </div>
          <Switch
            id="active"
            checked={form.is_active ?? true}
            onCheckedChange={(is_active) => setForm({ ...form, is_active })}
          />
        </div>
      </section>

      <div className="sticky bottom-0 -mx-5 border-t border-border/70 bg-card/95 px-5 py-3 backdrop-blur-sm">
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Salvando…" : "Salvar produto"}
        </Button>
        {form.price != null ? (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {formatPrice(form.price)} no catálogo
            {form.is_active === false ? " · oculto" : ""}
          </p>
        ) : null}
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

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <Input
          type="color"
          className="h-9 w-12 cursor-pointer p-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <Input
          className="font-mono text-xs"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </Field>
  );
}
