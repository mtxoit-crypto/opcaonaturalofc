import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, ExternalLink, ImagePlus, Pencil, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { adminProductsQuery, formatPrice, productPhoto, type Product } from "@/lib/products";
import { isDatabaseProductId } from "@/lib/media";
import { isPaidOrder } from "@/lib/orders";
import { storeSettingsQuery, type StoreSettings } from "@/lib/store";
import { adminKitsQuery } from "@/lib/kits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductEditor, type ProductEditorSection } from "@/components/ProductEditor";
import { AdminAudit } from "@/components/AdminAudit";
import { AdminMedia } from "@/components/AdminMedia";
import { AdminMembers } from "@/components/AdminMembers";
import { AdminKits } from "@/components/AdminKits";
import { AdminReviews } from "@/components/AdminReviews";
import { AdminShell, AdminTabs, type AdminTab } from "@/components/AdminShell";
import { AdminStock } from "@/components/AdminStock";
import { hasNumericInventory, isLowStock, productInventoryQuery } from "@/lib/inventory";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

type ProductFilter = "todos" | "ativos" | "ocultos" | "sem-estoque" | "em-estoque";
type BulkProductAction = "publicar" | "ocultar" | "em-estoque" | "sem-estoque";
type AdminSearch = {
  tab?: AdminTab;
  product?: string;
  section?: ProductEditorSection;
  q?: string;
  filter?: ProductFilter;
};
type AdminSearchPatch = {
  [Key in keyof AdminSearch]?: AdminSearch[Key];
};

const ADMIN_TABS: AdminTab[] = [
  "visao",
  "catalogo",
  "estoque",
  "kits",
  "avaliacoes",
  "clientes",
  "cupons",
  "midia",
  "configuracoes",
  "equipe",
  "auditoria",
];
const EDITOR_SECTIONS: ProductEditorSection[] = ["geral", "media", "preco", "ficha", "3d", "loja"];
const PRODUCT_FILTERS: ProductFilter[] = ["todos", "ativos", "ocultos", "sem-estoque", "em-estoque"];

function incompleteProductReasons(product: Product) {
  return [
    !product.image_url ? "sem foto" : null,
    product.price == null ? "sem preço" : null,
    !product.description?.trim() ? "sem descrição" : null,
  ].filter((reason): reason is string => reason !== null);
}

function normalizeAdminTab(value: string): AdminTab | undefined {
  if (value === "produtos") return "catalogo";
  if (value === "loja") return "configuracoes";
  return ADMIN_TABS.includes(value as AdminTab) ? (value as AdminTab) : undefined;
}

function mergeAdminSearch(
  previous: AdminSearch,
  patch: AdminSearchPatch,
  clear: Array<keyof AdminSearch>,
): AdminSearch {
  const next = { ...previous } as Record<keyof AdminSearch, unknown>;
  Object.assign(next, patch);
  for (const key of clear) delete next[key];
  return next as AdminSearch;
}

