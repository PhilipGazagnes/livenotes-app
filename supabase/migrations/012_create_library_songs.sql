-- Migration: 012_create_library_songs.sql
-- Junction between projects and global songs

CREATE TABLE IF NOT EXISTS library_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs_v2(id) ON DELETE CASCADE,
  
  -- Tracking
  added_by UUID REFERENCES auth.users(id) NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Optional overrides
  custom_title TEXT,
  custom_notes TEXT,
  
  -- Constraints
  CONSTRAINT unique_project_song UNIQUE (project_id, song_id)
);

-- Indexes
CREATE INDEX idx_library_songs_project ON library_songs(project_id);
CREATE INDEX idx_library_songs_song ON library_songs(song_id);
CREATE INDEX idx_library_songs_added_by ON library_songs(added_by);

-- Comments
COMMENT ON TABLE library_songs IS 'Junction between projects and global songs (user libraries)';
COMMENT ON COLUMN library_songs.custom_title IS 'Project-specific title override';
COMMENT ON COLUMN library_songs.custom_notes IS 'Project-specific general notes';

-- RLS
ALTER TABLE library_songs ENABLE ROW LEVEL SECURITY;

-- Users can view library songs for their projects
CREATE POLICY "Users can view their library songs"
  ON library_songs FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Users can add songs to their libraries
CREATE POLICY "Users can add to their library"
  ON library_songs FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
    AND added_by = auth.uid()
  );

-- Users can update their library songs
CREATE POLICY "Users can update their library songs"
  ON library_songs FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Users can remove from library
CREATE POLICY "Users can delete from their library"
  ON library_songs FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );
