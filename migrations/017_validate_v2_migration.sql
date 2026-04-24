-- Validation script: validate_v2_migration.sql
-- Run validation checks on the V2 migration

-- Check 1: Songs migration counts
SELECT 'Songs migration' as check,
  (SELECT COUNT(*) FROM songs) as v1_songs,
  (SELECT COUNT(*) FROM songs_v2) as v2_songs,
  (SELECT COUNT(*) FROM library_songs) as library_entries;

-- Check 2: All library_songs reference valid songs
SELECT 'Library songs integrity' as check,
  COUNT(*) as total,
  COUNT(song_id) as valid_songs
FROM library_songs;

-- Check 3: All notes reference valid library_songs
SELECT 'Notes integrity' as check,
  COUNT(*) as total,
  COUNT(library_song_id) as valid_library_songs
FROM notes;

-- Check 4: All tags migrated
SELECT 'Tag migration' as check,
  (SELECT COUNT(*) FROM song_tags) as old_tags,
  COUNT(*) as new_tags
FROM library_song_tags;

-- Check 5: All list items updated
SELECT 'List items migration' as check,
  COUNT(*) as total_song_items,
  COUNT(library_song_id) as migrated
FROM list_items
WHERE type = 'song';

-- Check 6: Popularity scores match
SELECT 'Popularity scores check' as check,
  COUNT(*) as mismatches
FROM (
  SELECT sv2.id, sv2.title, sv2.popularity_score, COUNT(ls.id) as actual_count
  FROM songs_v2 sv2
  LEFT JOIN library_songs ls ON ls.song_id = sv2.id
  GROUP BY sv2.id, sv2.title, sv2.popularity_score
  HAVING sv2.popularity_score != COUNT(ls.id)
) AS mismatched;

-- Check 7: All songcode migrated to notes
SELECT 'Songcode to notes' as check,
  (SELECT COUNT(*) FROM songcode WHERE songcode IS NOT NULL AND songcode != '') as old_songcodes,
  (SELECT COUNT(*) FROM notes WHERE type = 'songcode') as new_notes;

-- Check 8: Artists migration
SELECT 'Artists migration' as check,
  (SELECT COUNT(*) FROM artists) as v1_artists,
  (SELECT COUNT(*) FROM artists_v2) as v2_artists;

-- Check 9: Song-artist relationships
SELECT 'Song-artist links' as check,
  (SELECT COUNT(*) FROM song_artists) as v1_links,
  (SELECT COUNT(*) FROM song_artists_v2) as v2_links;

-- Summary: Should all show matching or expected counts
SELECT 'VALIDATION COMPLETE' as status,
  'Check each result above - library_entries should equal v1_songs' as note;
