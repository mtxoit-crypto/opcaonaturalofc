ALTER POLICY "public read store settings" ON public.store_settings TO anon, authenticated USING (id = true);
REVOKE SELECT ON public.store_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, whatsapp_number, shipping_fee, free_shipping_min, created_at, updated_at) ON public.store_settings TO anon, authenticated;
COMMENT ON POLICY "public read store settings" ON public.store_settings IS 'Public storefront reads only the singleton store configuration; column grants exclude pix_key, which remains accessible through the admin-only RPC.';