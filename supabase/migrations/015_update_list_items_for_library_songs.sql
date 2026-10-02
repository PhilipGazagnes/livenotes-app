-- Migration: 015_update_list_items_for_library_songs.sql
-- Add new columns to list_items for V2 architecture

-- Add new columns to list_items
ALTER TABLE list_items 
  ADD COLUMN IF NOT EXISTS library_song_id UUID REFERENCES library_songs(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS list_annotations TEXT;

-- Add index on new columns
CREATE INDEX IF NOT EXISTS idx_list_items_library_song ON list_items(library_song_id);
CREATE INDEX IF NOT EXISTS idx_list_items_note ON list_items(note_id) WHERE note_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN list_items.library_song_id IS 'V2: Reference to library song';
COMMENT ON COLUMN list_items.note_id IS 'Optional: specific note/arrangement for this list';
COMMENT ON COLUMN list_items.list_annotations IS 'Context-specific notes (e.g., "play in G")';
