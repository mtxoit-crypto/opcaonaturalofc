ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_quantity integer,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer;

ALTER TABLE public.products
  ADD CONSTRAINT products_stock_quantity_nonnegative
  CHECK (stock_quantity IS NULL OR stock_quantity >= 0);

ALTER TABLE public.products
  ADD CONSTRAINT products_low_stock_threshold_nonnegative
  CHECK (low_stock_threshold IS NULL OR low_stock_threshold >= 0);