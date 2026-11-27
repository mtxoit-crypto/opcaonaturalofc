ALTER TABLE public.shipping_zones
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "public read shipping zones" ON public.shipping_zones;

CREATE POLICY "public read active shipping zones"
  ON public.shipping_zones
  FOR SELECT
  TO anon, authenticated
  USING (is_active);

CREATE POLICY "admins read all shipping zones"
  ON public.shipping_zones
  FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));