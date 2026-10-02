-- Allow users to read profiles of people who share a project with them
CREATE POLICY "Users can view co-member profiles"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT user_id FROM project_memberships
      WHERE project_id IN (SELECT user_project_ids())
    )
  );
