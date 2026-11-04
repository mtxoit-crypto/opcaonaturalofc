DROP POLICY IF EXISTS "public read kit items" ON public.kit_items;
CREATE POLICY "public read kit items" ON public.kit_items FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.kits k WHERE k.id = kit_items.kit_id AND (k.is_active OR private.has_role(auth.uid(), 'admin'::app_role))));

DROP POLICY IF EXISTS "public read produtos-midia" ON storage.objects;
CREATE POLICY "public read produtos-midia" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'produtos-midia' AND (
  EXISTS (SELECT 1 FROM public.product_media pm WHERE pm.storage_path = storage.objects.name)
  OR private.has_role(auth.uid(), 'admin'::app_role)
));