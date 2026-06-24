-- Drop the deprecated type column from projects (was 'personal' | 'shared').
-- All projects now use the same schema; the community project is identified
-- by its reserved slug 'community'.

ALTER TABLE public.projects DROP COLUMN type;

-- Partial unique index: enforces uniqueness for non-NULL slugs while allowing
-- multiple projects to have no slug yet.
CREATE UNIQUE INDEX projects_slug_unique
  ON public.projects(slug)
  WHERE slug IS NOT NULL;

-- Seed the community project.
-- The first registered user becomes its owner and is marked as super admin.
DO $$
DECLARE
  v_owner_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.projects WHERE slug = 'community') THEN
    RAISE NOTICE 'Community project already exists, skipping seed';
    RETURN;
  END IF;

  SELECT id INTO v_owner_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'No users found — run this migration after creating at least one user';
  END IF;

  INSERT INTO public.projects (name, slug, owner_id, description)
  VALUES (
    'Community',
    'community',
    v_owner_id,
    'Shared community project — readable by all authenticated users'
  );

  -- The on_project_created trigger will automatically insert v_owner_id as
  -- administrator of the community project.

  UPDATE public.profiles
  SET is_super_admin = TRUE
  WHERE id = v_owner_id;
END;
$$;
