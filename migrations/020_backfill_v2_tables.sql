-- Migration: 020_backfill_v2_tables.sql
-- Backfill songs_v2, artists_v2, song_artists_v2, library_songs, notes,
-- library_song_tags, and list_items from V1 tables.
--
-- Root cause: migration 016_data_migration.sql built a song_migration_map by
-- joining songs → songs_v2, but songs_v2 was empty at run time, so every
-- downstream INSERT produced 0 rows. This migration does the missing steps.

BEGIN;

-- ============================================================
-- 1. Populate songs_v2 (deduplicated by title fingerprint)
-- ============================================================
INSERT INTO songs_v2 (title, created_by, created_at, updated_at)
SELECT DISTINCT ON (lower(regexp_replace(immutable_unaccent(s.title), '[^a-zA-Z0-9]', '', 'g')))
  s.title,
  COALESCE(s.created_by, p.owner_id) AS created_by,
  s.created_at,
  COALESCE(s.updated_at, s.created_at) AS updated_at
FROM songs s
JOIN projects p ON s.project_id = p.id
WHERE trim(s.title) != ''
ORDER BY
  lower(regexp_replace(immutable_unaccent(s.title), '[^a-zA-Z0-9]', '', 'g')),
  s.created_at ASC;

SELECT 'songs_v2 populated' AS step, COUNT(*) AS rows FROM songs_v2;

-- ============================================================
-- 2. Populate artists_v2 (deduplicated by name fingerprint)
-- ============================================================
INSERT INTO artists_v2 (name, created_by, created_at, updated_at)
SELECT DISTINCT ON (lower(regexp_replace(immutable_unaccent(a.name), '[^a-zA-Z0-9]', '', 'g')))
  a.name,
  p.owner_id AS created_by,
  a.created_at,
  COALESCE(a.updated_at, a.created_at) AS updated_at
FROM artists a
JOIN projects p ON a.project_id = p.id
ORDER BY
  lower(regexp_replace(immutable_unaccent(a.name), '[^a-zA-Z0-9]', '', 'g')),
  a.created_at ASC;

SELECT 'artists_v2 populated' AS step, COUNT(*) AS rows FROM artists_v2;

-- ============================================================
-- 3. Build migration maps
-- ============================================================
CREATE TEMP TABLE song_migration_map AS
SELECT
  s.id  AS old_song_id,
  sv2.id AS new_song_id
FROM songs s
JOIN songs_v2 sv2
  ON sv2.fingerprint = lower(regexp_replace(immutable_unaccent(s.title), '[^a-zA-Z0-9]', '', 'g'));

CREATE TEMP TABLE artist_migration_map AS
SELECT
  a.id   AS old_artist_id,
  av2.id AS new_artist_id
FROM artists a
JOIN artists_v2 av2
  ON av2.fingerprint = lower(regexp_replace(immutable_unaccent(a.name), '[^a-zA-Z0-9]', '', 'g'));

-- ============================================================
-- 4. Populate song_artists_v2
-- After deduplication, multiple old songs can map to the same new_song_id and
-- their artists (even different ones) may share position values, violating
-- UNIQUE (song_id, position). We deduplicate to unique (song, artist) pairs
-- first, then assign fresh sequential positions with ROW_NUMBER.
-- ============================================================
INSERT INTO song_artists_v2 (song_id, artist_id, position)
SELECT
  new_song_id,
  new_artist_id,
  ROW_NUMBER() OVER (PARTITION BY new_song_id ORDER BY min_position) AS position
FROM (
  SELECT
    smm.new_song_id,
    amm.new_artist_id,
    MIN(sa.position) AS min_position
  FROM song_artists sa
  JOIN song_migration_map smm   ON sa.song_id   = smm.old_song_id
  JOIN artist_migration_map amm ON sa.artist_id  = amm.old_artist_id
  GROUP BY smm.new_song_id, amm.new_artist_id
) deduped
ON CONFLICT (song_id, artist_id) DO NOTHING;

SELECT 'song_artists_v2 populated' AS step, COUNT(*) AS rows FROM song_artists_v2;

