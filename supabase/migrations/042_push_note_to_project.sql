CREATE OR REPLACE FUNCTION push_note_to_project(
  p_note_id UUID,
  p_target_project_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_note          notes%ROWTYPE;
  v_source_ls     library_songs%ROWTYPE;
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

  -- Caller must have read access to the source project
  IF NOT (
    v_source_ls.project_id IN (SELECT user_project_ids())
    OR v_source_ls.project_id = community_project_id()
  ) THEN
    RAISE EXCEPTION 'Access denied to source note';
  END IF;

  -- Cannot push to the same project
  IF v_source_ls.project_id = p_target_project_id THEN
    RAISE EXCEPTION 'Cannot push note to its own project';
  END IF;

  -- Caller must be a member of the target project, OR it is the community project
  IF NOT (
    p_target_project_id IN (SELECT user_project_ids())
    OR p_target_project_id = community_project_id()
  ) THEN
    RAISE EXCEPTION 'Access denied to target project';
  END IF;

  -- Find existing library_song in target project for the same global song
  SELECT id INTO v_target_ls_id
  FROM library_songs
  WHERE project_id = p_target_project_id
    AND song_id = v_source_ls.song_id;

  -- If not yet in the target library, add it
  IF v_target_ls_id IS NULL THEN
    INSERT INTO library_songs (project_id, song_id, added_by)
    VALUES (p_target_project_id, v_source_ls.song_id, auth.uid())
    RETURNING id INTO v_target_ls_id;
  END IF;

  -- Copy the note (reset public/shareable flags)
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

  -- Log the push
  INSERT INTO note_push_requests (source_note_id, source_project_id, target_project_id, pushed_by)
  VALUES (p_note_id, v_source_ls.project_id, p_target_project_id, auth.uid());

  RETURN jsonb_build_object(
    'success', true,
    'note_id', v_new_note_id,
    'library_song_id', v_target_ls_id
  );
END;
$$;
