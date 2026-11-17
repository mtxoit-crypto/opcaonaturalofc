import { useEffect, useRef } from "react";
import type { Dispatch, RefObject, SetStateAction, ReactNode } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { formatPrice, productPhoto, type Product } from "@/lib/products";
import { ProductMediaManager } from "@/components/ProductMediaManager";
import { ProductPricePanel } from "@/components/ProductPricePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export type ProductEditorSection = "geral" | "media" | "preco" | "ficha" | "3d" | "loja";
type SetForm = Dispatch<SetStateAction<Partial<Product>>>;

const SECTION_META: Array<{ id: ProductEditorSection; label: string }> = [
  { id: "geral", label: "Geral" },
  { id: "media", label: "Mídia" },
  { id: "preco", label: "Preço" },
  { id: "ficha", label: "Ficha" },
  { id: "3d", label: "3D" },
  { id: "loja", label: "Loja" },
];

export function ProductEditor({
  form,
  setForm,
  saving,
  activeSection,
  focusRequest,
  onSectionChange,
  onNew,
  onClose,
}: {
  form: Partial<Product>;
  setForm: SetForm;
  saving: boolean;
  activeSection: ProductEditorSection;
  focusRequest?: number;
  onSectionChange: (section: ProductEditorSection) => void;
  onNew: () => void;
  onClose: () => void;
}) {
  const sectionRefs = useRef<Partial<Record<ProductEditorSection, HTMLElement>>>({});
  const uploadDropAreaRef = useRef<HTMLDivElement>(null);
  const photo = form.slug ? productPhoto({ slug: form.slug, image_url: form.image_url ?? null }) : "";
  const incomplete: Record<ProductEditorSection, boolean> = {
    geral: !form.name?.trim(),
    media: !form.image_url,
    preco: form.price == null,
    ficha: !form.description?.trim(),
    "3d": !form.jar_color || !form.lid_color || !form.capsule_color,
    loja: false,
  };

  useEffect(() => {
    const section = sectionRefs.current[activeSection];
    if (!section) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    section.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    if (activeSection === "media") {
      window.setTimeout(() => uploadDropAreaRef.current?.focus(), reduced ? 0 : 250);
    }
  }, [activeSection, form.id, focusRequest]);

  const setSectionRef = (id: ProductEditorSection) => (node: HTMLElement | null) => {
    if (node) sectionRefs.current[id] = node;
    else delete sectionRefs.current[id];
  };

  return (
    <div className="space-y-6">
      <header className="sticky top-0 z-20 -mx-5 border-b border-border/70 bg-card/95 px-5 py-3 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="size-11 shrink-0 overflow-hidden rounded-xl bg-sand ring-1 ring-border/70">
            {photo ? (
              <img src={photo} alt="" className="size-full object-contain p-1" />
            ) : (
              <div
                className="size-full"
                style={{
                  background: `linear-gradient(180deg, ${form.lid_color ?? "#C98A3C"} 28%, ${form.jar_color ?? "#F4F3F0"} 28%)`,
                }}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold tracking-tight">
              {form.id ? form.name || "Editar produto" : "Novo produto"}
            </h2>
            <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
              <span className="rounded-full bg-secondary px-2 py-0.5">
                {form.is_active === false ? "Oculto" : "Visível"}
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5">
                {form.in_stock === false ? "Sem estoque" : "Em estoque"}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {form.slug ? (
              <Button type="button" variant="ghost" size="sm" asChild>
                <Link to="/produtos/$slug" params={{ slug: form.slug }} target="_blank">
                  <ExternalLink className="size-3.5" />
                  <span className="hidden sm:inline">Ver no site</span>
                </Link>
              </Button>
            ) : null}
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
        <nav aria-label="Seções do produto" className="mt-3 flex gap-1 overflow-x-auto pb-0.5">
          {SECTION_META.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={activeSection === item.id ? "location" : undefined}
              onClick={() => onSectionChange(item.id)}
              className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors ${
                activeSection === item.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
              {incomplete[item.id] ? (
                <span aria-label="incompleta" className="size-1.5 rounded-full bg-clay" />
              ) : null}
            </button>
          ))}
        </nav>
      </header>

      <ProductGeneralSection
        sectionRef={setSectionRef("geral")}
        form={form}
        setForm={setForm}
        onNew={onNew}
      />
      <ProductMediaSection
        sectionRef={setSectionRef("media")}
        form={form}
        setForm={setForm}
        uploadDropAreaRef={uploadDropAreaRef}
      />
      <ProductPriceSection sectionRef={setSectionRef("preco")} form={form} setForm={setForm} />
      <ProductDetailsSection sectionRef={setSectionRef("ficha")} form={form} setForm={setForm} />
      <Product3DSection sectionRef={setSectionRef("3d")} form={form} setForm={setForm} />
      <ProductStoreSection sectionRef={setSectionRef("loja")} form={form} setForm={setForm} />

      <footer className="border-t border-border/70 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onNew}>
            <Plus className="size-4" />
            Novo produto
          </Button>
          <div className="flex items-center gap-3">
            {form.price != null ? (
              <p className="text-xs text-muted-foreground">
                {formatPrice(form.price)} no catálogo
                {form.is_active === false ? " · oculto" : ""}
              </p>
            ) : null}
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando…" : "Salvar produto"}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

type SectionProps = {
  form: Partial<Product>;
  setForm: SetForm;
  sectionRef?: (node: HTMLElement | null) => void;
};

export const ProductGeneralSection = ({ form, setForm, sectionRef, onNew }: SectionProps & { onNew: () => void }) => (
  <EditorSection id="geral" title="Geral" sectionRef={sectionRef}>
    <div className="flex justify-end">
      <Button type="button" variant="ghost" size="sm" onClick={onNew}>
        <Plus className="size-4" />
        Novo produto
      </Button>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
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
            value={form.slug ?? ""}
            placeholder="gerado do nome se vazio"
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
        </div>
      </Field>
    </div>
    <Field label="Linha debaixo do nome">
      <Input
        value={form.subtitle ?? ""}
        placeholder="Ex.: Energia e foco · 60 cápsulas de 500mg"
        onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
      />
    </Field>
  </EditorSection>
);
ProductGeneralSection.displayName = "ProductGeneralSection";

export const ProductMediaSection = ({
  form,
  setForm,
  sectionRef,
  uploadDropAreaRef,
}: SectionProps & { uploadDropAreaRef: RefObject<HTMLDivElement | null> }) => (
  <EditorSection id="media" title="Mídia" sectionRef={sectionRef}>
    <ProductMediaManager
      {...(form.id !== undefined ? { productId: form.id } : {})}
      {...(form.image_url !== undefined ? { coverUrl: form.image_url } : {})}
      uploadDropAreaRef={uploadDropAreaRef}
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
  </EditorSection>
);
ProductMediaSection.displayName = "ProductMediaSection";

export const ProductPriceSection = ({ form, setForm, sectionRef }: SectionProps) => (
  <EditorSection id="preco" title="Preço" sectionRef={sectionRef}>
    <ProductPricePanel
      price={form.price ?? null}
      onChange={(price) => setForm({ ...form, price })}
    />
  </EditorSection>
);
ProductPriceSection.displayName = "ProductPriceSection";

export const ProductDetailsSection = ({ form, setForm, sectionRef }: SectionProps) => {
  const benefits = form.benefits ?? [];
  return (
    <EditorSection id="ficha" title="Ficha" sectionRef={sectionRef}>
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
    </EditorSection>
  );
};
ProductDetailsSection.displayName = "ProductDetailsSection";

export const Product3DSection = ({ form, setForm, sectionRef }: SectionProps) => (
  <EditorSection id="3d" title="Cores do pote 3D" sectionRef={sectionRef}>
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
    <ProductMediaManager {...(form.id !== undefined ? { productId: form.id } : {})} showModel />
  </EditorSection>
);
Product3DSection.displayName = "Product3DSection";

export const ProductStoreSection = ({ form, setForm, sectionRef }: SectionProps) => (
  <EditorSection id="loja" title="Na loja" sectionRef={sectionRef}>
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
  </EditorSection>
);
ProductStoreSection.displayName = "ProductStoreSection";

function EditorSection({
  id,
  title,
  sectionRef,
  children,
}: {
  id: ProductEditorSection;
  title: string;
  sectionRef?: ((node: HTMLElement | null) => void) | undefined;
  children: ReactNode;
}) {
  return (
    <section
      ref={sectionRef}
      id={`product-section-${id}`}
      className="scroll-mt-24 space-y-3"
    >
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
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
