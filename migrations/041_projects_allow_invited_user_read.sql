-- Allow authenticated users to see basic project info when they hold a valid invitation
CREATE POLICY "Users can view projects they are invited to"
  ON public.projects FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND id IN (
      SELECT project_id FROM invitation_links
      WHERE is_revoked = false
        AND expires_at > now()
        AND used_by IS NULL
    )
  );
