-- Migration: Add SongCode Table
-- Description: Separate table for SongCode and generated Livenotes JSON
-- Date: April 3, 2026

-- =============================================================================
-- Create SongCode Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS songcode (
  song_id UUID PRIMARY KEY REFERENCES songs(id) ON DELETE CASCADE,
  songcode TEXT,
  songcode_updated_at TIMESTAMPTZ,
  songcode_updated_by UUID REFERENCES auth.users(id),
  livenotes_json JSONB,
  livenotes_json_updated_at TIMESTAMPTZ,
  livenotes_json_updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE songcode IS 'SongCode and generated Livenotes JSON for songs (one-to-one)';
COMMENT ON COLUMN songcode.songcode IS 'Raw SongCode text format';
COMMENT ON COLUMN songcode.livenotes_json IS 'Generated Livenotes JSON from SongCode (read-only)';

-- =============================================================================
-- Add Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_songcode_song_id ON songcode(song_id);

-- =============================================================================
-- Enable RLS
-- =============================================================================

ALTER TABLE songcode ENABLE ROW LEVEL SECURITY;

-- Users can view songcode for songs they have access to
CREATE POLICY "Users can view songcode for their project songs"
  ON songcode FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM songs s
      JOIN projects p ON s.project_id = p.id
      WHERE s.id = songcode.song_id
        AND p.owner_id = auth.uid()
    )
  );

-- Users can insert songcode for songs they have access to
CREATE POLICY "Users can create songcode for their project songs"
  ON songcode FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM songs s
      JOIN projects p ON s.project_id = p.id
      WHERE s.id = songcode.song_id
        AND p.owner_id = auth.uid()
    )
  );

-- Users can update songcode for songs they have access to
CREATE POLICY "Users can update songcode for their project songs"
  ON songcode FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM songs s
      JOIN projects p ON s.project_id = p.id
      WHERE s.id = songcode.song_id
        AND p.owner_id = auth.uid()
    )
  );

-- Users can delete songcode for songs they have access to
CREATE POLICY "Users can delete songcode for their project songs"
  ON songcode FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM songs s
      JOIN projects p ON s.project_id = p.id
      WHERE s.id = songcode.song_id
        AND p.owner_id = auth.uid()
    )
  );
