
REVOKE ALL ON FUNCTION public.admin_add_member(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_remove_member(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_members() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_pix_key() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.grant_invited_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_owner_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_order_deletion() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_owner_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_order(text,text,text,text,text,text,text,text,text,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order(text,text,text,text,text,text,text,text,text,text,text,jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_member(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_remove_member(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_members() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_pix_key() TO authenticated;