-- ============================================================
-- 5. Populate library_songs (one entry per project + v2 song)
-- ============================================================
INSERT INTO library_songs (project_id, song_id, added_by, added_at, custom_notes)
SELECT DISTINCT ON (s.project_id, smm.new_song_id)
  s.project_id,
  smm.new_song_id,
  COALESCE(s.created_by, p.owner_id) AS added_by,
  s.created_at                        AS added_at,
  s.notes                             AS custom_notes
FROM songs s
JOIN song_migration_map smm ON s.id = smm.old_song_id
JOIN projects p ON s.project_id = p.id
ORDER BY s.project_id, smm.new_song_id, s.created_at ASC
ON CONFLICT (project_id, song_id) DO NOTHING;

SELECT 'library_songs populated' AS step, COUNT(*) AS rows FROM library_songs;

-- ============================================================
-- 6. Migrate songcode → notes
-- ============================================================
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
  ls.id                                               AS library_song_id,
  'songcode'::note_type,
  NULL                                                AS title,
  sc.songcode                                         AS content,
  COALESCE(sc.songcode_updated_by, ls.added_by)       AS created_by,
  COALESCE(sc.songcode_updated_at, sc.created_at)     AS created_at,
  COALESCE(sc.songcode_updated_by, ls.added_by)       AS updated_by,
  COALESCE(sc.songcode_updated_at, sc.created_at)     AS updated_at,
  0                                                   AS display_order
FROM songcode sc
JOIN song_migration_map smm ON sc.song_id = smm.old_song_id
JOIN library_songs ls ON ls.song_id = smm.new_song_id
WHERE sc.songcode IS NOT NULL AND sc.songcode != '';

SELECT 'notes (songcode) populated' AS step, COUNT(*) AS rows FROM notes;

-- ============================================================
-- 7. Migrate song_tags → library_song_tags
-- ============================================================
INSERT INTO library_song_tags (library_song_id, tag_id, created_at)
SELECT DISTINCT
  ls.id      AS library_song_id,
  st.tag_id,
  st.created_at
FROM song_tags st
JOIN song_migration_map smm ON st.song_id = smm.old_song_id
JOIN library_songs ls ON ls.song_id = smm.new_song_id
ON CONFLICT (library_song_id, tag_id) DO NOTHING;

SELECT 'library_song_tags populated' AS step, COUNT(*) AS rows FROM library_song_tags;

-- ============================================================
-- 8. Update list_items.library_song_id
-- PostgreSQL forbids referencing the target table inside FROM-clause JOINs,
-- so we compute the id mapping in a subquery first.
-- ============================================================
UPDATE list_items li
SET library_song_id = mapping.library_song_id
FROM (
  SELECT
    li2.id AS list_item_id,
    ls.id  AS library_song_id
  FROM list_items li2
  JOIN lists              lst ON lst.id          = li2.list_id
  JOIN songs              s   ON s.id            = li2.song_id
  JOIN song_migration_map smm ON smm.old_song_id = s.id
  JOIN library_songs      ls  ON ls.song_id      = smm.new_song_id
                              AND ls.project_id  = lst.project_id
  WHERE li2.type = 'song'
) mapping
WHERE li.id = mapping.list_item_id;

SELECT 'list_items updated' AS step,
  COUNT(*) FILTER (WHERE library_song_id IS NOT NULL) AS migrated,
  COUNT(*) FILTER (WHERE library_song_id IS NULL)     AS unmigrated
FROM list_items WHERE type = 'song';

-- ============================================================
-- 9. Update popularity scores
-- ============================================================
UPDATE songs_v2 sv2
SET popularity_score = (
  SELECT COUNT(*) FROM library_songs ls WHERE ls.song_id = sv2.id
);

COMMIT;

-- Final summary
SELECT table_name, cnt AS row_count FROM (
  VALUES
    ('songs (v1)',       (SELECT COUNT(*) FROM songs)),
    ('songs_v2',         (SELECT COUNT(*) FROM songs_v2)),
    ('artists_v2',       (SELECT COUNT(*) FROM artists_v2)),
    ('song_artists_v2',  (SELECT COUNT(*) FROM song_artists_v2)),
    ('library_songs',    (SELECT COUNT(*) FROM library_songs)),
    ('notes',            (SELECT COUNT(*) FROM notes)),
    ('library_song_tags',(SELECT COUNT(*) FROM library_song_tags))
) AS t(table_name, cnt);
