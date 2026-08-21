import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { productsQuery } from "@/lib/products";
import { Button } from "@/components/ui/button";

type PendingReview = {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
};

export function AdminReviews() {
  const qc = useQueryClient();
  const { data: products } = useQuery(productsQuery);
  const names = Object.fromEntries((products ?? []).map((p) => [p.id, p.name]));

  const { data } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async (): Promise<PendingReview[]> => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("id,product_id,author_name,rating,comment,is_approved,created_at")
        .eq("is_approved", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PendingReview[];
    },
  });

  const act = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { error } = approve
        ? await supabase.from("product_reviews").update({ is_approved: true }).eq("id", id)
        : await supabase.from("product_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["product-reviews"] });
      toast.success("Avaliação atualizada.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mt-8">
      <h2 className="text-2xl">Avaliações pendentes</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Aprovadas aparecem na página do produto. Rejeitar apaga o comentário.
      </p>
      <div className="mt-4 space-y-3">
        {data?.length ? (
          data.map((r) => (
            <article key={r.id} className="surface-card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {names[r.product_id] ?? "Produto"}
                </p>
                <p className="font-medium">
                  {r.author_name} · {r.rating}★
                </p>
                {r.comment ? <p className="text-sm text-muted-foreground">{r.comment}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <Button size="sm" disabled={act.isPending} onClick={() => act.mutate({ id: r.id, approve: true })}>
                Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={act.isPending}
                onClick={() => act.mutate({ id: r.id, approve: false })}
              >
                Rejeitar
              </Button>
            </article>
          ))
        ) : (
          <p className="text-muted-foreground">Nenhuma avaliação aguardando aprovação.</p>
        )}
      </div>
    </section>
  );
}
