# V2 Testing Checklist

## Prerequisites
- [ ] Run migrations 011-017 in development database
- [ ] Verify data migration completed successfully
- [ ] Check that all V2 tables exist with proper RLS policies

## Global Songs Catalog

### Song Search
- [ ] Search finds songs by title (case-insensitive)
- [ ] Search finds songs by artist name
- [ ] Search shows popularity score for each song
- [ ] Search results are debounced (300ms delay)
- [ ] Empty search results show appropriate message
- [ ] Fingerprint duplicate detection works (same title = same song)

### Song Creation
- [ ] Can create new song with single artist
- [ ] Can create new song with multiple artists
- [ ] Can create new artist inline during song creation
- [ ] Duplicate song detection prevents creating exact matches
- [ ] Created songs appear in search results immediately
- [ ] Fingerprint generation handles uppercase correctly
- [ ] Fingerprint generation handles accented characters correctly

### Artist Management
- [ ] Artist autocomplete shows matching artists
- [ ] Can create new artists from ArtistSelector
- [ ] Exact match detection prevents duplicate artists
- [ ] Selected artists display as removable chips
- [ ] Artist search is debounced

## Library Management

### Adding Songs to Library
- [ ] Can add song from search modal to library
- [ ] Song appears in library immediately after adding
- [ ] Adding song increments popularity count
- [ ] Cannot add same song to library twice
- [ ] Custom title and notes can be added during library add
- [ ] Library count updates correctly

### Library Display
- [ ] Library page shows all user's songs
- [ ] Songs display with correct title (custom or original)
- [ ] Artists display correctly for each song
- [ ] Search filters library songs by title
- [ ] Search filters library songs by artist
- [ ] Tag filtering works (AND logic - all selected tags)
- [ ] Combined search + tag filtering works
- [ ] Clearing filters shows all songs again

### Removing from Library
- [ ] Can remove song from library
- [ ] Confirmation dialog shows with note deletion warning
- [ ] All notes for song are deleted when removed
- [ ] Tags are preserved for song_v2 (only library_song_tags removed)
- [ ] Library count decrements correctly

## Notes System

### Notes Display
- [ ] Notes grouped by type (songcode, lyrics, chords, etc.)
- [ ] Note count shown for each type
- [ ] Empty state shows when no notes exist
- [ ] Notes load on component mount
- [ ] Loading spinner shows while notes load

### Note Creation
- [ ] Can select note type from menu
- [ ] Title and content required for all types
- [ ] URL input shown for media types (youtube, image, video, audio)
- [ ] Monospace textarea shown for formatted types (songcode, tablature)
- [ ] Normal textarea shown for text types
- [ ] Character count shown for title and content
- [ ] Cannot create note with empty title/content
- [ ] New note appears immediately after creation
- [ ] Display order calculated correctly

### Note Editing
- [ ] Can edit existing note title
- [ ] Can edit existing note content
- [ ] Cannot change note type after creation
- [ ] Updated note shows changes immediately
- [ ] Character limits enforced

### Note Deletion
- [ ] Confirmation dialog shows before deletion
- [ ] Note removed from list immediately after deletion
- [ ] Display order remains correct after deletion

### Note Rendering
- [ ] SongCode notes show in monospace with preview
- [ ] Tablature notes show in monospace with preview
- [ ] URL-based notes show clickable link
- [ ] Text notes show preview with ellipsis (200 chars)
- [ ] Long formatted notes truncated to 10 lines with "..."
- [ ] Relative timestamps show correctly (just now, 5m ago, 3h ago, 2d ago)

## Tags & Library Songs

### Tag Assignment
- [ ] Can assign tags to library songs
- [ ] Tag assignment creates library_song_tags entries
- [ ] Tags display on library song cards
- [ ] Bulk tag assignment works for multiple songs
- [ ] Cannot assign duplicate tags to same song
- [ ] Tag assignment shows success toast

### Tag Removal
- [ ] Can remove tags from library songs
- [ ] Tag removal deletes library_song_tags entries
- [ ] Tags removed from display immediately
- [ ] Bulk tag removal works for multiple songs
- [ ] Tag removal shows success toast

### Tag Filtering
- [ ] Can filter library by selected tags
- [ ] Tag filter uses AND logic (song must have all tags)
- [ ] Tag filter count shows correctly
- [ ] Can clear tag filters
- [ ] Filter modal shows all available tags

## Lists & Library Songs

### List Management
- [ ] ManageListsModal uses library_song_id
- [ ] Can add library songs to lists
- [ ] Can remove library songs from lists
- [ ] Can create new list from modal
- [ ] Lists show correct song count
- [ ] Selected lists highlighted in modal

### Bulk List Operations
- [ ] Can add multiple library songs to lists
- [ ] Bulk add shows success message with count
- [ ] BulkAddToListsModal allows creating new lists
- [ ] Cannot add same song to list twice

