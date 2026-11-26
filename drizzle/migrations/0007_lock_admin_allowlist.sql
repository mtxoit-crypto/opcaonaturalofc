-- Freeze administrator identity to the owner plus existing administrators and
-- pending invitations. Only trusted database/server operators can extend it.
CREATE TABLE IF NOT EXISTS private.admin_email_allowlist (
  email text PRIMARY KEY CHECK (email = lower(btrim(email))),
  created_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON private.admin_email_allowlist FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.admin_email_allowlist TO service_role;

INSERT INTO private.admin_email_allowlist (email)
SELECT lower(btrim(email))
FROM (
  SELECT u.email::text AS email
  FROM public.user_roles AS r
  JOIN auth.users AS u ON u.id = r.user_id
  WHERE r.role = 'admin'::public.app_role
  UNION
  SELECT i.email FROM public.admin_invites AS i
  UNION
  SELECT 'mtxoit@gmail.com'
) AS existing_admins
WHERE email IS NOT NULL AND btrim(email) <> ''
ON CONFLICT (email) DO NOTHING;

DO $$
BEGIN
  IF (SELECT count(*) FROM private.admin_email_allowlist) > 2 THEN
    RAISE EXCEPTION 'Security migration stopped: more than two admin identities/invitations exist; audit the list before applying this migration';
  END IF;
END;
$$;

-- Invitation and membership changes must go through the guarded database
-- functions; table-level grants would otherwise let an admin add arbitrary
-- identities directly through PostgREST.
DROP POLICY IF EXISTS "admins manage invites" ON public.admin_invites;
DROP POLICY IF EXISTS "admins read invites" ON public.admin_invites;
CREATE POLICY "admins read invites" ON public.admin_invites
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));
REVOKE ALL ON public.admin_invites FROM PUBLIC, anon, authenticated;

-- Public catalog metadata is visible only when its product is published. Draft
-- media records stay hidden; object visibility remains governed by bucket policy.
DROP POLICY IF EXISTS "public read product media" ON public.product_media;
DROP POLICY IF EXISTS "public active product media" ON public.product_media;
DROP POLICY IF EXISTS "admins read all product media" ON public.product_media;
CREATE POLICY "public active product media" ON public.product_media
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products AS p
    WHERE p.id = product_media.product_id AND p.is_active
  ));
CREATE POLICY "admins read all product media" ON public.product_media
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION private.admin_add_member(_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
  v_email text := lower(btrim(_email));
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem adicionar socios';
  END IF;
  IF v_email IS NULL OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'E-mail invalido';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('opcaonatural-admin-membership', 0));

  IF NOT EXISTS (
    SELECT 1 FROM private.admin_email_allowlist AS allowed WHERE allowed.email = v_email
  ) THEN
    RAISE EXCEPTION 'Este e-mail nao esta na lista fixa de administradores';
  END IF;

  SELECT u.id INTO v_id
  FROM auth.users AS u
  WHERE lower(u.email) = v_email AND u.email_confirmed_at IS NOT NULL
  LIMIT 1;
  IF v_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN 'ativo';
  END IF;

  INSERT INTO public.admin_invites (email, invited_by)
  VALUES (v_email, auth.uid())
  ON CONFLICT (email) DO NOTHING;
  RETURN 'convidado';
END;
$$;

CREATE OR REPLACE FUNCTION private.grant_invited_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.admin_invites AS i
      JOIN private.admin_email_allowlist AS allowed ON allowed.email = lower(i.email)
      WHERE lower(i.email) = lower(NEW.email)
    ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.admin_add_member(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.admin_add_member(text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION private.grant_invited_admin() FROM PUBLIC, anon, authenticated;

-- Require a verified second factor for every authorization check that grants
-- administrator access. Postgres enforces this even when the UI is bypassed.
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF coalesce(auth.role(), 'anon') <> 'service_role' AND _user_id IS DISTINCT FROM auth.uid() THEN
    RETURN false;
  END IF;

  IF _role = 'admin'::public.app_role
    AND coalesce(auth.role(), 'anon') <> 'service_role'
    AND coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles AS roles
    WHERE roles.user_id = _user_id
      AND roles.role = _role
      AND (
        _role <> 'admin'::public.app_role
        OR EXISTS (
          SELECT 1
          FROM auth.users AS u
          JOIN private.admin_email_allowlist AS allowed ON allowed.email = lower(u.email)
          WHERE u.id = roles.user_id AND u.email_confirmed_at IS NOT NULL
        )
      )
  );
END;
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
