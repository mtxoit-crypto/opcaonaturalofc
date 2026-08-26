DO $$
DECLARE
  invalid_count bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'product_media_media_type_check'
      AND conrelid = 'public.product_media'::regclass
  ) THEN
    SELECT count(*) INTO invalid_count
    FROM public.product_media
    WHERE media_type NOT IN ('image', 'video', 'model');

    BEGIN
      ALTER TABLE public.product_media
        ADD CONSTRAINT product_media_media_type_check
        CHECK (media_type IN ('image', 'video', 'model'));
    EXCEPTION WHEN check_violation THEN
      RAISE WARNING
        'product_media_media_type_check was not added: % existing row(s) have an invalid media_type',
        invalid_count;
    END;
  END IF;
END
$$;

DROP POLICY IF EXISTS "admins insert product media" ON public.product_media;
DROP POLICY IF EXISTS "admins update product media" ON public.product_media;
DROP POLICY IF EXISTS "admins delete product media" ON public.product_media;

CREATE POLICY "admins insert product media"
  ON public.product_media
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins update product media"
  ON public.product_media
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins delete product media"
  ON public.product_media
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "admins update produtos-midia" ON storage.objects;
CREATE POLICY "admins update produtos-midia"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'produtos-midia'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    bucket_id = 'produtos-midia'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- Covers are persisted as getPublicUrl() values. Keep using the existing public
-- bucket instead of changing bucket visibility or rewriting stored URLs here.
DO $$
DECLARE
  bucket_is_public boolean;
BEGIN
  SELECT b.public INTO bucket_is_public
  FROM storage.buckets AS b
  WHERE b.id = 'produtos-midia';

  IF bucket_is_public IS NULL THEN
    RAISE WARNING 'Storage bucket produtos-midia was not found; public cover URLs will not resolve';
  ELSIF NOT bucket_is_public THEN
    RAISE WARNING 'Storage bucket produtos-midia is private; public cover URL persistence requires a public bucket';
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('products', 'product_media')),
  entity_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('insert', 'update', 'delete', 'stock_update')),
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_audit_log FROM anon, authenticated;
GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

DROP POLICY IF EXISTS "admins read audit log" ON public.admin_audit_log;
DROP POLICY IF EXISTS "admins insert audit log" ON public.admin_audit_log;
CREATE POLICY "admins read audit log"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admins insert audit log"
  ON public.admin_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    AND actor_id = auth.uid()
  );

CREATE OR REPLACE FUNCTION private.log_catalog_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, private
AS $$
DECLARE
  changed_action text := lower(TG_OP);
  old_json jsonb := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END;
  new_json jsonb := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END;
BEGIN
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'products'
    AND (old_json ->> 'in_stock') IS DISTINCT FROM (new_json ->> 'in_stock') THEN
    changed_action := 'stock_update';
  END IF;

  INSERT INTO public.admin_audit_log (actor_id, entity_type, entity_id, action, before_data, after_data)
  VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE((new_json ->> 'id')::uuid, (old_json ->> 'id')::uuid),
    changed_action,
    old_json,
    new_json
  );
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.log_catalog_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.log_catalog_change() TO authenticated, service_role;

DROP TRIGGER IF EXISTS products_catalog_audit ON public.products;
CREATE TRIGGER products_catalog_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION private.log_catalog_change();

DROP TRIGGER IF EXISTS product_media_catalog_audit ON public.product_media;
CREATE TRIGGER product_media_catalog_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.product_media
  FOR EACH ROW
  EXECUTE FUNCTION private.log_catalog_change();
