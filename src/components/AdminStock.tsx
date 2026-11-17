import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Boxes, ExternalLink, Minus, Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  hasNumericInventory,
  isLowStock,
  productInventoryQuery,
  type ProductInventory,
} from "@/lib/inventory";
import { isDatabaseProductId } from "@/lib/media";
import { productPhoto, type Product } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export type StockFilter = "todos" | "ativos" | "ocultos" | "sem-estoque" | "em-estoque";
type InventoryField = "stock_quantity" | "low_stock_threshold";
type InventoryDraft = { quantity: string; threshold: string };
const EMPTY_INVENTORY: ProductInventory[] = [];

export function AdminStock({
  products,
  loading = false,
  error,
  q,
  filter,
  onSearchChange,
  onFilterChange,
}: {
  products: Product[];
  loading?: boolean;
  error?: unknown;
  q: string;
  filter: StockFilter;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: StockFilter) => void;
}) {
  const queryClient = useQueryClient();
  const inventoryQuery = useQuery(productInventoryQuery());
  const inventoryRows = inventoryQuery.data ?? EMPTY_INVENTORY;
  const inventoryById = useMemo(
    () => new Map(inventoryRows.map((row) => [row.id, row])),
    [inventoryRows],
  );
  const [drafts, setDrafts] = useState<Record<string, InventoryDraft>>({});

  useEffect(() => {
    const next: Record<string, InventoryDraft> = {};
    for (const row of inventoryRows) {
      next[row.id] = {
        quantity: row.stock_quantity === null ? "" : String(row.stock_quantity),
        threshold: row.low_stock_threshold === null ? "" : String(row.low_stock_threshold),
      };
    }
    setDrafts(next);
  }, [inventoryRows]);

  const updateStock = useMutation({
    mutationFn: async ({ id, inStock }: { id: string; inStock: boolean }) => {
      if (!isDatabaseProductId(id)) {
        throw new Error("Este produto não tem registro editável no catálogo local.");
      }
      const { error: updateError } = await supabase
        .from("products")
        .update({ in_stock: inStock })
        .eq("id", id);
      if (updateError) throw updateError;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.inStock ? "Produto marcado em estoque" : "Produto marcado sem estoque");
      queryClient.setQueryData<Product[]>(["admin-products"], (current) =>
        current?.map((product) =>
          product.id === variables.id ? { ...product, in_stock: variables.inStock } : product,
        ),
      );
      void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });
  const updateInventory = useMutation({
    mutationFn: async ({
      id,
      field,
      value,
    }: {
      id: string;
      field: InventoryField;
      value: number | null;
    }) => {
      const payload =
        field === "stock_quantity"
          ? { stock_quantity: value }
          : { low_stock_threshold: value };
      const { error: updateError } = await supabase.from("products").update(payload).eq("id", id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success("Estoque atualizado");
      void queryClient.invalidateQueries({ queryKey: ["product-inventory"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.filter((product) => {
      if (filter === "em-estoque" && !product.in_stock) return false;
      if (filter === "sem-estoque" && product.in_stock) return false;
      if (filter === "ativos" && !product.is_active) return false;
      if (filter === "ocultos" && product.is_active) return false;
      if (!term) return true;
      return [product.name, product.slug, product.subtitle].some((value) =>
        value?.toLowerCase().includes(term),
      );
    });
  }, [filter, products, q]);

  function saveInventoryField(id: string, field: InventoryField, rawValue: string) {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      updateInventory.mutate({ id, field, value: null });
      return;
    }
    const value = Number(trimmed);
    if (!Number.isInteger(value) || value < 0) {
      toast.error("Informe um número inteiro igual ou maior que zero.");
      return;
    }
    updateInventory.mutate({ id, field, value });
  }

  function adjustQuantity(row: ProductInventory | undefined, delta: number) {
    if (!row || row.stock_quantity === null) {
      toast.error("Defina uma quantidade antes de usar o ajuste rápido.");
      return;
    }
    updateInventory.mutate({
      id: row.id,
      field: "stock_quantity",
      value: Math.max(0, row.stock_quantity + delta),
    });
  }

  if (loading) {
    return <p className="mt-5 text-sm text-muted-foreground">Carregando produtos…</p>;
  }

  if (error) {
    return (
      <div className="surface-card mt-5 p-5">
        <p className="font-medium">Não foi possível carregar o estoque.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Tente novamente em alguns instantes."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <div className="surface-card flex flex-wrap items-start gap-3 p-4">
        <Boxes className="mt-0.5 size-5 shrink-0 text-accent" />
        <div className="min-w-0">
          <p className="font-medium">Disponibilidade atual</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {inventoryQuery.isError
              ? "A quantidade numérica de estoque ainda não está disponível neste ambiente; as compras online ficam bloqueadas até corrigir o cadastro. "
              : "A quantidade numérica abaixo controla a disponibilidade para compra online. "}
            <code>in_stock</code> é preservado por compatibilidade e não substitui o estoque numérico no checkout.
          </p>
          {inventoryQuery.isError ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Aplique a migração de inventário para habilitar os campos numéricos.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome ou slug"
            value={q}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filter}
          onChange={(event) => onFilterChange(event.target.value as StockFilter)}
        >
          <option value="todos">Todos</option>
          <option value="em-estoque">Em estoque</option>
          <option value="sem-estoque">Sem estoque</option>
          <option value="ativos">Visíveis</option>
          <option value="ocultos">Ocultos</option>
        </select>
      </div>

      <div className="mt-5 space-y-2">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum produto nesse filtro.</p>
        ) : null}
        {visible.map((product) => {
          const editable = isDatabaseProductId(product.id);
          const photo = productPhoto(product);
          const inventory = inventoryById.get(product.id);
          const numericInventory = inventory && hasNumericInventory(inventory) ? inventory : undefined;
          const draft = drafts[product.id] ?? { quantity: "", threshold: "" };
          return (
            <div
              key={product.id}
              className="surface-card flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap"
            >
              {photo ? (
                <img
                  src={photo}
                  alt=""
                  className="size-12 shrink-0 rounded-md bg-sand object-contain"
                />
              ) : (
                <div
                  className="size-12 shrink-0 rounded-md"
                  style={{ background: `linear-gradient(160deg, ${product.jar_color}, ${product.lid_color})` }}
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{product.name}</p>
                <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="rounded-full bg-secondary px-2 py-0.5">
                    {product.is_active ? "Visível" : "Oculto"}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      product.in_stock ? "bg-secondary" : "bg-clay/15 text-clay"
                    }`}
                  >
                    {product.in_stock ? "Em estoque" : "Sem estoque"}
                  </span>
                  {numericInventory ? (
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        isLowStock(numericInventory) ? "bg-clay/15 text-clay" : "bg-secondary"
                      }`}
                    >
                      {isLowStock(numericInventory) ? "Estoque baixo" : "Quantidade normal"}
                    </span>
                  ) : null}
                  {!editable ? (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
                      Disponibilidade externa
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <div className="flex items-end gap-2">
                  <label className="space-y-1">
                    <span className="block text-[11px] text-muted-foreground">Quantidade</span>
                    <Input
                      className="h-9 w-20"
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={draft.quantity}
                      disabled={!editable || !inventoryQuery.isSuccess || updateInventory.isPending}
                      aria-label={`Quantidade de ${product.name}`}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [product.id]: { ...draft, quantity: event.target.value },
                        }))
                      }
                      onBlur={(event) => saveInventoryField(product.id, "stock_quantity", event.target.value)}
                    />
                  </label>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-9"
                    disabled={!editable || !numericInventory || updateInventory.isPending}
                    aria-label={`Diminuir estoque de ${product.name}`}
                    onClick={() => adjustQuantity(inventory, -1)}
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-9"
                    disabled={!editable || !numericInventory || updateInventory.isPending}
                    aria-label={`Aumentar estoque de ${product.name}`}
                    onClick={() => adjustQuantity(inventory, 1)}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                  <label className="space-y-1">
                    <span className="block text-[11px] text-muted-foreground">Limite baixo</span>
                    <Input
                      className="h-9 w-20"
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={draft.threshold}
                      disabled={!editable || !inventoryQuery.isSuccess || updateInventory.isPending}
                      aria-label={`Limite de estoque baixo de ${product.name}`}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [product.id]: { ...draft, threshold: event.target.value },
                        }))
                      }
                      onBlur={(event) =>
                        saveInventoryField(product.id, "low_stock_threshold", event.target.value)
                      }
                    />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{product.in_stock ? "Disponível" : "Esgotado"}</span>
                  <Switch
                    checked={product.in_stock}
                    disabled={!editable || updateStock.isPending}
                    aria-label={`Marcar ${product.name} como ${
                      product.in_stock ? "sem estoque" : "em estoque"
                    }`}
                    onCheckedChange={(inStock) => updateStock.mutate({ id: product.id, inStock })}
                  />
                </label>
                {editable ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      to="/admin"
                      search={{ tab: "catalogo", product: product.id, section: "loja" }}
                    >
                      Editar loja
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/produtos/$slug" params={{ slug: product.slug }} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-3.5" />
                      Ver site
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
