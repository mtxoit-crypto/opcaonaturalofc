-- Stripe webhooks are the only path that creates paid website orders.
-- Inventory and idempotency are enforced inside one database transaction.
CREATE OR REPLACE FUNCTION private.record_stripe_checkout_order(
  _stripe_session_id text,
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
  _items jsonb,
  _amount_total_cents integer
)
RETURNS TABLE(id uuid, code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing public.orders%ROWTYPE;
  v_order_id uuid := gen_random_uuid();
  v_code text := 'OP-' || upper(substr(md5(random()::text), 1, 6));
  v_subtotal_cents integer;
  v_shipping_cents integer;
  v_cep integer;
  v_settings public.store_settings%ROWTYPE;
  v_zone public.shipping_zones%ROWTYPE;
  v_invalid_count integer;
BEGIN
  IF coalesce(btrim(_stripe_session_id), '') = '' OR _stripe_session_id !~ '^cs_(test|live)_[A-Za-z0-9]+$' THEN
    RAISE EXCEPTION 'Sessão Stripe inválida';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(_stripe_session_id, 0));

  SELECT * INTO v_existing
  FROM public.orders
  WHERE external_order_id = _stripe_session_id
  LIMIT 1;
  IF v_existing.id IS NOT NULL THEN
    RETURN QUERY SELECT v_existing.id, v_existing.code;
    RETURN;
  END IF;

  IF coalesce(btrim(_customer_name), '') = '' OR coalesce(btrim(_customer_phone), '') = ''
    OR coalesce(btrim(_zip_code), '') !~ '^\d{8}$'
    OR coalesce(btrim(_street), '') = '' OR coalesce(btrim(_number), '') = ''
    OR coalesce(btrim(_district), '') = '' OR coalesce(btrim(_city), '') = ''
    OR coalesce(btrim(_state), '') = '' THEN
    RAISE EXCEPTION 'Dados de entrega incompletos';
  END IF;
  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0
    OR jsonb_array_length(_items) > 10 THEN
    RAISE EXCEPTION 'Carrinho inválido';
  END IF;

  CREATE TEMP TABLE _stripe_cart ON COMMIT DROP AS
  SELECT (entry->>'product_id')::uuid AS product_id,
         sum((entry->>'quantity')::integer)::integer AS quantity
  FROM jsonb_array_elements(_items) AS entry
  GROUP BY (entry->>'product_id')::uuid;

  SELECT count(*) INTO v_invalid_count
  FROM _stripe_cart
  WHERE product_id IS NULL OR quantity < 1 OR quantity > 99;
  IF v_invalid_count > 0 THEN
    RAISE EXCEPTION 'Carrinho inválido';
  END IF;

  PERFORM p.id
  FROM public.products AS p
  JOIN _stripe_cart AS c ON c.product_id = p.id
  ORDER BY p.id
  FOR UPDATE OF p;

  SELECT count(*) INTO v_invalid_count
  FROM _stripe_cart AS c
  LEFT JOIN public.products AS p ON p.id = c.product_id
  WHERE p.id IS NULL OR NOT p.is_active OR p.price IS NULL OR p.price <= 0
    OR p.stock_quantity IS NULL OR p.stock_quantity < c.quantity;
  IF v_invalid_count > 0 THEN
    RAISE EXCEPTION 'Produto sem estoque suficiente';
  END IF;

  SELECT coalesce(sum(round(p.price * 100)::integer * c.quantity), 0)::integer
    INTO v_subtotal_cents
  FROM _stripe_cart AS c
  JOIN public.products AS p ON p.id = c.product_id;

  v_cep := btrim(_zip_code)::integer;
  SELECT * INTO v_zone
  FROM public.shipping_zones
  WHERE v_cep BETWEEN cep_start AND cep_end
  ORDER BY sort_order
  LIMIT 1;
  IF v_zone.id IS NULL THEN
    RAISE EXCEPTION 'CEP sem faixa de entrega';
  END IF;

  SELECT * INTO v_settings FROM public.store_settings LIMIT 1;
  v_shipping_cents := CASE
    WHEN v_settings.id IS NOT NULL AND v_settings.free_shipping_min > 0
      AND v_subtotal_cents >= round(v_settings.free_shipping_min * 100)::integer THEN 0
    ELSE round(v_zone.fee * 100)::integer
  END;

  IF _amount_total_cents IS NULL OR _amount_total_cents <> v_subtotal_cents + v_shipping_cents THEN
    RAISE EXCEPTION 'Total pago não confere com o pedido';
  END IF;

  INSERT INTO public.orders (
    id, code, customer_name, customer_phone, customer_email, zip_code, street, number,
    complement, district, city, state, payment_method, subtotal, shipping_fee, total,
    status, source, external_order_id, payment_status, fulfillment_status, financial_status, currency
  ) VALUES (
    v_order_id, v_code, left(btrim(_customer_name), 120), left(btrim(_customer_phone), 30),
    nullif(left(btrim(coalesce(_customer_email, '')), 160), ''), btrim(_zip_code),
    left(btrim(_street), 160), left(btrim(_number), 20),
    nullif(left(btrim(coalesce(_complement, '')), 120), ''), left(btrim(_district), 120),
    left(btrim(_city), 120), left(btrim(_state), 120), 'stripe',
    v_subtotal_cents / 100.0, v_shipping_cents / 100.0, _amount_total_cents / 100.0,
    'novo', 'site', _stripe_session_id, 'paid', 'unfulfilled', 'paid', 'BRL'
  );

  INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, quantity)
  SELECT v_order_id, p.id, p.name, p.price, c.quantity
  FROM _stripe_cart AS c
  JOIN public.products AS p ON p.id = c.product_id;

  UPDATE public.products AS p
  SET stock_quantity = p.stock_quantity - c.quantity
  FROM _stripe_cart AS c
  WHERE p.id = c.product_id;

  RETURN QUERY SELECT v_order_id, v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_stripe_checkout_order(
  _stripe_session_id text,
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
  _items jsonb,
  _amount_total_cents integer
)
RETURNS TABLE(id uuid, code text)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT * FROM private.record_stripe_checkout_order(
    _stripe_session_id, _customer_name, _customer_phone, _customer_email, _zip_code,
    _street, _number, _complement, _district, _city, _state, _items, _amount_total_cents
  );
$$;

REVOKE ALL ON FUNCTION private.record_stripe_checkout_order(text,text,text,text,text,text,text,text,text,text,text,jsonb,integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_stripe_checkout_order(text,text,text,text,text,text,text,text,text,text,text,jsonb,integer) FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT EXECUTE ON FUNCTION private.record_stripe_checkout_order(text,text,text,text,text,text,text,text,text,text,text,jsonb,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_stripe_checkout_order(text,text,text,text,text,text,text,text,text,text,text,jsonb,integer) TO service_role;
