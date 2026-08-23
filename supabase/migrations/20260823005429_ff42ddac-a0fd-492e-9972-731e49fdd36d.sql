CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

ALTER FUNCTION public.create_order(text,text,text,text,text,text,text,text,text,text,text,jsonb) SET SCHEMA private;
ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION public.admin_add_member(text) SET SCHEMA private;
ALTER FUNCTION public.admin_get_pix_key() SET SCHEMA private;
ALTER FUNCTION public.admin_list_members() SET SCHEMA private;
ALTER FUNCTION public.admin_remove_member(uuid, text) SET SCHEMA private;

GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.create_order(text,text,text,text,text,text,text,text,text,text,text,jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.admin_add_member(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.admin_get_pix_key() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.admin_list_members() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.admin_remove_member(uuid, text) TO authenticated, service_role;

CREATE FUNCTION public.create_order(
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
RETURNS TABLE(id uuid, code text, subtotal numeric, shipping_fee numeric, total numeric)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT * FROM private.create_order(
    _customer_name, _customer_phone, _customer_email, _zip_code,
    _street, _number, _complement, _district, _city, _state, _notes, _items
  );
$$;

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.has_role(_user_id, _role);
$$;

CREATE FUNCTION public.admin_add_member(_email text)
RETURNS text
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.admin_add_member(_email);
$$;

CREATE FUNCTION public.admin_get_pix_key()
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.admin_get_pix_key();
$$;

CREATE FUNCTION public.admin_list_members()
RETURNS TABLE(user_id uuid, email text, display_name text, is_owner boolean, status text)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT * FROM private.admin_list_members();
$$;

CREATE FUNCTION public.admin_remove_member(_user_id uuid, _email text)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.admin_remove_member(_user_id, _email);
$$;

REVOKE ALL ON FUNCTION public.create_order(text,text,text,text,text,text,text,text,text,text,text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_add_member(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_get_pix_key() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_members() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_remove_member(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_order(text,text,text,text,text,text,text,text,text,text,text,jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_add_member(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_pix_key() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_members() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_remove_member(uuid, text) TO authenticated, service_role;