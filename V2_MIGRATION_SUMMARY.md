# V2 Migration Summary

## Overview

Version 2 of Livenotes introduces a **global song catalog** architecture with a **multi-note system**, replacing the previous project-scoped songs with a single songcode field. The new system supports unlimited notes per song, including multiple notes of the same type (e.g., multiple songcode notes for different arrangements/versions).

## Architecture Changes

### Before (V1)
```
User → Project → Songs (project-scoped)
                   ├─ songcode (single text field)
                   ├─ song_tags
                   └─ list_items
```

### After (V2)
```
User → Project → Library Songs ──→ Global Songs ──→ Artists
                   ├─ notes (multi-note system)         ↑
                   ├─ library_song_tags          song_artists_v2
                   └─ list_items (updated)
```

## Key Concepts

### 1. Global Song Catalog

**Songs (songs_v2)** are now global entities shared across all users:
- Each unique song exists once in the database
- Identified by **fingerprint** (normalized title)
- Tracks **popularity** (how many users have added it)
- Cannot be deleted (only removed from personal library)

**Benefits:**
- No duplicate songs across users
- Accurate popularity metrics
- Potential for community features (most popular songs, etc.)
- Better data normalization

### 2. Library Songs

**Library Songs (library_songs)** are the junction between users and global songs:
- Each user has their own library of songs
- Can customize title/notes per user
- Scoped to project (future: multi-project support)
- Can be removed without affecting global song

**Benefits:**
- Personalized song metadata
- Multiple users can add same song with different customizations
- Clear ownership and privacy (RLS)

### 3. Multi-Note System

**Notes (notes table)** replace the single `songcode` field:
- Each library song can have **unlimited notes**
- **Multiple notes of the same type** are allowed (e.g., multiple songcode notes for different arrangements, versions, etc.)
- 10 note types supported:
  - `songcode` - SongCode notation (multiple allowed per song)
  - `plain_text` - General notes
  - `lyrics` - Song lyrics
  - `chords` - Chord progressions
  - `tablature` - Guitar/bass tabs
  - `youtube` - YouTube video URLs
  - `image` - Image URLs
  - `video` - Video URLs
  - `audio` - Audio URLs
  - `looper_notes` - Looper pedal settings

**Benefits:**
- Organize different types of information separately
- Attach multiple resources to one song
- Reorder notes by drag-and-drop (future)
- Share notes independently (future)

### 4. Fingerprint Deduplication

Songs are deduplicated using a **fingerprint** algorithm:
```sql
fingerprint = lower(regexp_replace(immutable_unaccent(title), '[^a-zA-Z0-9]', '', 'g'))
```

Examples:
- "Hotel California" → `hotelcalifornia`
- "HOTEL CALIFORNIA" → `hotelcalifornia` (same)
- "Hôtel California" → `hotelcalifornia` (same)
- "Hotel California!" → `hotelcalifornia` (same)

**All are treated as the same song.**

## Database Schema

### New Tables

#### songs_v2
```sql
id, title, fingerprint (generated), popularity, created_by, created_at
```
- Global song catalog
- Fingerprint generated automatically
- Public read, authenticated write (RLS)

#### artists_v2
```sql
id, name, fingerprint (generated), created_by, created_at
```
- Global artist catalog
- Same fingerprint logic as songs

#### song_artists_v2
```sql
song_id, artist_id, position
```
- Many-to-many relationship
- `position` for ordering (e.g., "Artist 1 feat. Artist 2")

#### library_songs
```sql
id, project_id, song_id (FK to songs_v2), custom_title, custom_notes, added_by, added_at
```
- User's personal library (junction table)
- References global song
- Per-user customizations

#### notes
```sql
id, library_song_id (FK), type (enum), title, content, display_order, is_public, is_shareable, share_token
```
- Multi-note system
- Replaces single songcode field
- Future: note sharing

#### library_song_tags
```sql
library_song_id, tag_id
```
- Tags now reference library songs instead of songs
- Preserves existing tag functionality

### Updated Tables

#### list_items
```sql
id, list_id, library_song_id (new), song_id (deprecated), item_type, display_order
```
- Added `library_song_id` column
- `song_id` kept for backward compatibility (30 days)

## Migration Process

### Phase 1: Database Migration (Week 1)

1. **Create V2 tables** (migrations 011-015)
   - songs_v2, artists_v2, song_artists_v2
   - library_songs
   - notes
   - library_song_tags (junction)
   - list_items updates

