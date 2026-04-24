-- Migration: 014_update_tags_for_library_songs.sql
-- Create new junction table for library songs ↔ tags

CREATE TABLE IF NOT EXISTS library_song_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_song_id UUID NOT NULL REFERENCES library_songs(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_library_song_tag UNIQUE (library_song_id, tag_id)
);

-- Indexes
CREATE INDEX idx_library_song_tags_library_song ON library_song_tags(library_song_id);
CREATE INDEX idx_library_song_tags_tag ON library_song_tags(tag_id);

-- RLS
ALTER TABLE library_song_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tags for their library"
  ON library_song_tags FOR SELECT
  USING (
    library_song_id IN (
      SELECT ls.id FROM library_songs ls
      JOIN projects p ON ls.project_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can tag their library songs"
  ON library_song_tags FOR INSERT
  WITH CHECK (
    library_song_id IN (
      SELECT ls.id FROM library_songs ls
      JOIN projects p ON ls.project_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove tags from library"
  ON library_song_tags FOR DELETE
  USING (
    library_song_id IN (
      SELECT ls.id FROM library_songs ls
      JOIN projects p ON ls.project_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

-- Note: tags table itself remains unchanged (still project-scoped)