export const Route = createFileRoute("/admin/")({
  validateSearch: (search: Record<string, unknown>): AdminSearch => {
    const tab = search.tab;
    const product = search.product;
    const section = search.section;
    const q = search.q;
    const filter = search.filter;
    const normalizedTab = typeof tab === "string" ? normalizeAdminTab(tab) : undefined;
    return {
      ...(normalizedTab ? { tab: normalizedTab } : {}),
      ...(typeof product === "string" && isDatabaseProductId(product) ? { product } : {}),
      ...(typeof section === "string" && EDITOR_SECTIONS.includes(section as ProductEditorSection)
        ? { section: section as ProductEditorSection }
        : {}),
      ...(typeof q === "string" ? { q } : {}),
      ...(typeof filter === "string" && PRODUCT_FILTERS.includes(filter as ProductFilter)
        ? { filter: filter as ProductFilter }
        : {}),
    };
  },
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
  const isMobile = useIsMobile();
  const productsState = useQuery(adminProductsQuery(isAdmin));
  const inventoryState = useQuery(productInventoryQuery(isAdmin));
  const products = productsState.data;
  const { data: kits } = useQuery(adminKitsQuery);
  const { data: settings } = useQuery(storeSettingsQuery);
  const { tab: tabParam, product: productParam, section: sectionParam, q: qParam, filter: filterParam } =
    Route.useSearch();
  const tab = tabParam ?? "visao";
  const q = qParam ?? "";
  const filter = filterParam ?? "todos";
  const [form, setForm] = useState<Partial<Product>>(empty);
  const [initialForm, setInitialForm] = useState<Partial<Product>>(empty);
  const [editorOpen, setEditorOpen] = useState(Boolean(productParam));
  const [mediaFocusRequest, setMediaFocusRequest] = useState(0);
  const [store, setStore] = useState<StoreSettings | null>(null);
  const [pixKey, setPixKey] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(() => new Set());
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});
  const editorRef = useRef<HTMLDivElement>(null);
  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form, initialForm]);
  const activeSection = sectionParam ?? "geral";
  const databaseProductIds = useMemo(
    () => (products ?? []).filter((product) => isDatabaseProductId(product.id)).map((product) => product.id),
    [products],
  );

  const { data: modelProductIds = [], isError: modelMediaError } = useQuery({
    queryKey: ["admin-model-media", databaseProductIds],
    enabled: isAdmin && tab === "visao" && databaseProductIds.length > 0,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("product_media")
        .select("product_id")
        .eq("media_type", "model");
      if (error) throw error;
      return (data ?? []).map((row) => row.product_id);
    },
  });

  const { data: adminPix } = useQuery({
    queryKey: ["admin-pix-key", isAdmin],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_pix_key");
      if (error) throw error;
      return (data as string | null) ?? "";
    },
  });

  const { data: pendingReviews } = useQuery({
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
    if (!products || !productParam) return;
    const next = products.find((product) => product.id === productParam);
    if (!next || form.id === next.id) {
      if (next) setEditorOpen(true);
      return;
    }
    if (isDirty) {
      if (!window.confirm("Há alterações não salvas. Descartar e abrir outro produto?")) {
        navigate({
          search: (previous) =>
            mergeAdminSearch(
              previous,
              {
                ...(isDatabaseProductId(form.id) ? { product: form.id } : {}),
                section: activeSection,
              },
              isDatabaseProductId(form.id) ? [] : ["product"],
            ),
        });
        return;
      }
    }
    setForm(next);
    setInitialForm(next);
    setEditorOpen(true);
  }, [products, productParam, form.id, isDirty, navigate, activeSection]);

  useEffect(() => {
    if (!productParam && isDatabaseProductId(form.id) && !isDirty) {
      setForm(empty);
      setInitialForm(empty);
      setEditorOpen(false);
    }
  }, [productParam, form.id, isDirty]);

  useEffect(() => {
    if (settings && !store) setStore(settings);
  }, [settings, store]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (products ?? []).filter((p) => {
      if (filter === "ativos" && !p.is_active) return false;
      if (filter === "ocultos" && p.is_active) return false;
      if (filter === "em-estoque" && !p.in_stock) return false;
      if (filter === "sem-estoque" && p.in_stock) return false;
      if (!term) return true;
      return [p.name, p.slug, p.subtitle].some((s) => s?.toLowerCase().includes(term));
    });
  }, [products, q, filter]);
  const selectedProducts = useMemo(
    () => (products ?? []).filter((product) => selectedProductIds.has(product.id)),
    [products, selectedProductIds],
  );
  const allFilteredSelected = filtered.length > 0 && filtered.every((product) => selectedProductIds.has(product.id));

  useEffect(() => {
    const availableIds = new Set((products ?? []).map((product) => product.id));
    setSelectedProductIds((current) => {
      const next = new Set([...current].filter((id) => availableIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [products]);

  function toggleFilteredSelection(checked: boolean) {
    setSelectedProductIds((current) => {
      const next = new Set(current);
      filtered.forEach((product) => {
        if (checked) next.add(product.id);
        else next.delete(product.id);
      });
      return next;
    });
  }

  function saveOrder(product: Product, rawValue: string) {
    const value = Number(rawValue.trim());
    if (!rawValue.trim() || !Number.isInteger(value) || value < 0) {
      toast.error("Informe uma ordem inteira igual ou maior que zero.");
      setOrderDrafts((current) => ({ ...current, [product.id]: String(product.sort_order) }));
      return;
    }
    if (value === product.sort_order) {
      setOrderDrafts((current) => {
        const next = { ...current };
        delete next[product.id];
        return next;
      });
      return;
    }
    updateOrder.mutate({ id: product.id, sortOrder: value });
  }

  function scrollEditorIntoView() {
    window.requestAnimationFrame(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      editorRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    });
  }

  function updateSearch(search: AdminSearchPatch, clear: Array<keyof AdminSearch> = []) {
    navigate({ search: (previous) => mergeAdminSearch(previous, search, clear) });
  }

  function confirmDiscard(message = "Há alterações não salvas. Descartar?") {
    return !isDirty || window.confirm(message);
  }

  function selectProduct(product: Product, section: ProductEditorSection = "geral") {
    if (section === "media") setMediaFocusRequest((request) => request + 1);
    if (form.id === product.id) {
      setEditorOpen(true);
      if (isDatabaseProductId(product.id)) {
        updateSearch({ tab: "catalogo", product: product.id, section });
      } else {
        updateSearch({ tab: "catalogo", section }, ["product"]);
      }
      scrollEditorIntoView();
      return;
    }
    if (form.id !== product.id && !confirmDiscard("Há alterações não salvas. Descartar e abrir outro produto?")) {
      return;
    }
    setForm(product);
    setInitialForm(product);
    setEditorOpen(true);
    if (isDatabaseProductId(product.id)) {
      updateSearch({ tab: "catalogo", product: product.id, section });
    } else {
      updateSearch({ tab: "catalogo", section }, ["product"]);
    }
    scrollEditorIntoView();
  }

  function changeTab(next: string) {
    const nextTab = normalizeAdminTab(next);
    if (!nextTab || nextTab === tab) return;
    if (!confirmDiscard()) return;
    setForm(empty);
    setInitialForm(empty);
    setEditorOpen(false);
    updateSearch({ tab: nextTab }, ["product", "section"]);
  }

  function closeEditor() {
    if (!confirmDiscard()) return;
    setForm(empty);
    setInitialForm(empty);
    setEditorOpen(false);
    updateSearch({ tab: "catalogo" }, ["product", "section"]);
  }

  function openNewEditor() {
    if (!confirmDiscard("Há alterações não salvas. Descartar e criar outro produto?")) return;
    setForm(empty);
    setInitialForm(empty);
    setEditorOpen(true);
    updateSearch({ tab: "catalogo", section: "geral" }, ["product"]);
    scrollEditorIntoView();
  }

  function changeSection(section: ProductEditorSection) {
    updateSearch({ tab: "catalogo", section });
  }

  async function copyProductLink(product: Product) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/produtos/${product.slug}`);
      toast.success("Link copiado");
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  }

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
        return values.id as string;
      }
      const { data, error } = await supabase.from("products").insert(payload).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id, values) => {
      toast.success("Produto salvo");
      const saved = { ...values, id, slug: values.slug || slugify(values.name ?? "") };
      setForm(saved);
      setInitialForm(saved);
      if (isDatabaseProductId(id)) {
        updateSearch({ tab: "catalogo", product: id, section: activeSection });
      } else {
        updateSearch({ tab: "catalogo", section: activeSection }, ["product"]);
      }
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleVisibility = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (!isDatabaseProductId(id)) {
        throw new Error("Este produto não tem registro editável no catálogo local.");
      }
      const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? "Produto publicado" : "Produto ocultado");
      qc.setQueryData<Product[]>(["admin-products"], (current) =>
        current?.map((product) =>
          product.id === variables.id ? { ...product, is_active: variables.isActive } : product,
        ),
      );
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateOrder = useMutation({
    mutationFn: async ({ id, sortOrder }: { id: string; sortOrder: number }) => {
      if (!isDatabaseProductId(id)) {
        throw new Error("A ordem só pode ser alterada para produtos do catálogo local.");
      }
      const { error } = await supabase.from("products").update({ sort_order: sortOrder }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      setOrderDrafts((current) => {
        const next = { ...current };
        delete next[variables.id];
        return next;
      });
      qc.setQueryData<Product[]>(["admin-products"], (current) =>
        current?.map((product) =>
          product.id === variables.id ? { ...product, sort_order: variables.sortOrder } : product,
        ),
      );
      toast.success("Ordem atualizada");
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkUpdate = useMutation({
    mutationFn: async ({
      action,
      products: selected,
    }: {
      action: BulkProductAction;
      products: Product[];
    }) => {
      const editable = selected.filter((product) => isDatabaseProductId(product.id));
      const skipped = selected.length - editable.length;
      if (editable.length === 0) return { action, updated: 0, skipped };

      const field: { is_active?: boolean; in_stock?: boolean } =
        action === "publicar"
          ? { is_active: true }
          : action === "ocultar"
            ? { is_active: false }
            : action === "em-estoque"
              ? { in_stock: true }
              : { in_stock: false };
      await Promise.all(
        editable.map(async (product) => {
          const { error } = await supabase.from("products").update(field).eq("id", product.id);
          if (error) throw error;
        }),
      );
      return { action, updated: editable.length, skipped };
    },
    onSuccess: ({ action, updated, skipped }, variables) => {
      setSelectedProductIds(new Set());
      const isActive = action === "publicar" ? true : action === "ocultar" ? false : undefined;
      const inStock = action === "em-estoque" ? true : action === "sem-estoque" ? false : undefined;
      const updatedIds = new Set(
        variables.products.filter((product) => isDatabaseProductId(product.id)).map((product) => product.id),
      );
      qc.setQueryData<Product[]>(["admin-products"], (current) =>
        current?.map((product) => ({
          ...product,
          ...(updatedIds.has(product.id) && isActive !== undefined ? { is_active: isActive } : {}),
          ...(updatedIds.has(product.id) && inStock !== undefined ? { in_stock: inStock } : {}),
        })),
      );
      const actionLabel =
        action === "publicar"
          ? "publicados"
          : action === "ocultar"
            ? "ocultados"
            : action === "em-estoque"
              ? "marcados em estoque"
              : "marcados sem estoque";
      if (updated === 0) {
        toast.warning(
          `Nenhum produto local foi atualizado. ${skipped} produto(s) externo(s) (Shopify/catálogo externo) ignorado(s).`,
        );
      } else if (skipped > 0) {
        toast.success(
          `${updated} produto(s) ${actionLabel}; ${skipped} externo(s) (Shopify/catálogo externo) ignorado(s).`,
        );
      } else {
        toast.success(`${updated} produto(s) ${actionLabel}.`);
      }
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => {
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
      toast.error(e.message);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!isDatabaseProductId(id)) {
        throw new Error("Este produto externo não pode ser removido pelo painel.");
      }
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      toast.success("Produto removido");
      if (form.id === id) {
        setForm(empty);
        setInitialForm(empty);
        setEditorOpen(false);
        updateSearch({}, ["product", "section"]);
      }
      qc.invalidateQueries({ queryKey: ["admin-products"] });
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
  const outOfStockCount = (products ?? []).filter((p) => !p.in_stock).length;
  const withoutPhotoCount = (products ?? []).filter((p) => !p.image_url).length;
  const withoutPriceCount = (products ?? []).filter((p) => p.price == null).length;
  const withoutDescriptionCount = (products ?? []).filter((p) => !p.description?.trim()).length;
  const numericInventoryRows = inventoryState.data ?? [];
  const hasNumericStock = numericInventoryRows.some(hasNumericInventory);
  const lowStockCount = numericInventoryRows.filter(isLowStock).length;
  const modelProductIdSet = new Set(modelProductIds);
  const withoutModelCount = (products ?? []).filter((p) => !modelProductIdSet.has(p.id)).length;

  return (
    <AdminShell title="Painel" hint="Produtos, estoque, pedidos e operação da loja.">
      <AdminTabs
        value={tab}
        onChange={changeTab}
        tabs={[
          { id: "visao", label: "Visão geral" },
          { id: "catalogo", label: "Produtos", count: products?.length ?? 0 },
          { id: "estoque", label: "Estoque", ...(products ? { count: outOfStockCount } : {}) },
          { id: "kits", label: "Kits", count: kits?.length },
          { id: "avaliacoes", label: "Avaliações", count: pendingReviews },
          { id: "clientes", label: "Clientes" },
          { id: "cupons", label: "Cupons" },
          { id: "midia", label: "Mídias" },
          { id: "configuracoes", label: "Configurações" },
          { id: "equipe", label: "Equipe" },
          { id: "auditoria", label: "Auditoria" },
        ]}
      />

      {tab === "visao" ? (
        <div className="mt-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "Produtos no ar", n: products ? String(activeCount) : "—", go: "catalogo" },
            { t: "Kits", n: kits ? String(kits.length) : "—", go: "kits" },
            { t: "Pedidos em aberto", n: String(orderStats?.pending ?? "—"), href: "/admin/pedidos" },
            { t: "Avaliações pendentes", n: String(pendingReviews ?? "—"), go: "avaliacoes" },
            {
              t: "Estoque baixo",
              n: hasNumericStock ? String(lowStockCount) : "—",
              go: "estoque",
            },
          ].map((c) =>
            c.href ? (
              <Link to="/admin/pedidos" key={c.t} className="surface-card block p-4 hover:bg-sand">
                <p className="text-xs text-muted-foreground">{c.t}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{c.n}</p>
              </Link>
            ) : (
              <button
                key={c.t}
                type="button"
                className="surface-card p-4 text-left hover:bg-sand"
                onClick={() => changeTab(c.go ?? "visao")}
              >
                <p className="text-xs text-muted-foreground">{c.t}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{c.n}</p>
              </button>
            ),
          )}
          </div>
          {inventoryState.isError ? (
            <p className="mt-2 text-xs text-muted-foreground">
              A contagem de estoque baixo ficará disponível quando a migração numérica estiver aplicada.
            </p>
          ) : inventoryState.isSuccess && !hasNumericStock ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Nenhuma quantidade numérica foi configurada; a contagem não usa o sinal booleano.
            </p>
          ) : null}
          <section className="mt-6">
            <h2 className="text-base font-semibold tracking-tight">Qualidade do catálogo</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { t: "Sem foto", n: products ? withoutPhotoCount : "—", go: "catalogo" },
                { t: "Sem preço", n: products ? withoutPriceCount : "—", go: "catalogo" },
                { t: "Sem descrição", n: products ? withoutDescriptionCount : "—", go: "catalogo" },
                {
                  t: "Sem modelo 3D",
                  n: !products || modelMediaError ? "—" : withoutModelCount,
                  go: "midia",
                },
              ].map((card) => (
                <button
                  key={card.t}
                  type="button"
                  className="surface-card p-4 text-left hover:bg-sand"
                  onClick={() => changeTab(card.go)}
                >
                  <p className="text-xs text-muted-foreground">{card.t}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{card.n}</p>
                </button>
              ))}
            </div>
            {modelMediaError ? (
              <p className="mt-2 text-xs text-muted-foreground">
                A consulta de modelos 3D não está disponível agora.
              </p>
            ) : null}
          </section>
          <div className="surface-card mt-3 flex flex-wrap items-end justify-between gap-3 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Faturamento (sem testes/cancelados)</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                {orderStats ? formatPrice(orderStats.revenue) : "—"}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {orderStats?.total ?? "—"} pedidos no total
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => changeTab("catalogo")}>
                Abrir catálogo
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/admin/pedidos">Pedidos</Link>
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
                onChange={(e) => updateSearch({ q: e.target.value })}
              />
            </div>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={filter}
              onChange={(e) => updateSearch({ filter: e.target.value as ProductFilter })}
            >
              <option value="todos">Todos</option>
              <option value="ativos">Visíveis</option>
              <option value="ocultos">Ocultos</option>
              <option value="em-estoque">Em estoque</option>
              <option value="sem-estoque">Sem estoque</option>
            </select>
          </div>
          <div className="surface-card mt-3 flex flex-wrap items-center gap-3 p-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-input accent-clay"
                checked={allFilteredSelected}
                disabled={filtered.length === 0}
                ref={(element) => {
                  if (element) {
                    element.indeterminate =
                      filtered.some((product) => selectedProductIds.has(product.id)) && !allFilteredSelected;
                  }
                }}
                aria-label="Selecionar produtos visíveis filtrados"
                onChange={(event) => toggleFilteredSelection(event.target.checked)}
              />
              Selecionar filtrados
            </label>
            <span className="text-sm text-muted-foreground">
              {selectedProducts.length} selecionado{selectedProducts.length === 1 ? "" : "s"}
            </span>
            {selectedProducts.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={bulkUpdate.isPending}
                  onClick={() => bulkUpdate.mutate({ action: "publicar", products: selectedProducts })}
                >
                  Publicar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={bulkUpdate.isPending}
                  onClick={() => bulkUpdate.mutate({ action: "ocultar", products: selectedProducts })}
                >
                  Ocultar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={bulkUpdate.isPending}
                  onClick={() => bulkUpdate.mutate({ action: "em-estoque", products: selectedProducts })}
                >
                  Marcar em estoque
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={bulkUpdate.isPending}
                  onClick={() => bulkUpdate.mutate({ action: "sem-estoque", products: selectedProducts })}
                >
                  Marcar sem estoque
                </Button>
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-8 md:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
            <div className="space-y-2">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum produto nesse filtro.</p>
              ) : null}
              {filtered.map((p) => {
                const editable = isDatabaseProductId(p.id);
                const incompleteReasons = incompleteProductReasons(p);
                return (
                  <div
                    key={p.id}
                    className={`surface-card flex items-center gap-3 border ${
                      incompleteReasons.length > 0 ? "border-clay/50 bg-clay/[0.03]" : "border-transparent"
                    } p-3 ${form.id === p.id ? "ring-1 ring-clay" : ""}`}
                  >
                    <input
                      type="checkbox"
                      className="size-4 shrink-0 rounded border-input accent-clay"
                      checked={selectedProductIds.has(p.id)}
                      aria-label={`Selecionar ${p.name}`}
                      onChange={(event) => {
                        setSelectedProductIds((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(p.id);
                          else next.delete(p.id);
                          return next;
                        });
                      }}
                    />
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
                    {incompleteReasons.length > 0 ? (
                      <span className="mt-1 inline-flex rounded-full bg-clay/15 px-2 py-0.5 text-[11px] font-medium text-clay">
                        Incompleto · {incompleteReasons.join(", ")}
                      </span>
                    ) : null}
                    {!editable ? (
                      <span className="mt-1 inline-flex rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                        Externo · não editável
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-end justify-end gap-1">
                    <label className="mr-1 space-y-1">
                      <span className="block text-[11px] text-muted-foreground">Ordem no catálogo</span>
                      <Input
                        className="h-8 w-20"
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        value={orderDrafts[p.id] ?? String(p.sort_order)}
                        disabled={!editable || updateOrder.isPending}
                        aria-label={`Ordem no catálogo de ${p.name}`}
                        title={editable ? "Salvar ordem ao sair do campo" : "Produto externo (Shopify)"}
                        onChange={(event) =>
                          setOrderDrafts((current) => ({ ...current, [p.id]: event.target.value }))
                        }
                        onBlur={(event) => saveOrder(p, event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") event.currentTarget.blur();
                        }}
                      />
                    </label>
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        to="/produtos/$slug"
                        params={{ slug: p.slug }}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Ver ${p.name} no site`}
                        title="Ver no site"
                      >
                        <ExternalLink className="size-3.5" />
                        <span className="hidden lg:inline">Ver no site</span>
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      title="Copiar link"
                      onClick={() => void copyProductLink(p)}
                    >
                      <Copy className="size-3.5" />
                      <span className="hidden lg:inline">Copiar link</span>
                    </Button>
                    <Button
                      type="button"
                      variant={form.id === p.id ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => selectProduct(p)}
                    >
                      <Pencil className="size-3.5" />
                      {form.id === p.id ? "Aberto" : "Editar"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={!isDatabaseProductId(p.id) || toggleVisibility.isPending}
                      title={isDatabaseProductId(p.id) ? undefined : "Disponibilidade externa"}
                      onClick={() =>
                        toggleVisibility.mutate({ id: p.id, isActive: !p.is_active })
                      }
                    >
                      {p.is_active ? "Ocultar" : "Publicar"}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => changeTab("estoque")}>
                      Estoque
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => selectProduct(p, "ficha")}>
                      Ordem
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Editar foto de ${p.name}`}
                      title="Editar foto"
                      onClick={() => selectProduct(p, "media")}
                    >
                      <ImagePlus className="size-3.5" />
                      <span className="hidden lg:inline">Editar foto</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Duplicar ${p.name}`}
                      title="Duplicar"
                      onClick={() => {
                        if (!confirmDiscard("Há alterações não salvas. Descartar e duplicar este produto?")) return;
                        const { id: _id, ...rest } = p;
                        const duplicate = {
                          ...rest,
                          name: `${p.name} (cópia)`,
                          slug: `${p.slug}-copia`,
                          sort_order: (p.sort_order ?? 99) + 1,
                        };
                        setForm(duplicate);
                        setInitialForm(empty);
                        setEditorOpen(true);
                        updateSearch({ tab: "catalogo", section: "geral" }, ["product"]);
                        scrollEditorIntoView();
                      }}
                    >
                      <Copy className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={!editable || remove.isPending}
                      aria-label={`Remover ${p.name}`}
                      title={editable ? "Remover produto" : "Produto externo (Shopify) não pode ser removido"}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remover ${p.name} do catálogo? O produto e seus dados deixarão de aparecer no painel.`,
                          )
                        ) {
                          remove.mutate(p.id);
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                );
              })}
            </div>

            <div ref={editorRef} className="hidden scroll-mt-24 md:block">
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
                  activeSection={activeSection}
                  focusRequest={mediaFocusRequest}
                  onSectionChange={changeSection}
                  onNew={openNewEditor}
                  onClose={closeEditor}
                />
              </form>
            </div>
          </div>
          {isMobile ? (
            <Sheet open={editorOpen} onOpenChange={(open) => (!open ? closeEditor() : setEditorOpen(true))}>
              <SheetContent className="flex h-[100dvh] w-full flex-col p-0">
                <SheetTitle className="sr-only">Editor de produto</SheetTitle>
                <SheetDescription className="sr-only">
                  Edite os dados do produto e salve as alterações.
                </SheetDescription>
                <form
                  className="min-h-0 flex-1 overflow-y-auto p-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    save.mutate(form);
                  }}
                >
                  <ProductEditor
                    form={form}
                    setForm={setForm}
                    saving={save.isPending}
                    activeSection={activeSection}
                    focusRequest={mediaFocusRequest}
                    onSectionChange={changeSection}
                    onNew={openNewEditor}
                    onClose={closeEditor}
                  />
                </form>
              </SheetContent>
            </Sheet>
          ) : null}
        </div>
      ) : null}

      {tab === "estoque" ? (
        <AdminStock
          products={products ?? []}
          loading={productsState.isPending}
          error={productsState.error}
          q={q}
          filter={filter}
          onSearchChange={(value) => updateSearch({ q: value })}
          onFilterChange={(value) => updateSearch({ filter: value })}
        />
      ) : null}

      {tab === "kits" ? <AdminKits /> : null}
      {tab === "avaliacoes" ? <AdminReviews /> : null}

      {tab === "configuracoes" && store ? (
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
      {tab === "clientes" ? (
        <AdminPlaceholder
          title="Clientes ainda não disponível"
          detail="Esta seção será conectada aos clientes reais dos pedidos em uma próxima fase."
        />
      ) : null}
      {tab === "cupons" ? (
        <AdminPlaceholder
          title="Cupons ainda não disponível"
          detail="Nenhum cupom é gerenciado por aqui ainda. Não há dados fictícios para mostrar."
        />
      ) : null}
      {tab === "midia" ? (
        <AdminMedia
          products={products ?? []}
          productsLoading={productsState.isPending}
          productsError={productsState.error}
        />
      ) : null}
      {tab === "auditoria" ? <AdminAudit products={products ?? []} /> : null}
    </AdminShell>
  );
}

function AdminPlaceholder({
  title,
  detail,
  actionLabel,
  onAction,
}: {
  title: string;
  detail: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="surface-card mt-8 p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{detail}</p>
      {actionLabel && onAction ? (
        <Button className="mt-4" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
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