2. **Migrate data** (migration 016)
   - Extract unique songs → songs_v2 (fingerprint deduplication)
   - Extract unique artists → artists_v2
   - Create library_songs for each user-song mapping
   - Convert songcode → notes with type 'songcode'
   - Migrate song_tags → library_song_tags
   - Update list_items with library_song_id

3. **Validate migration** (migration 017)
   - SQL queries to verify counts
   - Check for orphaned records
   - Verify deduplication worked correctly

4. **Fix fingerprint generation** (backported to migration 011)
   - Created `immutable_unaccent()` wrapper function
   - Fixed regex to handle uppercase before lower()

### Phase 2: Application Code (Week 2)

1. **TypeScript types** (database.ts)
   - SongV2, ArtistV2, LibrarySong, Note
   - Extended types with relations (WithArtists, WithDetails)

2. **Pinia stores**
   - `globalSongs` - search/create global songs and artists
   - `library` - manage user's library (CRUD)
   - `notes` - manage notes for library songs
   - Updated `tags` and `lists` for V2 compatibility

3. **Constants**
   - NOTE_TYPES enum
   - Validation constants (max lengths)
   - Success/error messages for V2 operations

### Phase 3: UI Components (Week 3)

1. **Song search & creation**
   - SongSearchModal - search catalog, add to library
   - ArtistSelector - multi-artist autocomplete
   - Fingerprint-based duplicate detection

2. **Notes management**
   - NotesSection - display notes grouped by type
   - NoteCard - type-specific rendering
   - NoteEditor - create/edit notes with contextual inputs

3. **Library page**
   - LibraryPage - replacement for AllSongsPage
   - Displays library_songs with nested details
   - Integrated note display inline
   - Search + tag filtering

4. **Modal updates**
   - ManageListsModal - uses library_song_id
   - Tag modals remain generic (work with both V1/V2)

### Phase 4: Testing & Polish (Week 4)

1. **Loading states**
   - Added LoadingSpinner to LibraryPage
   - Added LoadingSpinner to NotesSection
   - Button loading states in modals

2. **Navigation updates**
   - Updated HamburgerMenu to "My Library"
   - Set LibraryPage as root route
   - Added ROUTES.LIBRARY constant

3. **Testing checklist**
   - Comprehensive V2 feature testing
   - Data integrity verification
   - Performance benchmarks
   - Regression testing for V1 compatibility

## User-Facing Changes

### New Features

1. **Global Song Search**
   - Search all songs ever added by any user
   - See popularity scores
   - No more duplicate song entries

2. **Multi-Note System**
   - Add multiple notes to one song
   - Different note types for different purposes
   - Organized by type (songcode, lyrics, chords, etc.)

3. **Better Artist Management**
   - Multi-artist support (features, collaborations)
   - Artist autocomplete
   - Create artists on-the-fly

4. **Personal Library**
   - Clear distinction between global songs and your library
   - Customize song titles/notes for your use
   - Remove songs without affecting others

### Changed Behavior

