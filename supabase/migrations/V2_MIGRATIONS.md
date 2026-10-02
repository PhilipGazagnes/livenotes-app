# V2 Migration Files

## Summary
Migrations 011-017 implement the V2 architecture (global song catalog + multi-note system).

## Migration Order

### Schema Migrations (011-015)
Run these to create the V2 tables:

1. **011_create_v2_songs_table.sql** - Create songs_v2, artists_v2, song_artists_v2 tables
2. **012_create_library_songs.sql** - Create library_songs junction table
3. **013_create_notes_table.sql** - Create note_type enum and notes table
4. **014_update_tags_for_library_songs.sql** - Create library_song_tags table
5. **015_update_list_items_for_library_songs.sql** - Add V2 columns to list_items

### Data Migration (016)
Run this single script to migrate all V1 data to V2:

6. **016_data_migration.sql** - Combined migration script that:
   - Migrates songs → songs_v2 (with deduplication)
   - Migrates artists → artists_v2 (with deduplication)
   - Migrates song-artist relationships
   - Creates library_songs entries
   - Migrates songcode → notes
   - Migrates tags to library_song_tags
   - Updates list_items references

### Validation (017)
Run this to verify the migration:

7. **017_validate_v2_migration.sql** - Validation checks

## Results (Dev Database)
- ✅ 469 V1 songs → 468 V2 songs (1 duplicate merged)
- ✅ 306 V1 artists → 302 V2 artists (4 duplicates merged)
- ✅ Fingerprints correctly handle uppercase letters and accents (using `immutable_unaccent()`)
- ✅ All data migrated successfully
- ✅ All validation checks passed

## Next Steps
Week 2: Update application code to use V2 tables
