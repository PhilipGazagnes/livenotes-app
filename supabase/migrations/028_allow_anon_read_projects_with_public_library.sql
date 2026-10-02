-- Unauthenticated users could not resolve a project slug when loading a public library
-- because the only SELECT policy on projects requires owner_id = auth.uid().
-- Add a scoped policy that lets anyone read projects that have at least one active public library.

CREATE POLICY "Projects with active public libraries are viewable by anyone"
  ON projects FOR SELECT
  USING (
    id IN (SELECT project_id FROM public_libraries WHERE is_active = true)
  );
