CREATE OR REPLACE FUNCTION private.log_catalog_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, private
AS $fn$
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
$fn$;

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