### List Detail Page
- [ ] **TODO**: Update to use library_songs instead of songs (V1)
- [ ] **TODO**: Display library song custom titles
- [ ] **TODO**: Update drag-and-drop for library songs

## UI/UX Polish

### Loading States
- [ ] LibraryPage shows spinner while loading
- [ ] NotesSection shows spinner while loading notes
- [ ] SongSearchModal shows loading during search
- [ ] Button states show "Creating..." during operations
- [ ] Disabled states prevent double-submission

### Error Handling
- [ ] Network errors show user-friendly messages
- [ ] Validation errors show inline feedback
- [ ] Duplicate detection errors show clearly
- [ ] Failed operations show error toast
- [ ] Error toasts auto-dismiss after delay

### Navigation
- [ ] HamburgerMenu shows "My Library" instead of "All Songs"
- [ ] Library is default/home route (/)
- [ ] Navigation shows loading overlay on route change
- [ ] Selection mode exits on navigation
- [ ] Back button works correctly

### Responsiveness
- [ ] Library page works on mobile
- [ ] Song search modal works on mobile
- [ ] Note editor modal works on mobile
- [ ] Tag/list modals work on mobile
- [ ] Touch interactions work (tap, scroll)

## Data Integrity

### Fingerprint Deduplication
- [ ] Same title creates single global not song (different casing)
- [ ] Same title with different accents creates single song
- [ ] Special characters removed from fingerprint
- [ ] Multiple users can add same global song to their library
- [ ] Each library entry is unique per user-song combination

### Referential Integrity
- [ ] Cannot create note without valid library_song_id
- [ ] Deleting library song cascades to notes
- [ ] Deleting library song cascades to library_song_tags
- [ ] Song deletion does NOT delete from song_v2 (global catalog)
- [ ] Artist associations preserved in song_artists_v2

### RLS Policies
- [ ] Users can only see their own library songs
- [ ] Users can only see their own notes
- [ ] Users can see all global songs (songs_v2)
- [ ] Users can see all global artists (artists_v2)
- [ ] Users cannot modify other users' data

## Performance

### Query Performance
- [ ] Library load is reasonably fast (< 1s for 1000 songs)
- [ ] Search results return quickly (< 500ms)
- [ ] Tag filtering is instant
- [ ] Note loading doesn't block UI

### Caching & State
- [ ] Search results cached during modal session
- [ ] Library songs cached in Pinia store
- [ ] Notes cached per library song
- [ ] Store state persists during navigation
- [ ] Stale data refreshed on focus

## Migration Verification

### Data Migration
- [ ] All V1 songs migrated to library_songs
- [ ] All V1 songs created corresponding songs_v2 entries
- [ ] All V1 artists migrated to artists_v2
- [ ] All V1 songcode converted to notes
- [ ] All V1 song_tags converted to library_song_tags
- [ ] All V1 list_items updated with library_song_id

### Validation Queries
- [ ] Run 017_validate_v2_migration.sql queries
- [ ] All counts match or have documented deduplication
- [ ] No orphaned library_songs (missing song_v2)
- [ ] No orphaned notes (missing library_song)
- [ ] No duplicate songs_v2 (same fingerprint)

## Regression Testing (V1 Compatibility)

### Still Using V1
- [ ] AllSongsPage still works (legacy)
- [ ] SongNewPage still works (legacy)
- [ ] SongEditPage still works (legacy)
- [ ] List operations still work (needs V2 update)
- [ ] Tag operations still work from old pages

### Eventual V1 Deprecation
- [ ] Plan to hide/remove AllSongsPage route (replaced by LibraryPage)
- [ ] Plan to remove SongNewPage (replaced by SongSearchModal)
- [ ] Plan to remove SongEditPage (replaced by inline editing)
- [ ] Plan to remove V1 tables after 30-day safety period

## Production Readiness

### Code Quality
- [ ] No TypeScript errors
- [ ] No console.error in production
- [ ] No hardcoded test data
- [ ] All TODO comments addressed or documented
- [ ] Code follows existing patterns

### Documentation
- [ ] ARCHITECTURE.md updated for V2
- [ ] Migration plan documented
- [ ] Rollback procedure documented
- [ ] API changes documented for team

### Deployment
- [ ] Run migrations in production database
- [ ] Verify RLS policies active
- [ ] Monitor error logs after deployment
- [ ] Have rollback plan ready
- [ ] Communicate changes to users

## Known Issues / Future Enhancements

### Not in V2 Scope
- [ ] Multi-project support (Phase 3)
- [ ] Note sharing between users
- [ ] Note versioning/history
- [ ] Advanced songcode editor with syntax highlighting
- [ ] Offline support (separate implementation plan)
- [ ] Real-time collaboration
- [ ] Export/import library

### Bugs to Fix
- [ ] (None identified yet - add during testing)

## Sign-off

- [ ] Developer testing complete
- [ ] QA testing complete (if applicable)
- [ ] Product owner approval
- [ ] Ready for production deployment
