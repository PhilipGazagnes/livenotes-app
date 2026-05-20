-- Tags in projects with active public libraries must be readable by anon
-- so that public library tag filters resolve correctly.
-- Reuses get_active_public_library_project_ids() (SECURITY DEFINER) to avoid RLS recursion.

CREATE POLICY "Tags in projects with active public libraries are viewable by anyone"
  ON tags FOR SELECT
  USING (
    project_id IN (SELECT get_active_public_library_project_ids())
  );
