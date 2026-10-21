import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { Product } from "@/lib/products";

type AuditRow = Tables<"admin_audit_log">;

export function AdminAudit({ products }: { products: Product[] }) {
  const { data, error, isLoading } = useQuery({
    queryKey: ["admin-audit-log"],
    queryFn: async (): Promise<AuditRow[]> => {
      const { data: rows, error: queryError } = await supabase
        .from("admin_audit_log")
        .select("id,actor_id,entity_type,entity_id,action,before_data,after_data,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (queryError) throw queryError;
      return rows ?? [];
    },
  });
  const names = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products],
  );

  if (isLoading) {
    return <p className="mt-8 text-sm text-muted-foreground">Carregando histórico…</p>;
  }

  if (error) {
    return (
      <div className="surface-card mt-8 p-5">
        <h2 className="font-medium">Não foi possível carregar a auditoria.</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Tente novamente em alguns instantes."}
        </p>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="surface-card mt-8 p-6">
        <h2 className="text-lg font-semibold">Nenhum evento registrado</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Alterações administrativas reais aparecerão aqui quando ocorrerem.
        </p>
      </div>
    );
  }

  return (
    <section className="mt-8">
      <div className="mb-3">
        <h2 className="text-lg font-semibold tracking-tight">Histórico administrativo</h2>
        <p className="mt-1 text-sm text-muted-foreground">Mostrando os 100 eventos mais recentes.</p>
      </div>
      <div className="space-y-2">
        {data.map((row) => (
          <AuditCard
            key={row.id}
            row={row}
            {...(names.get(row.entity_id) ? { productName: names.get(row.entity_id) } : {})}
          />
        ))}
      </div>
    </section>
  );
}

function AuditCard({ row, productName }: { row: AuditRow; productName?: string | undefined }) {
  const entityLabel = productName ?? `${row.entity_type} · ${row.entity_id.slice(0, 8)}`;
  return (
    <article className="surface-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{actionLabel(row.action)}</p>
          <p className="mt-1 truncate text-sm text-muted-foreground">{entityLabel}</p>
        </div>
        <time className="shrink-0 text-xs text-muted-foreground" dateTime={row.created_at}>
          {new Date(row.created_at).toLocaleString("pt-BR")}
        </time>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Ator: {row.actor_id ?? "não identificado"} · Entidade: {row.entity_type}
      </p>
      {row.before_data !== null || row.after_data !== null ? (
        <details className="mt-3 rounded-lg bg-sand/60 px-3 py-2">
          <summary className="cursor-pointer text-xs font-medium">Ver dados da alteração</summary>
          <div className="mt-2 grid gap-2 text-[11px] sm:grid-cols-2">
            {row.before_data !== null ? (
              <AuditData label="Antes" value={row.before_data} />
            ) : null}
            {row.after_data !== null ? (
              <AuditData label="Depois" value={row.after_data} />
            ) : null}
          </div>
        </details>
      ) : null}
    </article>
  );
}

function AuditData({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="font-medium text-muted-foreground">{label}</p>
      <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function actionLabel(action: string) {
  switch (action) {
    case "insert":
      return "Criado";
    case "update":
      return "Atualizado";
    case "delete":
      return "Removido";
    case "stock_update":
      return "Estoque atualizado";
    default:
      return action;
  }
}
