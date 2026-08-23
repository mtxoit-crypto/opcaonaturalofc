REVOKE SELECT ON public.store_settings FROM anon, authenticated;
GRANT SELECT (id, whatsapp_number, shipping_fee, free_shipping_min, created_at, updated_at) ON public.store_settings TO anon, authenticated;
GRANT ALL ON public.store_settings TO service_role;