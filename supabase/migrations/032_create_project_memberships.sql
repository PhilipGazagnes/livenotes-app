-- Create project role enum and project_memberships table.
-- Also creates the SECURITY DEFINER helper functions used by all RLS policies
-- in this migration and in 036_update_rls_policies.sql.

CREATE TYPE public.project_role AS ENUM ('reader', 'editor', 'administrator');

CREATE TABLE public.project_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.project_role NOT NULL DEFAULT 'reader',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX project_memberships_user_id_idx ON public.project_memberships(user_id);
CREATE INDEX project_memberships_project_id_idx ON public.project_memberships(project_id);

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER to avoid RLS recursion when these are
-- used inside policies on project_memberships or its dependent tables)
-- ---------------------------------------------------------------------------

-- All project IDs the current user is a member of (any role)
CREATE OR REPLACE FUNCTION public.user_project_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT project_id FROM project_memberships WHERE user_id = auth.uid()
$$;

-- Project IDs where the current user has editor or administrator role
CREATE OR REPLACE FUNCTION public.user_editor_project_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT project_id FROM project_memberships
  WHERE user_id = auth.uid() AND role IN ('editor', 'administrator')
$$;

-- Project IDs where the current user has administrator role
CREATE OR REPLACE FUNCTION public.user_admin_project_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT project_id FROM project_memberships
  WHERE user_id = auth.uid() AND role = 'administrator'
$$;

-- ID of the community project (looked up by reserved slug)
CREATE OR REPLACE FUNCTION public.community_project_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM projects WHERE slug = 'community' LIMIT 1
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.project_memberships ENABLE ROW LEVEL SECURITY;

-- Members can see all memberships in projects they belong to
CREATE POLICY "Members can view project memberships"
  ON public.project_memberships FOR SELECT
  USING (project_id IN (SELECT user_project_ids()));

-- Administrators can manage memberships in their projects
CREATE POLICY "Administrators can insert memberships"
  ON public.project_memberships FOR INSERT
  WITH CHECK (project_id IN (SELECT user_admin_project_ids()));

CREATE POLICY "Administrators can update memberships"
  ON public.project_memberships FOR UPDATE
  USING (project_id IN (SELECT user_admin_project_ids()));

CREATE POLICY "Administrators can delete memberships"
  ON public.project_memberships FOR DELETE
  USING (project_id IN (SELECT user_admin_project_ids()));

-- ---------------------------------------------------------------------------
-- Trigger: auto-insert creator as administrator when a project is created
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO project_memberships (project_id, user_id, role, joined_at)
  VALUES (NEW.id, NEW.owner_id, 'administrator', NOW());
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_project();

-- Backfill: make all existing project owners administrators
INSERT INTO public.project_memberships (project_id, user_id, role, joined_at)
SELECT id, owner_id, 'administrator', created_at
FROM public.projects
ON CONFLICT (project_id, user_id) DO NOTHING;
