-- Migration: Add Artists Tables
-- Description: Convert single artist field to many-to-many artist relationship
-- Date: April 1, 2026

-- =============================================================================
-- STEP 1: Create Artists Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_artist_per_project UNIQUE (project_id, name)
);

COMMENT ON TABLE artists IS 'Artists that can be associated with songs (many-to-many)';
COMMENT ON COLUMN artists.name IS 'Artist name (unique per project)';

-- =============================================================================
-- STEP 2: Create SongArtists Junction Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS song_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_song_artist UNIQUE (song_id, artist_id),
  CONSTRAINT unique_song_artist_position UNIQUE (song_id, position)
);

COMMENT ON TABLE song_artists IS 'Junction table linking songs to artists with ordering';
COMMENT ON COLUMN song_artists.position IS 'Display order of artist for this song (1-based)';

-- =============================================================================
-- STEP 3: Add Indexes for Performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_artists_project_id ON artists(project_id);
CREATE INDEX IF NOT EXISTS idx_artists_name ON artists(name);
CREATE INDEX IF NOT EXISTS idx_song_artists_song_id ON song_artists(song_id);
CREATE INDEX IF NOT EXISTS idx_song_artists_artist_id ON song_artists(artist_id);
CREATE INDEX IF NOT EXISTS idx_song_artists_song_position ON song_artists(song_id, position);

-- =============================================================================
-- STEP 4: Add RLS Policies for Artists
-- =============================================================================

ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

-- Users can view artists in their projects
CREATE POLICY "Users can view artists in their project"
  ON artists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = artists.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- Users can create artists in their projects
CREATE POLICY "Users can create artists in their project"
  ON artists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = artists.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- Users can update artists in their projects
CREATE POLICY "Users can update artists in their project"
  ON artists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = artists.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- Users can delete artists in their projects
CREATE POLICY "Users can delete artists in their project"
  ON artists FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = artists.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- STEP 5: Add RLS Policies for SongArtists
-- =============================================================================

ALTER TABLE song_artists ENABLE ROW LEVEL SECURITY;

-- Users can view song_artists for songs in their projects
CREATE POLICY "Users can view song_artists in their project"
  ON song_artists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM songs
      INNER JOIN projects ON projects.id = songs.project_id
      WHERE songs.id = song_artists.song_id
        AND projects.owner_id = auth.uid()
    )
  );

-- Users can create song_artists for songs in their projects
CREATE POLICY "Users can create song_artists in their project"
  ON song_artists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM songs
      INNER JOIN projects ON projects.id = songs.project_id
      WHERE songs.id = song_artists.song_id
        AND projects.owner_id = auth.uid()
    )
  );

-- Users can update song_artists for songs in their projects
CREATE POLICY "Users can update song_artists in their project"
  ON song_artists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM songs
      INNER JOIN projects ON projects.id = songs.project_id
      WHERE songs.id = song_artists.song_id
        AND projects.owner_id = auth.uid()
    )
  );

-- Users can delete song_artists for songs in their projects
CREATE POLICY "Users can delete song_artists in their project"
  ON song_artists FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM songs
      INNER JOIN projects ON projects.id = songs.project_id
      WHERE songs.id = song_artists.song_id
        AND projects.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- STEP 6: Add updated_at Trigger for Artists
-- =============================================================================

-- Create or replace the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_artists_updated_at
  BEFORE UPDATE ON artists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 7: Migrate Existing Data
-- =============================================================================

-- For each song with an artist value, create artist record (or reuse existing)
-- and create song_artists entry with position = 1

DO $$
DECLARE
  song_record RECORD;
  v_artist_id UUID;
BEGIN
  -- Loop through all songs that have an artist value
  FOR song_record IN 
    SELECT id, project_id, artist 
    FROM songs 
    WHERE artist IS NOT NULL AND TRIM(artist) != ''
  LOOP
    -- Try to find existing artist with this name in the same project
    SELECT id INTO v_artist_id
    FROM artists
    WHERE project_id = song_record.project_id 
      AND name = song_record.artist;
    
    -- If artist doesn't exist, create it
    IF v_artist_id IS NULL THEN
      INSERT INTO artists (project_id, name)
      VALUES (song_record.project_id, song_record.artist)
      RETURNING id INTO v_artist_id;
    END IF;
    
    -- Create song_artists relationship (if not already exists)
    INSERT INTO song_artists (song_id, artist_id, position)
    VALUES (song_record.id, v_artist_id, 1)
    ON CONFLICT (song_id, artist_id) DO NOTHING;
    
  END LOOP;
  
  RAISE NOTICE 'Migration complete: Migrated artist data to new tables';
END $$;

-- =============================================================================
-- STEP 8: Remove Old Artist Column (OPTIONAL - Hold off until app is updated)
-- =============================================================================

-- CAUTION: Only run this after you've updated your application code!
-- Uncomment when ready:

-- ALTER TABLE songs DROP COLUMN IF EXISTS artist;

-- =============================================================================
-- Verification Queries (run these to verify migration)
-- =============================================================================

-- Count artists created
-- SELECT COUNT(*) as artist_count FROM artists;

-- Count song_artists relationships
-- SELECT COUNT(*) as song_artist_count FROM song_artists;

-- Sample songs with artists
-- SELECT 
--   s.id,
--   s.title,
--   s.artist as old_artist_field,
--   ARRAY_AGG(a.name ORDER BY sa.position) as new_artists
-- FROM songs s
-- LEFT JOIN song_artists sa ON sa.song_id = s.id
-- LEFT JOIN artists a ON a.id = sa.artist_id
-- GROUP BY s.id, s.title, s.artist
-- LIMIT 10;
