import { supabase } from "@/integrations/supabase/client";

export type Review = {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
};

export const reviewsQuery = (productId: string | undefined) => ({
  queryKey: ["product-reviews", productId],
  enabled: Boolean(productId),
  queryFn: async (): Promise<Review[]> => {
    if (!productId) return [];
    const { data, error } = await supabase
      .from("product_reviews")
      .select("id,product_id,author_name,rating,comment,is_approved,created_at")
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Review[];
  },
});

export async function submitReview(input: {
  product_id: string;
  author_name: string;
  rating: number;
  comment: string;
}) {
  const { error } = await supabase.from("product_reviews").insert({
    product_id: input.product_id,
    author_name: input.author_name.trim(),
    rating: input.rating,
    comment: input.comment.trim() || null,
  });
  if (error) throw error;
}

export function averageRating(reviews: Review[] | undefined) {
  if (!reviews?.length) return null;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

export type HomeReview = Review & { product_name: string; product_slug: string };

export const approvedHomeReviewsQuery = {
  queryKey: ["home-reviews-approved"],
  queryFn: async (): Promise<HomeReview[]> => {
    const { data, error } = await supabase
      .from("product_reviews")
      .select("id,product_id,author_name,rating,comment,is_approved,created_at,products(name,slug)")
      .eq("is_approved", true)
      .not("comment", "is", null)
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) return [];
    return (data ?? [])
      .map((row) => {
        const product = row.products as { name?: string; slug?: string } | { name?: string; slug?: string }[] | null;
        const p = Array.isArray(product) ? product[0] : product;
        if (!p?.name || !p.slug || !row.comment?.trim()) return null;
        return {
          id: row.id as string,
          product_id: row.product_id as string,
          author_name: row.author_name as string,
          rating: row.rating as number,
          comment: row.comment as string,
          is_approved: true,
          created_at: row.created_at as string,
          product_name: p.name,
          product_slug: p.slug,
        };
      })
      .filter((r): r is HomeReview => r != null);
  },
};