1. **Song Creation**
   - Creating a song checks for duplicates first
   - If song exists, adds to your library (doesn't create duplicate)
   - Adds your selected artists to the song if not already associated

2. **Song Deletion**
   - Removing from library != deleting the song
   - Song remains in global catalog for others
   - Your notes are deleted (tied to library entry)

3. **Tags & Lists**
   - Tags now apply to your library entry, not the global song
   - Each user can tag the same song differently
   - Lists work the same but reference library entries

## API Changes (for developers)

### New Store Methods

**globalSongs store:**
- `searchSongs(query)` - search global catalog
- `createSong(title, artistIds)` - create/find global song
- `searchArtists(query)` - search artists
- `createArtist(name)` - create/find artist
- `getOrCreateArtist(name)` - helper for artist management

**library store:**
- `loadLibrary()` - fetch user's library
- `addToLibrary(songId, customTitle?, customNotes?)` - add song
- `removeFromLibrary(librarySongId)` - remove song
- `updateLibrarySong(id, updates)` - update custom fields
- `filteredLibrarySongs` - computed, filters by search/tags

**notes store:**
- `loadNotes(librarySongId)` - fetch notes for song
- `createNote(librarySongId, type, content, title?)` - create note
- `updateNote(noteId, updates)` - update note
- `deleteNote(noteId, librarySongId)` - delete note
- `notesByType` - computed, groups notes by type

**Updated methods:**
- `tags.tagLibrarySong()` - uses library_song_id
- `tags.bulkAssignTags()` - works with library_songs
- `lists.addLibrarySongToList()` - uses library_song_id
- `lists.fetchListById()` - joins with library_songs

### Deprecated Methods (V1)

These still work but will be removed after V1 deprecation:
- `songs.createSong()` - use `globalSongs.createSong()` + `library.addToLibrary()`
- `songs.updateSong()` - use `library.updateLibrarySong()` for custom fields
- `songs.deleteSong()` - use `library.removeFromLibrary()`
- `tags.tagSong()` - use `tags.tagLibrarySong()`
- `lists.addSongToList()` - use `lists.addLibrarySongToList()`

## Rollback Plan

### If issues found within 30 days:

1. **Revert router** to use AllSongsPage
2. **Revert HamburgerMenu** to show "All Songs"
3. **Hide V2 UI** (LibraryPage, SongSearchModal, etc.)
4. **V1 data intact** - no changes to V1 tables during migration
5. **Manual data fixes** if needed based on error logs

### After 30 days (if V2 successful):

1. **Drop V1 tables**: songs, song_tags, songcode (deprecated columns)
2. **Remove V1 code**: AllSongsPage, SongNewPage, SongEditPage
3. **Remove V1 routes**: ROUTES.SONG_NEW, etc.
4. **Remove backward compatibility** columns (song_id in list_items)
5. **Update documentation** to remove V1 references

## Performance Considerations

### Optimizations Made

1. **Debounced search** (300ms) to reduce API calls
2. **Fingerprint indexing** for fast duplicate detection
3. **Pagination ready** (not implemented yet, but schema supports)
4. **Nested selects** minimize round-trips (join with artists, tags, notes)
5. **RLS policies** use indexes on user_id/project_id

### Future Optimizations

1. **Virtual scrolling** for large libraries (1000+ songs)
2. **Lazy load** notes (only when song expanded)
3. **Search result caching** (client-side)
4. **Full-text search** (PostgreSQL tsvector) for better search
5. **CDN for images** (note attachments)

## Security

### RLS Policies

All V2 tables have Row-Level Security enabled:

- **songs_v2**: Public read, authenticated write
- **artists_v2**: Public read, authenticated write
- **library_songs**: Only owner can read/write
- **notes**: Only library song owner can read/write
- **library_song_tags**: Only library song owner can manage

### Data Privacy

- **Global songs** are visible to all (necessary for search)
- **Library songs** are private (which songs you have)
- **Notes** are private (your personal notes)
- **Tags** are private (your tags on your library songs)
- **Lists** are private (your custom lists)

Future: Note sharing with explicit opt-in (is_shareable, share_token)

## Next Steps

### Immediate (Post-V2 Launch)

1. Monitor production for errors
2. Gather user feedback
3. Fix any critical bugs
4. Update documentation based on usage

### Short-term (1-3 months)

1. Update ListDetailPage for V2 (currently still V1)
2. Add note reordering (drag-and-drop)
3. Improve search (full-text, filters)
4. Add song editing (inline, not separate page)

### Long-term (3-6 months)

1. Multi-project support (Phase 3)
2. Note sharing between users
3. Collaborative lists
4. Advanced songcode editor
5. Mobile app optimization
6. Offline support integration

## Support

### Troubleshooting

**Issue: Song not found in search**
- May be using different spelling/capitalization
- Try searching by artist
- Song might not exist yet - create it

**Issue: Can't add song to library**
- May already be in library
- Check "My Library" page
- Error will show if duplicate

**Issue: Notes not saving**
- Check character limits (title: 100, content: 100KB)
- Ensure both title and content filled
- Check network connection

**Issue: Tags not showing**
- Tags are tied to library entries, not global songs
- Add song to library first, then tag
- Refresh page if tags missing

### Getting Help

- Check V2_TESTING_CHECKLIST.md for feature verification
- Review ARCHITECTURE.md for system design
- Check browser console for errors
- Report bugs with steps to reproduce

## Conclusion

V2 represents a significant architectural improvement, enabling:
- Better data quality (deduplication)
- More flexibility (multi-note system)
- Enhanced user experience (global search, personal customization)
- Foundation for future features (sharing, collaboration)

The migration preserves all V1 data while providing a modern, scalable foundation for Livenotes going forward.
