-- Migration: 013_create_notes_table.sql
-- Multi-note system for library songs

-- Note types enum
CREATE TYPE note_type AS ENUM (
  'songcode',
  'plain_text',
  'youtube',
  'image',
  'video',
  'audio',
  'tablature',
  'looper_notes',
  'lyrics',
  'chords'
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_song_id UUID NOT NULL REFERENCES library_songs(id) ON DELETE CASCADE,
  
  -- Type and content
  type note_type NOT NULL,
  title TEXT, -- optional ("Acoustic arrangement", "Sunday version")
  content TEXT, -- can be plain text or JSON string
  
  -- Tracking
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Organization
  display_order INTEGER DEFAULT 0,
  
  -- Sharing (Phase 2)
  is_public BOOLEAN DEFAULT false,
  is_shareable BOOLEAN DEFAULT true,
  share_token TEXT UNIQUE,
  
  -- Constraints
  CHECK (length(trim(COALESCE(title, ''))) <= 100)
);

-- Indexes
CREATE INDEX idx_notes_library_song ON notes(library_song_id);
CREATE INDEX idx_notes_type ON notes(type);
CREATE INDEX idx_notes_created_by ON notes(created_by);
CREATE INDEX idx_notes_share_token ON notes(share_token) WHERE share_token IS NOT NULL;

-- Full-text search on content
CREATE INDEX idx_notes_content_fts ON notes USING gin(to_tsvector('english', content));

-- Comments
COMMENT ON TABLE notes IS 'Multi-note system - various content types per library song';
COMMENT ON COLUMN notes.content IS 'Type-specific content (text or JSON string)';
COMMENT ON COLUMN notes.display_order IS 'User-defined ordering within note type';

-- RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Users can view notes for their library songs
CREATE POLICY "Users can view notes for their library"
  ON notes FOR SELECT
  USING (
    library_song_id IN (
      SELECT ls.id FROM library_songs ls
      JOIN projects p ON ls.project_id = p.id
      WHERE p.owner_id = auth.uid()
    )
    OR is_public = true
  );

-- Users can create notes
CREATE POLICY "Users can create notes"
  ON notes FOR INSERT
  WITH CHECK (
    library_song_id IN (
      SELECT ls.id FROM library_songs ls
      JOIN projects p ON ls.project_id = p.id
      WHERE p.owner_id = auth.uid()
    )
    AND created_by = auth.uid()
    AND updated_by = auth.uid()
  );

-- Users can update their notes
CREATE POLICY "Users can update notes"
  ON notes FOR UPDATE
  USING (
    library_song_id IN (
      SELECT ls.id FROM library_songs ls
      JOIN projects p ON ls.project_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  )
  WITH CHECK (updated_by = auth.uid());

-- Users can delete their notes
CREATE POLICY "Users can delete notes"
  ON notes FOR DELETE
  USING (
    library_song_id IN (
      SELECT ls.id FROM library_songs ls
      JOIN projects p ON ls.project_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );
