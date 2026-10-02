-- SECURITY DEFINER function so any authenticated user can join a project via a
-- valid invitation token, even though direct INSERT to project_memberships
-- requires the administrator role.

CREATE OR REPLACE FUNCTION join_project_via_invitation(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite invitation_links%ROWTYPE;
BEGIN
  SELECT * INTO v_invite
  FROM invitation_links
  WHERE token = p_token
    AND is_revoked = false
    AND expires_at > now()
    AND used_by IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation link';
  END IF;

  IF EXISTS (
    SELECT 1 FROM project_memberships
    WHERE project_id = v_invite.project_id AND user_id = auth.uid()
  ) THEN
    RETURN json_build_object('project_id', v_invite.project_id, 'already_member', true);
  END IF;

  INSERT INTO project_memberships (project_id, user_id, role, invited_by)
  VALUES (v_invite.project_id, auth.uid(), v_invite.role, v_invite.created_by);

  UPDATE invitation_links
  SET used_by = auth.uid(), used_at = now()
  WHERE id = v_invite.id;

  RETURN json_build_object('project_id', v_invite.project_id, 'already_member', false);
END;
$$;
