REVOKE ALL ON FUNCTION public.create_order(text,text,text,text,text,text,text,text,text,text,text,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.create_order(text,text,text,text,text,text,text,text,text,text,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order(text,text,text,text,text,text,text,text,text,text,text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION private.create_order(text,text,text,text,text,text,text,text,text,text,text,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION private.grant_invited_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.admin_invites WHERE lower(email) = lower(NEW.email)
  ) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.grant_invited_admin() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_invited_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_invited_admin AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.grant_invited_admin();
DROP TRIGGER IF EXISTS on_auth_user_confirmed_invited_admin ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_invited_admin AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION private.grant_invited_admin();

CREATE OR REPLACE FUNCTION public.grant_invited_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN RETURN NEW; END;
$$;
COMMENT ON FUNCTION public.grant_invited_admin() IS 'DEPRECATED: auth lifecycle triggers now use private.grant_invited_admin';
REVOKE ALL ON FUNCTION public.grant_invited_admin() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.admin_add_member(_email text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id uuid; v_email text := lower(btrim(_email));
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem adicionar socios';
  END IF;
  IF v_email IS NULL OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'E-mail invalido';
  END IF;
  SELECT id INTO v_id FROM auth.users
  WHERE lower(email) = v_email AND email_confirmed_at IS NOT NULL LIMIT 1;
  IF v_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN 'ativo';
  END IF;
  INSERT INTO public.admin_invites (email, invited_by) VALUES (v_email, auth.uid())
  ON CONFLICT (email) DO NOTHING;
  RETURN 'convidado';
END;
$$;
REVOKE ALL ON FUNCTION private.admin_add_member(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.admin_add_member(text) TO authenticated, service_role;