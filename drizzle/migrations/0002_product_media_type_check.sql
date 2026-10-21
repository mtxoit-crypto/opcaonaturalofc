ALTER TABLE public.product_media
  ADD CONSTRAINT product_media_media_type_check
  CHECK (media_type IN ('image', 'video', 'model'));