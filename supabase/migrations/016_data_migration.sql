-- Combined Data Migration: 018-022
-- Run remaining data migrations in a single session
-- (016 and 017 already completed)

BEGIN;

-- =============================================================================
-- Recreate TEMP tables from already-migrated data
-- =============================================================================

CREATE TEMP TABLE song_migration_map (
  old_song_id UUID,
  new_song_id UUID,
  old_fingerprint TEXT
);

INSERT INTO song_migration_map (old_song_id, new_song_id, old_fingerprint)
SELECT
  s.id as old_song_id,
  sv2.id as new_song_id,
  lower(regexp_replace(s.title, '[^a-z0-9]', '', 'g')) as old_fingerprint
FROM songs s
JOIN songs_v2 sv2 ON sv2.fingerprint = lower(regexp_replace(s.title, '[^a-z0-9]', '', 'g'));

CREATE TEMP TABLE artist_migration_map (
  old_artist_id UUID,
  new_artist_id UUID,
  old_fingerprint TEXT
);

INSERT INTO artist_migration_map (old_artist_id, new_artist_id, old_fingerprint)
SELECT
  a.id as old_artist_id,
  av2.id as new_artist_id,
  lower(regexp_replace(a.name, '[^a-z0-9]', '', 'g')) as old_fingerprint
FROM artists a
JOIN artists_v2 av2 ON av2.fingerprint = lower(regexp_replace(a.name, '[^a-z0-9]', '', 'g'));

SELECT 'TEMP tables recreated' as status;

-- =============================================================================
-- 018: Migrate Song-Artist Relationships
-- =============================================================================

INSERT INTO song_artists_v2 (song_id, artist_id, position)
SELECT DISTINCT
  smm.new_song_id,
  amm.new_artist_id,
  sa.position
FROM song_artists sa
JOIN song_migration_map smm ON sa.song_id = smm.old_song_id
JOIN artist_migration_map amm ON sa.artist_id = amm.old_artist_id
ON CONFLICT (song_id, artist_id) DO NOTHING;

-- Verify song-artist links
SELECT 'Song-Artist Links' as step,
  COUNT(*) as old_links,
  (SELECT COUNT(*) FROM song_artists_v2) as new_links
FROM song_artists;

-- =============================================================================
-- 019: Create Library Songs
-- =============================================================================

INSERT INTO library_songs (project_id, song_id, added_by, added_at, custom_notes)
SELECT DISTINCT ON (s.project_id, smm.new_song_id)
  s.project_id,
  smm.new_song_id,
  COALESCE(s.created_by, p.owner_id),
  MIN(s.created_at) as added_at,
  (array_agg(s.notes ORDER BY s.created_at))[1] as custom_notes
FROM songs s
JOIN song_migration_map smm ON s.id = smm.old_song_id
JOIN projects p ON s.project_id = p.id
GROUP BY s.project_id, smm.new_song_id, s.created_by, p.owner_id
ON CONFLICT (project_id, song_id) DO NOTHING;

-- Update popularity scores
UPDATE songs_v2 sv2
SET popularity_score = (
  SELECT COUNT(*) FROM library_songs ls WHERE ls.song_id = sv2.id
);

-- Verify library songs
SELECT 'Library Songs' as step,
  COUNT(*) as v1_songs,
  (SELECT COUNT(*) FROM library_songs) as library_songs,
  (SELECT SUM(popularity_score) FROM songs_v2) as total_popularity
FROM songs;

-- =============================================================================
-- 020: Migrate SongCode to Notes
-- =============================================================================

INSERT INTO notes (
  library_song_id,
  type,
  title,
  content,
  created_by,
  created_at,
  updated_by,
  updated_at,
  display_order
)
SELECT
  ls.id as library_song_id,
  'songcode'::note_type,
  NULL as title,
  COALESCE(sc.songcode, '') as content,
  COALESCE(sc.songcode_updated_by, ls.added_by),
  COALESCE(sc.songcode_updated_at, sc.created_at),
  COALESCE(sc.songcode_updated_by, ls.added_by),
  COALESCE(sc.songcode_updated_at, sc.created_at),
  0 as display_order
FROM songcode sc
JOIN song_migration_map smm ON sc.song_id = smm.old_song_id
JOIN library_songs ls ON ls.song_id = smm.new_song_id
WHERE sc.songcode IS NOT NULL AND sc.songcode != '';

-- Verify songcode migration
SELECT 'SongCode Migration' as step,
  (SELECT COUNT(*) FROM songcode WHERE songcode IS NOT NULL) as old_songcodes,
  (SELECT COUNT(*) FROM notes WHERE type = 'songcode') as new_songcode_notes;

-- =============================================================================
-- 021: Migrate Tags to Library Songs
-- =============================================================================

INSERT INTO library_song_tags (library_song_id, tag_id, created_at)
SELECT DISTINCT
  ls.id as library_song_id,
  st.tag_id,
  st.created_at
FROM song_tags st
JOIN song_migration_map smm ON st.song_id = smm.old_song_id
JOIN library_songs ls ON ls.song_id = smm.new_song_id;

-- Verify tags migration
SELECT 'Tags Migration' as step,
  COUNT(*) as old_song_tags,
  (SELECT COUNT(*) FROM library_song_tags) as new_library_song_tags
FROM song_tags;

-- =============================================================================
-- 022: Update List Items
-- =============================================================================

UPDATE list_items li
SET library_song_id = ls.id
FROM songs s
JOIN song_migration_map smm ON s.id = smm.old_song_id
JOIN library_songs ls ON ls.song_id = smm.new_song_id
WHERE li.song_id = s.id
  AND li.type = 'song'
  AND s.project_id = (SELECT project_id FROM lists WHERE id = li.list_id);

-- Verify list items migration
SELECT 'List Items Migration' as step,
  COUNT(*) as total_song_items,
  COUNT(library_song_id) as migrated_items,
  COUNT(*) - COUNT(library_song_id) as missing
FROM list_items
WHERE type = 'song';

COMMIT;

-- Final summary
SELECT 'MIGRATION COMPLETE - Run migration 023 to validate' as status;
