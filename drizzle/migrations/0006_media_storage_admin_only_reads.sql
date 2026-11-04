DROP POLICY IF EXISTS "public read produtos-midia" ON storage.objects;
CREATE POLICY "admins read produtos-midia" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'produtos-midia' AND private.has_role(auth.uid(), 'admin'::app_role));