-- Pedidos só aparecem no painel depois do pagamento.
-- create_order grava rascunho com status aguardando_pagamento.
-- shopify_upsert_order ignora pedidos ainda não pagos.

CREATE OR REPLACE FUNCTION public.create_order(
  _customer_name text,
  _customer_phone text,
  _customer_email text,
  _zip_code text,
  _street text,
  _number text,
  _complement text,
  _district text,
  _city text,
  _state text,
  _notes text,
  _items jsonb
)
RETURNS TABLE (id uuid, code text, subtotal numeric, shipping_fee numeric, total numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid := gen_random_uuid();
  v_code text := 'OP-' || upper(substr(md5(random()::text), 1, 6));
  v_subtotal numeric := 0;
  v_shipping numeric := 0;
  v_settings public.store_settings%ROWTYPE;
  v_count int;
BEGIN
  IF coalesce(btrim(_customer_name), '') = '' OR coalesce(btrim(_customer_phone), '') = ''
     OR coalesce(btrim(_zip_code), '') = '' OR coalesce(btrim(_street), '') = ''
     OR coalesce(btrim(_number), '') = '' OR coalesce(btrim(_district), '') = ''
     OR coalesce(btrim(_city), '') = '' OR coalesce(btrim(_state), '') = '' THEN
    RAISE EXCEPTION 'Dados de entrega incompletos';
  END IF;

  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Carrinho vazio';
  END IF;
  IF jsonb_array_length(_items) > 50 THEN
    RAISE EXCEPTION 'Carrinho invalido';
  END IF;

  CREATE TEMP TABLE _cart ON COMMIT DROP AS
  SELECT (e->>'product_id')::uuid AS product_id,
         least(greatest((e->>'quantity')::int, 1), 99) AS quantity
  FROM jsonb_array_elements(_items) e;

  SELECT count(*) INTO v_count FROM _cart WHERE product_id IS NULL;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Produto invalido';
  END IF;

  SELECT count(*) INTO v_count
  FROM _cart c
  LEFT JOIN public.products p
    ON p.id = c.product_id AND p.is_active AND p.in_stock AND p.price IS NOT NULL
  WHERE p.id IS NULL;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Produto indisponivel';
  END IF;

  SELECT coalesce(sum(p.price * c.quantity), 0) INTO v_subtotal
  FROM _cart c JOIN public.products p ON p.id = c.product_id;

  SELECT * INTO v_settings FROM public.store_settings LIMIT 1;
  IF v_settings.id IS NULL THEN
    v_shipping := 0;
  ELSIF v_settings.free_shipping_min > 0 AND v_subtotal >= v_settings.free_shipping_min THEN
    v_shipping := 0;
  ELSE
    v_shipping := coalesce(v_settings.shipping_fee, 0);
  END IF;

  INSERT INTO public.orders (
    id, code, customer_name, customer_phone, customer_email, zip_code, street, number,
    complement, district, city, state, notes, payment_method, subtotal, shipping_fee, total,
    status, payment_status, source
  ) VALUES (
    v_order_id, v_code, left(btrim(_customer_name), 120), left(btrim(_customer_phone), 30),
    nullif(left(btrim(coalesce(_customer_email, '')), 160), ''), left(btrim(_zip_code), 12),
    left(btrim(_street), 160), left(btrim(_number), 20),
    nullif(left(btrim(coalesce(_complement, '')), 120), ''), left(btrim(_district), 120),
    left(btrim(_city), 120), left(btrim(_state), 2), nullif(left(btrim(coalesce(_notes, '')), 500), ''),
    'pix', v_subtotal, v_shipping, v_subtotal + v_shipping,
    'aguardando_pagamento', 'unpaid', 'site'
  );

  INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, quantity)
  SELECT v_order_id, p.id, p.name, p.price, c.quantity
  FROM _cart c JOIN public.products p ON p.id = c.product_id;

  RETURN QUERY SELECT v_order_id, v_code, v_subtotal, v_shipping, v_subtotal + v_shipping;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order(text,text,text,text,text,text,text,text,text,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order(text,text,text,text,text,text,text,text,text,text,text,jsonb) TO anon, authenticated;
