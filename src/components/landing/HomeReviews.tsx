import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { approvedHomeReviewsQuery, averageRating } from "@/lib/reviews";

export function HomeReviews() {
  const { data } = useQuery(approvedHomeReviewsQuery);
  if (!data?.length) return null;
  const avg = averageRating(data);

  return (
    <section className="border-y border-border bg-sand">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-display text-3xl">Avaliações</h2>
        {avg != null ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Média {avg.toFixed(1)} de 5 · {data.length} {data.length === 1 ? "avaliação" : "avaliações"}{" "}
            publicadas
          </p>
        ) : null}
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {data.slice(0, 4).map((r) => (
            <li key={r.id} className="surface-card p-5">
              <div className="flex items-center gap-1" aria-label={`${r.rating} de 5`}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={i <= r.rating ? "size-4 fill-accent text-accent" : "size-4 text-muted-foreground/40"}
                  />
                ))}
              </div>
              <p className="mt-3 text-sm">{r.comment}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {r.author_name} ·{" "}
                <Link
                  to="/produtos/$slug"
                  params={{ slug: r.product_slug }}
                  className="underline-offset-4 hover:underline"
                >
                  {r.product_name}
                </Link>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
