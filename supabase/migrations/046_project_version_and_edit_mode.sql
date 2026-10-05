-- Phase 1b: project version (ADR-010) and one editor at a time per project (ADR-011).
--
-- * projects.version increases on any change to the project's data, deletions included.
--   The app compares it with the version its local copy was synced at.
-- * projects.editing_* is the editing flag: only its holder can write to the project's data,
--   enforced by restrictive RLS policies on every project table. The flag expires after
--   15 minutes without a write (or renewal).
-- * The shared song catalog (songs, artists, song_artists) stays outside the flag.
-- * Memberships, invitations and public libraries are online-only admin features, outside the flag.

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------
ALTER TABLE projects
  ADD COLUMN version bigint NOT NULL DEFAULT 0,
  ADD COLUMN last_changed_at timestamptz,
  ADD COLUMN last_changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN editing_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN editing_since timestamptz,
  ADD COLUMN editing_last_activity timestamptz;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION project_edit_ttl()
RETURNS interval LANGUAGE sql IMMUTABLE SET search_path = public AS $$ SELECT interval '15 minutes' $$;

CREATE OR REPLACE FUNCTION library_song_project_id(p_library_song_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT project_id FROM library_songs WHERE id = p_library_song_id
$$;

CREATE OR REPLACE FUNCTION list_project_id(p_list_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT project_id FROM lists WHERE id = p_list_id
$$;

-- True when the caller holds a valid (non-expired) editing flag on the project
CREATE OR REPLACE FUNCTION has_project_edit_flag(p_project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id
      AND editing_user_id = auth.uid()
      AND editing_last_activity > now() - project_edit_ttl()
  )
$$;

-- ---------------------------------------------------------------------------
-- Version bumps
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION bump_project_version(p_project_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE projects
  SET version = version + 1,
      last_changed_at = now(),
      last_changed_by = auth.uid(),
      -- a write by the flag holder counts as activity
      editing_last_activity = CASE WHEN editing_user_id = auth.uid() THEN now() ELSE editing_last_activity END
  WHERE id = p_project_id
$$;

-- AFTER ROW trigger on the project tables. Cascaded child deletes find no parent
-- (already deleted) and skip; the parent's own trigger bumped the version.
CREATE OR REPLACE FUNCTION trg_bump_project_version()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row jsonb;
  v_project uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN v_row := to_jsonb(OLD); ELSE v_row := to_jsonb(NEW); END IF;

  IF TG_TABLE_NAME IN ('library_songs', 'tags', 'lists') THEN
    v_project := (v_row->>'project_id')::uuid;
  ELSIF TG_TABLE_NAME IN ('notes', 'library_song_tags') THEN
    v_project := library_song_project_id((v_row->>'library_song_id')::uuid);
  ELSIF TG_TABLE_NAME = 'list_items' THEN
    v_project := list_project_id((v_row->>'list_id')::uuid);
  END IF;

  IF v_project IS NOT NULL THEN
    PERFORM bump_project_version(v_project);
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER bump_project_version AFTER INSERT OR UPDATE OR DELETE ON library_songs
  FOR EACH ROW EXECUTE FUNCTION trg_bump_project_version();
CREATE TRIGGER bump_project_version AFTER INSERT OR UPDATE OR DELETE ON notes
  FOR EACH ROW EXECUTE FUNCTION trg_bump_project_version();
CREATE TRIGGER bump_project_version AFTER INSERT OR UPDATE OR DELETE ON library_song_tags
  FOR EACH ROW EXECUTE FUNCTION trg_bump_project_version();
CREATE TRIGGER bump_project_version AFTER INSERT OR UPDATE OR DELETE ON tags
  FOR EACH ROW EXECUTE FUNCTION trg_bump_project_version();
CREATE TRIGGER bump_project_version AFTER INSERT OR UPDATE OR DELETE ON lists
  FOR EACH ROW EXECUTE FUNCTION trg_bump_project_version();
CREATE TRIGGER bump_project_version AFTER INSERT OR UPDATE OR DELETE ON list_items
  FOR EACH ROW EXECUTE FUNCTION trg_bump_project_version();

-- Project settings changes bump the version too; version and flag bookkeeping don't.
CREATE OR REPLACE FUNCTION trg_projects_version()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  meta text[] := ARRAY['version', 'last_changed_at', 'last_changed_by',
                       'editing_user_id', 'editing_since', 'editing_last_activity', 'updated_at'];
BEGIN
  IF (to_jsonb(NEW) - meta) IS DISTINCT FROM (to_jsonb(OLD) - meta) THEN
    NEW.version := OLD.version + 1;
    NEW.last_changed_at := now();
    NEW.last_changed_by := auth.uid();
    IF NEW.editing_user_id = auth.uid() THEN
      NEW.editing_last_activity := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER projects_version BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION trg_projects_version();

-- ---------------------------------------------------------------------------
-- Status and editing flag (RPC)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_project_status(p_project_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v projects%ROWTYPE;
  v_editor jsonb := NULL;
  v_changed_by jsonb := NULL;
BEGIN
  SELECT * INTO v FROM projects WHERE id = p_project_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  IF NOT (
    p_project_id IN (SELECT user_project_ids())
    OR v.owner_id = auth.uid()
    OR p_project_id = community_project_id()
  ) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  IF v.editing_user_id IS NOT NULL AND v.editing_last_activity > now() - project_edit_ttl() THEN
    v_editor := jsonb_build_object(
      'user_id', v.editing_user_id,
      'name', (SELECT display_name FROM profiles WHERE id = v.editing_user_id),
      'since', v.editing_since,
      'expires_in_seconds', floor(extract(epoch FROM v.editing_last_activity + project_edit_ttl() - now()))::int
    );
  END IF;

  IF v.last_changed_by IS NOT NULL THEN
    v_changed_by := jsonb_build_object(
      'user_id', v.last_changed_by,
      'name', (SELECT display_name FROM profiles WHERE id = v.last_changed_by)
    );
  END IF;

  RETURN jsonb_build_object(
    'version', v.version,
    'last_changed_at', v.last_changed_at,
    'last_changed_by', v_changed_by,
    'editor', v_editor
  );
END;
$$;

-- Take the flag. All-or-nothing (row lock), so two members can't both get it.
-- Fails with reason 'locked' (someone else holds it), 'outdated' (the caller's local
-- copy is not at the current version) or 'not_allowed' (role).
CREATE OR REPLACE FUNCTION start_project_editing(p_project_id uuid, p_known_version bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v projects%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR p_project_id NOT IN (SELECT user_editor_project_ids()) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_allowed');
  END IF;

  SELECT * INTO v FROM projects WHERE id = p_project_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_allowed');
  END IF;

  IF v.editing_user_id IS NOT NULL
     AND v.editing_user_id <> auth.uid()
     AND v.editing_last_activity > now() - project_edit_ttl() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'locked', 'status', get_project_status(p_project_id));
  END IF;

  IF v.version <> p_known_version THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'outdated', 'status', get_project_status(p_project_id));
  END IF;

  UPDATE projects
  SET editing_since = CASE
        WHEN editing_user_id = auth.uid() AND editing_last_activity > now() - project_edit_ttl() THEN editing_since
        ELSE now()
      END,
      editing_user_id = auth.uid(),
      editing_last_activity = now()
  WHERE id = p_project_id;

  RETURN jsonb_build_object('ok', true, 'status', get_project_status(p_project_id));
END;
$$;

-- Keep the flag ("Keep editing?"). Only while the caller is still the holder:
-- once someone else took it, or it was released, this fails.
CREATE OR REPLACE FUNCTION renew_project_editing(p_project_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v projects%ROWTYPE;
BEGIN
  SELECT * INTO v FROM projects WHERE id = p_project_id FOR UPDATE;
  IF NOT FOUND OR v.editing_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_holder', 'status', get_project_status(p_project_id));
  END IF;

  UPDATE projects SET editing_last_activity = now() WHERE id = p_project_id;
  RETURN jsonb_build_object('ok', true, 'status', get_project_status(p_project_id));
END;
$$;

CREATE OR REPLACE FUNCTION stop_project_editing(p_project_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE projects
  SET editing_user_id = NULL, editing_since = NULL, editing_last_activity = NULL
  WHERE id = p_project_id AND editing_user_id = auth.uid();
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- An administrator releases someone else's flag (e.g. a member forgot to stop)
CREATE OR REPLACE FUNCTION release_project_editing(p_project_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_project_id NOT IN (SELECT user_admin_project_ids()) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_allowed');
  END IF;
  UPDATE projects
  SET editing_user_id = NULL, editing_since = NULL, editing_last_activity = NULL
  WHERE id = p_project_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ---------------------------------------------------------------------------
-- Writes require the flag (restrictive: combined with the existing role policies)
-- ---------------------------------------------------------------------------
CREATE POLICY "Editing flag required to insert" ON library_songs AS RESTRICTIVE FOR INSERT
  WITH CHECK (has_project_edit_flag(project_id));
CREATE POLICY "Editing flag required to update" ON library_songs AS RESTRICTIVE FOR UPDATE
  USING (has_project_edit_flag(project_id)) WITH CHECK (has_project_edit_flag(project_id));
CREATE POLICY "Editing flag required to delete" ON library_songs AS RESTRICTIVE FOR DELETE
  USING (has_project_edit_flag(project_id));

CREATE POLICY "Editing flag required to insert" ON tags AS RESTRICTIVE FOR INSERT
  WITH CHECK (has_project_edit_flag(project_id));
CREATE POLICY "Editing flag required to update" ON tags AS RESTRICTIVE FOR UPDATE
  USING (has_project_edit_flag(project_id)) WITH CHECK (has_project_edit_flag(project_id));
CREATE POLICY "Editing flag required to delete" ON tags AS RESTRICTIVE FOR DELETE
  USING (has_project_edit_flag(project_id));

CREATE POLICY "Editing flag required to insert" ON lists AS RESTRICTIVE FOR INSERT
  WITH CHECK (has_project_edit_flag(project_id));
CREATE POLICY "Editing flag required to update" ON lists AS RESTRICTIVE FOR UPDATE
  USING (has_project_edit_flag(project_id)) WITH CHECK (has_project_edit_flag(project_id));
CREATE POLICY "Editing flag required to delete" ON lists AS RESTRICTIVE FOR DELETE
  USING (has_project_edit_flag(project_id));

CREATE POLICY "Editing flag required to insert" ON notes AS RESTRICTIVE FOR INSERT
  WITH CHECK (has_project_edit_flag(library_song_project_id(library_song_id)));
CREATE POLICY "Editing flag required to update" ON notes AS RESTRICTIVE FOR UPDATE
  USING (has_project_edit_flag(library_song_project_id(library_song_id)))
  WITH CHECK (has_project_edit_flag(library_song_project_id(library_song_id)));
CREATE POLICY "Editing flag required to delete" ON notes AS RESTRICTIVE FOR DELETE
  USING (has_project_edit_flag(library_song_project_id(library_song_id)));

CREATE POLICY "Editing flag required to insert" ON library_song_tags AS RESTRICTIVE FOR INSERT
  WITH CHECK (has_project_edit_flag(library_song_project_id(library_song_id)));
CREATE POLICY "Editing flag required to update" ON library_song_tags AS RESTRICTIVE FOR UPDATE
  USING (has_project_edit_flag(library_song_project_id(library_song_id)))
  WITH CHECK (has_project_edit_flag(library_song_project_id(library_song_id)));
CREATE POLICY "Editing flag required to delete" ON library_song_tags AS RESTRICTIVE FOR DELETE
  USING (has_project_edit_flag(library_song_project_id(library_song_id)));

CREATE POLICY "Editing flag required to insert" ON list_items AS RESTRICTIVE FOR INSERT
  WITH CHECK (has_project_edit_flag(list_project_id(list_id)));
CREATE POLICY "Editing flag required to update" ON list_items AS RESTRICTIVE FOR UPDATE
  USING (has_project_edit_flag(list_project_id(list_id)))
  WITH CHECK (has_project_edit_flag(list_project_id(list_id)));
CREATE POLICY "Editing flag required to delete" ON list_items AS RESTRICTIVE FOR DELETE
  USING (has_project_edit_flag(list_project_id(list_id)));

-- Project settings. Creating and deleting a project stay outside the flag.
CREATE POLICY "Editing flag required to update" ON projects AS RESTRICTIVE FOR UPDATE
  USING (has_project_edit_flag(id)) WITH CHECK (has_project_edit_flag(id));

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER functions that write project data bypass RLS: check explicitly
-- ---------------------------------------------------------------------------

-- Previously had no access check at all: any signed-in user could reorder any setlist.
CREATE OR REPLACE FUNCTION update_list_item_positions(item_positions jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  item jsonb;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(item_positions) e
    LEFT JOIN list_items li ON li.id = (e->>'id')::uuid
    WHERE li.id IS NULL OR NOT has_project_edit_flag(list_project_id(li.list_id))
  ) THEN
    RAISE EXCEPTION 'Editing this project requires the editing flag' USING ERRCODE = '42501';
  END IF;

  -- Step 1: move all items to temporary negative positions to avoid conflicts
  FOR item IN SELECT * FROM jsonb_array_elements(item_positions)
  LOOP
    UPDATE list_items
    SET position = -((item->>'position')::integer + 1)
    WHERE id = (item->>'id')::uuid;
  END LOOP;

  -- Step 2: move all items to their final positions
  FOR item IN SELECT * FROM jsonb_array_elements(item_positions)
  LOOP
    UPDATE list_items
    SET position = (item->>'position')::integer
    WHERE id = (item->>'id')::uuid;
  END LOOP;
END;
$$;

-- Pushing a note into a project that someone else is editing would change their data
-- behind their back: refuse until they stop.
CREATE OR REPLACE FUNCTION public.push_note_to_project(p_note_id uuid, p_target_project_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_note          notes%ROWTYPE;
  v_source_ls     library_songs%ROWTYPE;
  v_target        projects%ROWTYPE;
  v_target_ls_id  UUID;
  v_new_note_id   UUID;
BEGIN
  SELECT * INTO v_note FROM notes WHERE id = p_note_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Note not found';
  END IF;

  SELECT * INTO v_source_ls FROM library_songs WHERE id = v_note.library_song_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source library song not found';
  END IF;

  IF NOT (
    v_source_ls.project_id IN (SELECT user_project_ids())
    OR v_source_ls.project_id = community_project_id()
  ) THEN
    RAISE EXCEPTION 'Access denied to source note';
  END IF;

  IF v_source_ls.project_id = p_target_project_id THEN
    RAISE EXCEPTION 'Cannot push note to its own project';
  END IF;

  IF NOT (
    p_target_project_id IN (SELECT user_project_ids())
    OR p_target_project_id = community_project_id()
  ) THEN
    RAISE EXCEPTION 'Access denied to target project';
  END IF;

  SELECT * INTO v_target FROM projects WHERE id = p_target_project_id FOR UPDATE;
  IF v_target.editing_user_id IS NOT NULL
     AND v_target.editing_user_id <> auth.uid()
     AND v_target.editing_last_activity > now() - project_edit_ttl() THEN
    RAISE EXCEPTION 'This project is being edited by %. Try again later.',
      coalesce((SELECT display_name FROM profiles WHERE id = v_target.editing_user_id), 'another member');
  END IF;

  SELECT id INTO v_target_ls_id
  FROM library_songs
  WHERE project_id = p_target_project_id
    AND song_id = v_source_ls.song_id;

  IF v_target_ls_id IS NULL THEN
    INSERT INTO library_songs (project_id, song_id, added_by)
    VALUES (p_target_project_id, v_source_ls.song_id, auth.uid())
    RETURNING id INTO v_target_ls_id;
  END IF;

  INSERT INTO notes (library_song_id, type, title, content, data, created_by, updated_by)
  VALUES (
    v_target_ls_id,
    v_note.type,
    v_note.title,
    v_note.content,
    v_note.data,
    auth.uid(),
    auth.uid()
  )
  RETURNING id INTO v_new_note_id;

  INSERT INTO note_push_requests (source_note_id, source_project_id, target_project_id, pushed_by)
  VALUES (p_note_id, v_source_ls.project_id, p_target_project_id, auth.uid());

  RETURN jsonb_build_object(
    'success', true,
    'note_id', v_new_note_id,
    'library_song_id', v_target_ls_id
  );
END;
$function$;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION bump_project_version(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION trg_bump_project_version() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION trg_projects_version() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION has_project_edit_flag(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION library_song_project_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION list_project_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION get_project_status(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION start_project_editing(uuid, bigint) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION renew_project_editing(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION stop_project_editing(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION release_project_editing(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION update_list_item_positions(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION library_song_project_id(uuid), list_project_id(uuid), has_project_edit_flag(uuid),
  get_project_status(uuid), start_project_editing(uuid, bigint), renew_project_editing(uuid),
  stop_project_editing(uuid), release_project_editing(uuid), update_list_item_positions(jsonb)
  TO authenticated;
