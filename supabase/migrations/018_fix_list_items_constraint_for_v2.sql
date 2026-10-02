-- Fix list_items constraint to support both V1 (song_id) and V2 (library_song_id)
-- This allows adding library songs to lists in V2 architecture

-- Drop the old constraint that only allows song_id
ALTER TABLE list_items DROP CONSTRAINT IF EXISTS list_item_type_check;

-- Add new constraint that allows either song_id (V1) or library_song_id (V2)
ALTER TABLE list_items ADD CONSTRAINT list_item_type_check CHECK (
  (
    (type = 'song'::text) 
    AND (song_id IS NOT NULL OR library_song_id IS NOT NULL)
    AND (title IS NULL)
  ) 
  OR 
  (
    (type = 'title'::text) 
    AND (song_id IS NULL) 
    AND (library_song_id IS NULL)
    AND (title IS NOT NULL)
  )
);
