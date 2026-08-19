-- 1. Reviews: nascem pendentes de aprovação
ALTER TABLE public.product_reviews ALTER COLUMN is_approved SET DEFAULT false;

DROP POLICY IF EXISTS "anyone can submit reviews" ON public.product_reviews;
CREATE POLICY "anyone can submit pending reviews"
ON public.product_reviews FOR INSERT TO anon, authenticated
WITH CHECK (
  is_approved = false
  AND rating >= 1 AND rating <= 5
  AND length(author_name) >= 2 AND length(author_name) <= 60
  AND (comment IS NULL OR length(comment) <= 1000)
);

-- 2. Menor privilégio para anon: nenhuma escrita exceto avaliações
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM anon;
GRANT INSERT ON public.product_reviews TO anon;

-- authenticated não escreve em logs de auditoria
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.order_audit_log FROM authenticated;

-- 3. Funções: apenas as necessárias executáveis por anon
REVOKE ALL ON FUNCTION public.admin_add_member(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_remove_member(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_members() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_pix_key() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_add_member(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_remove_member(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_members() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_pix_key() TO authenticated;