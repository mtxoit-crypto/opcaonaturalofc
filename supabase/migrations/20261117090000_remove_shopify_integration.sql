-- Retire the obsolete Shopify catalog and order synchronization surface.
DROP VIEW IF EXISTS public.products_public;
DROP VIEW IF EXISTS public.storefront_products;

CREATE VIEW public.products_public AS
 SELECT p.id, p.slug, p.name, p.subtitle, p.description, p.benefits, p.dosage,
    p.capsule_count, p.price, p.promo_price, p.image_url, p.model_url, p.stock,
    p.active, p.jar_color, p.lid_color, p.capsule_color, p.sort_order, p.sku,
    p.ean, p.ingredients, p.composition, p.nutrition_info, p.usage_instructions,
    p.warnings, p.seo_title, p.seo_description, p.is_featured, p.is_new,
    p.is_bestseller, p.category_id, p.brand_id, p.created_at, p.updated_at,
    c.name AS category_name, c.slug AS category_slug,
    b.name AS brand_name, b.slug AS brand_slug
   FROM public.products p
   LEFT JOIN public.categories c ON c.id = p.category_id
   LEFT JOIN public.brands b ON b.id = p.brand_id
  WHERE p.active = true;

CREATE VIEW public.storefront_products AS
 SELECT id, slug, name, subtitle, description, benefits, dosage, capsule_count,
    price, capsule_color, jar_color, lid_color, image_url, in_stock, is_active,
    sort_order, seo_title, seo_description
   FROM public.products
  WHERE COALESCE(is_active, active, true) = true;

GRANT SELECT ON public.products_public TO anon, authenticated, service_role;
GRANT SELECT ON public.storefront_products TO anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.inventory_consume_shopify_order(text, jsonb);
DROP FUNCTION IF EXISTS public.inventory_restore_shopify_order(text, jsonb);
DROP FUNCTION IF EXISTS public.shopify_upsert_order(jsonb, jsonb);

ALTER TABLE public.products
  DROP COLUMN IF EXISTS shopify_handle,
  DROP COLUMN IF EXISTS shopify_product_id,
  DROP COLUMN IF EXISTS shopify_variant_id,
  DROP COLUMN IF EXISTS shopify_sync_status;
