-- Invitation links for joining projects.
-- Administrators generate a single-use, time-limited link that grants
-- a specified role to whoever accepts it.

CREATE TABLE public.invitation_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  role public.project_role NOT NULL DEFAULT 'reader',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX invitation_links_project_id_idx ON public.invitation_links(project_id);
CREATE INDEX invitation_links_token_idx ON public.invitation_links(token);

ALTER TABLE public.invitation_links ENABLE ROW LEVEL SECURITY;

-- Administrators can manage invitation links for their projects
CREATE POLICY "Administrators can manage invitation links"
  ON public.invitation_links FOR ALL
  USING (project_id IN (SELECT user_admin_project_ids()))
  WITH CHECK (project_id IN (SELECT user_admin_project_ids()));

-- Authenticated users can read a valid (unused, unexpired, not revoked) invitation
-- by token — needed for the acceptance confirmation screen.
-- Tokens are cryptographically random so guessing is not a practical concern.
CREATE POLICY "Authenticated users can read valid invitations"
  ON public.invitation_links FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND is_revoked = FALSE
    AND expires_at > NOW()
    AND used_by IS NULL
  );
