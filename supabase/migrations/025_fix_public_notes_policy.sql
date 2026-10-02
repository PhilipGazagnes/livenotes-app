-- The original policy only allowed type='lyrics' but the app uses 'songcode' as its
-- primary text-content type (420 notes vs 0 lyrics notes). Broaden to all text types.
DROP POLICY IF EXISTS "Lyrics notes in active public libraries are viewable" ON notes;

CREATE POLICY "Notes in active public libraries are viewable"
  ON notes FOR SELECT
  USING (
    type IN ('lyrics', 'songcode', 'plain_text', 'chords')
    AND library_song_id IN (
      SELECT ls.id FROM library_songs ls
      WHERE ls.project_id IN (SELECT project_id FROM public_libraries WHERE is_active = true)
    )
  );
