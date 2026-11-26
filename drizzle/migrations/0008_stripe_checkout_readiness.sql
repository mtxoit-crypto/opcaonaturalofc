-- Columns consumed by record_stripe_checkout_order, including legacy installations.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS external_order_id text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS fulfillment_status text,
  ADD COLUMN IF NOT EXISTS currency text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_checkout_session_unique
  ON public.orders (external_order_id) WHERE payment_method = 'stripe';
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.stripe_checkout_ready()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT COALESCE(pg_catalog.has_function_privilege(current_user,
    pg_catalog.to_regprocedure('public.record_stripe_checkout_order(text,text,text,text,text,text,text,text,text,text,text,jsonb,integer)'), 'EXECUTE'), false)
    AND COALESCE(pg_catalog.has_function_privilege(current_user,
    pg_catalog.to_regprocedure('private.record_stripe_checkout_order(text,text,text,text,text,text,text,text,text,text,text,jsonb,integer)'), 'EXECUTE'), false)
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.stripe_checkout_ready() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.stripe_checkout_ready() TO service_role;
