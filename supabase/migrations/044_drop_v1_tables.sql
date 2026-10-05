-- Drop the V1 song tables, superseded by the V2 catalog (migrations 011-020).
-- See docs/epics/drop-v1-tables.md.
--
-- songs        -> songs_v2 + library_songs
-- artists      -> artists_v2
-- song_artists -> song_artists_v2
-- songcode     -> notes (type 'songcode')
-- song_tags    -> library_song_tags
-- list_items.song_id -> list_items.library_song_id

-- list_items: drop the V1 reference (its FK, unique_list_song and idx_list_items_song_id go with it)
ALTER TABLE list_items DROP CONSTRAINT IF EXISTS list_item_type_check;
ALTER TABLE list_items DROP COLUMN IF EXISTS song_id;

ALTER TABLE list_items ADD CONSTRAINT list_item_type_check CHECK (
  (
    (type = 'song'::text)
    AND (library_song_id IS NOT NULL)
    AND (title IS NULL)
  )
  OR
  (
    (type = 'title'::text)
    AND (library_song_id IS NULL)
    AND (title IS NOT NULL)
  )
);

-- Keep the "a song appears once per list" guarantee that unique_list_song provided
ALTER TABLE list_items ADD CONSTRAINT unique_list_library_song UNIQUE (list_id, library_song_id);

-- V1 tables (their RLS policies and triggers are dropped with them)
DROP TABLE IF EXISTS songcode;
DROP TABLE IF EXISTS song_tags;
DROP TABLE IF EXISTS song_artists;
DROP TABLE IF EXISTS songs;
DROP TABLE IF EXISTS artists;
