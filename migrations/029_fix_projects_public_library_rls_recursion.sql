-- The policy added in 028 caused infinite recursion (42P17):
-- projects policy → queries public_libraries → public_libraries policy → queries projects → ...
-- Fix: use a SECURITY DEFINER function to read public_libraries without triggering RLS.

DROP POLICY IF EXISTS "Projects with active public libraries are viewable by anyone" ON projects;

CREATE OR REPLACE FUNCTION get_active_public_library_project_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT project_id FROM public_libraries WHERE is_active = true;
$$;

CREATE POLICY "Projects with active public libraries are viewable by anyone"
  ON projects FOR SELECT
  USING (
    id IN (SELECT get_active_public_library_project_ids())
  );
