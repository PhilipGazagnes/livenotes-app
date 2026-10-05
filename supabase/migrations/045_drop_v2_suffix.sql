-- Drop the _v2 suffix now that the V1 tables are gone (044_drop_v1_tables.sql).
-- See docs/epics/drop-v1-tables.md.
--
-- songs_v2        -> songs
-- artists_v2      -> artists
-- song_artists_v2 -> song_artists
--
-- RLS policies, FKs and grants follow the tables. No functions or views reference the old names.
-- The FK hint used by the app (library_songs_song_id_fkey) is unchanged.

ALTER TABLE songs_v2 RENAME TO songs;
ALTER TABLE artists_v2 RENAME TO artists;
ALTER TABLE song_artists_v2 RENAME TO song_artists;

-- Strip _v2 from constraint and index names (renaming a pkey/unique constraint renames its index too)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.conrelid::regclass AS tbl, c.conname
    FROM pg_constraint c
    WHERE c.conrelid IN ('public.songs'::regclass, 'public.artists'::regclass, 'public.song_artists'::regclass)
      AND c.conname LIKE '%\_v2%'
  LOOP
    EXECUTE format('ALTER TABLE %s RENAME CONSTRAINT %I TO %I', r.tbl, r.conname, replace(r.conname, '_v2', ''));
  END LOOP;

  FOR r IN
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename IN ('songs', 'artists', 'song_artists')
      AND indexname LIKE '%\_v2%'
  LOOP
    EXECUTE format('ALTER INDEX public.%I RENAME TO %I', r.indexname, replace(r.indexname, '_v2', ''));
  END LOOP;
END $$;
