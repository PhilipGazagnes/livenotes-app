-- Fix: INSERT ... RETURNING on projects fails because the AFTER trigger that
-- adds the creator's membership fires after the RETURNING clause applies the
-- SELECT policy.  At RETURNING time user_project_ids() doesn't yet include
-- the new project, so the row is invisible and PostgreSQL raises
-- "new row violates row-level security policy".
--
-- Fix: add `owner_id = auth.uid()` as a fallback so the creator can always
-- see their own project regardless of membership state.

DROP POLICY IF EXISTS "Users can view accessible projects" ON public.projects;

CREATE POLICY "Users can view accessible projects"
  ON public.projects FOR SELECT
  USING (
    id IN (SELECT user_project_ids())
    OR owner_id = auth.uid()
    OR slug = 'community'
    OR id IN (SELECT get_active_public_library_project_ids())
  );
