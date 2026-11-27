import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminProductsQuery } from "@/lib/products";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

type ReviewRow = {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
};

function ReviewCard({
  review,
  productName,
  pending,
  busy,
  onApprove,
  onDelete,
}: {
  review: ReviewRow;
  productName: string;
  pending: boolean;
  busy: boolean;
  onApprove?: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="surface-card flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{productName}</p>
        <p className="font-medium">
          {review.author_name} · {review.rating}★
        </p>
        {review.comment ? <p className="text-sm text-muted-foreground">{review.comment}</p> : null}
        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(review.created_at).toLocaleString("pt-BR")}
        </p>
      </div>
      {pending && onApprove ? (
        <Button size="sm" className="min-h-11" disabled={busy} onClick={onApprove}>
          Aprovar
        </Button>
      ) : null}
      <Button size="sm" variant="outline" className="min-h-11" disabled={busy} onClick={onDelete}>
        {pending ? "Rejeitar" : "Excluir"}
      </Button>
    </article>
  );
}

export function AdminReviews() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const { data: products } = useQuery(adminProductsQuery(isAdmin));
  const names = Object.fromEntries((products ?? []).map((p) => [p.id, p.name]));

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async (): Promise<ReviewRow[]> => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("id,product_id,author_name,rating,comment,is_approved,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReviewRow[];
    },
  });

  const pending = data.filter((r) => !r.is_approved);
  const published = data.filter((r) => r.is_approved);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    qc.invalidateQueries({ queryKey: ["admin-reviews-count"] });
    qc.invalidateQueries({ queryKey: ["product-reviews"] });
    qc.invalidateQueries({ queryKey: ["home-reviews-approved"] });
  }

  const approve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("product_reviews")
        .update({ is_approved: true })
        .eq("id", id)
        .select("id")
        .single();
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Avaliação aprovada.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("product_reviews")
        .delete()
        .eq("id", id)
        .select("id")
        .single();
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Avaliação excluída.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const busy = approve.isPending || remove.isPending;

  function confirmDelete(review: ReviewRow) {
    const label = review.is_approved
      ? `Excluir a avaliação de ${review.author_name}? Ela some da loja.`
      : `Rejeitar e apagar a avaliação de ${review.author_name}?`;
    if (!window.confirm(label)) return;
    remove.mutate(review.id);
  }

  if (isError) {
    return (
      <section className="surface-card mt-8 space-y-3 p-5">
        <p role="alert">Não foi possível carregar as avaliações.</p>
        <Button variant="outline" onClick={() => void refetch()}>
          Tentar novamente
        </Button>
      </section>
    );
  }

  return (
    <section className="mt-8 space-y-10">
      <div>
        <h2 className="text-2xl">Avaliações pendentes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Aprovadas aparecem na página do produto e na home, se houver comentário.
        </p>
        <div className="mt-4 space-y-3">
          {isLoading ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : pending.length ? (
            pending.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                productName={names[r.product_id] ?? "Produto"}
                pending
                busy={busy}
                onApprove={() => approve.mutate(r.id)}
                onDelete={() => confirmDelete(r)}
              />
            ))
          ) : (
            <p className="text-muted-foreground">Nenhuma avaliação aguardando aprovação.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl">Avaliações publicadas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Excluir remove o comentário da loja. Essa ação não pode ser desfeita.
        </p>
        <div className="mt-4 space-y-3">
          {isLoading ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : published.length ? (
            published.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                productName={names[r.product_id] ?? "Produto"}
                pending={false}
                busy={busy}
                onDelete={() => confirmDelete(r)}
              />
            ))
          ) : (
            <p className="text-muted-foreground">Nenhuma avaliação publicada.</p>
          )}
        </div>
      </div>
    </section>
  );
}
