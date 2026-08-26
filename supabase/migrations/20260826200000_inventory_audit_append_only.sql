ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_quantity integer,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer;

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE
  invalid_stock_count bigint;
  invalid_threshold_count bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_stock_quantity_nonnegative'
      AND conrelid = 'public.products'::regclass
  ) THEN
    SELECT count(*) INTO invalid_stock_count
    FROM public.products
    WHERE stock_quantity IS NOT NULL AND stock_quantity < 0;

    BEGIN
      ALTER TABLE public.products
        ADD CONSTRAINT products_stock_quantity_nonnegative
        CHECK (stock_quantity IS NULL OR stock_quantity >= 0);
    EXCEPTION WHEN check_violation THEN
      RAISE WARNING
        'products_stock_quantity_nonnegative was not added: % existing row(s) have invalid stock_quantity',
        invalid_stock_count;
    END;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_low_stock_threshold_nonnegative'
      AND conrelid = 'public.products'::regclass
  ) THEN
    SELECT count(*) INTO invalid_threshold_count
    FROM public.products
    WHERE low_stock_threshold IS NOT NULL AND low_stock_threshold < 0;

    BEGIN
      ALTER TABLE public.products
        ADD CONSTRAINT products_low_stock_threshold_nonnegative
        CHECK (low_stock_threshold IS NULL OR low_stock_threshold >= 0);
    EXCEPTION WHEN check_violation THEN
      RAISE WARNING
        'products_low_stock_threshold_nonnegative was not added: % existing row(s) have invalid low_stock_threshold',
        invalid_threshold_count;
    END;
  END IF;
END
$$;

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
    AND (
      (old_json ->> 'in_stock') IS DISTINCT FROM (new_json ->> 'in_stock')
      OR (old_json ->> 'stock_quantity') IS DISTINCT FROM (new_json ->> 'stock_quantity')
      OR (old_json ->> 'low_stock_threshold') IS DISTINCT FROM (new_json ->> 'low_stock_threshold')
    ) THEN
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

DROP POLICY IF EXISTS "admins update product inventory" ON public.products;
CREATE POLICY "admins update product inventory"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DO $$
DECLARE
  invalid_entity_count bigint;
  invalid_action_count bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'admin_audit_log_entity_type_check'
      AND conrelid = 'public.admin_audit_log'::regclass
  ) THEN
    SELECT count(*) INTO invalid_entity_count
    FROM public.admin_audit_log
    WHERE entity_type NOT IN ('products', 'product_media');

    BEGIN
      ALTER TABLE public.admin_audit_log
        ADD CONSTRAINT admin_audit_log_entity_type_check
        CHECK (entity_type IN ('products', 'product_media'));
    EXCEPTION WHEN check_violation THEN
      RAISE WARNING
        'admin_audit_log_entity_type_check was not added: % existing row(s) have an invalid entity_type',
        invalid_entity_count;
    END;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'admin_audit_log_action_check'
      AND conrelid = 'public.admin_audit_log'::regclass
  ) THEN
    SELECT count(*) INTO invalid_action_count
    FROM public.admin_audit_log
    WHERE action NOT IN ('insert', 'update', 'delete', 'stock_update');

    BEGIN
      ALTER TABLE public.admin_audit_log
        ADD CONSTRAINT admin_audit_log_action_check
        CHECK (action IN ('insert', 'update', 'delete', 'stock_update'));
    EXCEPTION WHEN check_violation THEN
      RAISE WARNING
        'admin_audit_log_action_check was not added: % existing row(s) have an invalid action',
        invalid_action_count;
    END;
  END IF;
END
$$;

DROP POLICY IF EXISTS "admins update audit log" ON public.admin_audit_log;
DROP POLICY IF EXISTS "admins delete audit log" ON public.admin_audit_log;
REVOKE UPDATE, DELETE, TRUNCATE ON public.admin_audit_log FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT SELECT, INSERT ON public.admin_audit_log TO service_role;
