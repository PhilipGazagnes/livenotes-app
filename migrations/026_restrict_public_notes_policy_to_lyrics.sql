DROP POLICY IF EXISTS "Notes in active public libraries are viewable" ON notes;

CREATE POLICY "Notes in active public libraries are viewable"
  ON notes FOR SELECT
  USING (
    type IN ('songcode', 'lyrics')
    AND library_song_id IN (
      SELECT ls.id FROM library_songs ls
      WHERE ls.project_id IN (SELECT project_id FROM public_libraries WHERE is_active = true)
    )
  );
