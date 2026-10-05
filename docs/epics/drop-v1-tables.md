# Epic: Drop the V1 song tables

**Branch:** `chore/drop-v1-tables` (from `feat/monorepo-offline`)
**Status:** Stories 1–3 and 5 done on dev · Story 4 (prod) pending

## Context

The V2 architecture (migrations 011–020, see `supabase/migrations/V2_MIGRATIONS.md`) introduced a global song
catalog (`songs_v2`, `artists_v2`, `song_artists_v2`) plus `library_songs`, `library_song_tags` and `notes`.
The V1 tables were kept as a safety net during the switch. The switch is complete: in prod, V1 has received
no new rows since April 2026, while V2 is written to daily.

Audit (2026-10-05):

| V1 object | Prod rows | Last insert | Replaced by |
|---|---|---|---|
| `songs` | 491 | 2026-04-23 | `songs_v2` + `library_songs` |
| `artists` | 306 | 2026-04-03 | `artists_v2` |
| `song_artists` | 501 | — | `song_artists_v2` |
| `songcode` | 418 | — | `notes` (type `songcode`) |
| `song_tags` | 324 | — | `library_song_tags` |
| `list_items.song_id` | 65 set | — | `list_items.library_song_id` (every row with `song_id` also has `library_song_id`) |

No views, functions or triggers outside the V1 tables reference them. Only RLS policies on the V1 tables
themselves and the FK `list_items_song_id_fkey` do.

Every app code path still touching V1 is dead (never imported, or never called):

- `components/SongCodeDrawer.vue` → `stores/songcode.ts` → `services/songcodeService.ts` — component never mounted
- `components/ArtistInput.vue` — never imported; sole user of `artistsStore.fetchArtists` and the V1 `artists` cache
- `stores/songs.ts` → `services/songService.ts` — only consumer is `useListSongActions.handleDeleteSong`, reachable
  only from `getItemDropdownItems`, which the composable does not expose (and it passed a `songs_v2` id to a V1 delete)
- `listsStore.addSongToList` / `removeSongFromList` → `listService.insertSongToList` / `deleteSongFromList` — no callers
- `ManageTagsModal` `songId` branch (writes `song_tags`) — every caller passes `librarySongId`

## Stories

### 1. Remove dead V1 code paths — ✅
Delete the modules above, the V1 branch of `ManageTagsModal`, the V1 functions in the lists and artists
stores and services, and the V1-only shared types (`SongTag`, `SongArtist`, `SongCode`). Remove `ListItem.song_id`
from the shared type, fixtures and the e2e mock.

`Song`, `Artist` and `SongWithTags` stay: they are still used as UI view-models built from V2 data
(`ListWithItems`, `ArtistWithCount`). Renaming or reshaping them belongs with story 5.

**Done when:** `npm run typecheck`, unit tests and the offline e2e suite pass; no `from('songs'|'artists'|'song_artists'|'songcode'|'song_tags')` remains.

### 2. Migration `044_drop_v1_tables.sql` — ✅
- Drop `list_items.song_id` (FK, `unique_list_song`, `idx_list_items_song_id` go with it).
- Recreate `list_item_type_check` on `library_song_id` only.
- Add `unique_list_library_song (list_id, library_song_id)` to keep the "no duplicate song per list" guarantee
  that `unique_list_song` provided (prod and dev have 0 duplicates).
- `DROP TABLE songcode, song_tags, song_artists, songs, artists` (policies and triggers go with them).

### 3. Apply on dev + regenerate types — ✅
Apply 044 on the dev Supabase project; regenerate `packages/shared/src/types/supabase.ts`.

### 4. Ship to prod — ⏳
Migrations 044 and 045 go out together with the frontend from this branch. The new bundle only knows the
un-suffixed names and the old bundle only knows `_v2`, so there is no order that is safe for both.

1. Take a backup or confirm PITR coverage, and optionally export the five V1 tables to CSV for archiving.
2. Apply `044_drop_v1_tables.sql`, then `045_drop_v2_suffix.sql`, on prod.
3. Deploy the frontend right away. Clients still running the old bundle (PWA / service-worker cache) get
   `PGRST205` on song and artist queries until they reload; the "new version available" banner prompts that.
   To avoid that gap, temporarily create `songs_v2` / `artists_v2` / `song_artists_v2` as
   `security_invoker` views over the renamed tables, and drop them a few days later.
4. Smoke test: library, list detail (add/remove/reorder), manage tags, artists page, public library, offline snapshot.

**Rollback:** reverse 045 with `ALTER TABLE … RENAME` and redeploy the previous bundle. 044 can only be undone by
restoring the five tables from the backup, but no live code depends on them.

### 5. Drop the `_v2` suffix — ✅
Migration `045_drop_v2_suffix.sql` renames `songs_v2` → `songs`, `artists_v2` → `artists` and
`song_artists_v2` → `song_artists`, and strips `_v2` from their constraint and index names. RLS policies,
FKs and grants follow the tables, and no functions or views referenced the old names. The FK hint used in embeds
(`library_songs_song_id_fkey`) is unchanged. The PostgREST queries, the offline snapshot engine, the e2e mock and
`supabase.ts` were updated. It was verified against the dev REST API with the app's embeds.

The TypeScript names (`SongV2`, `ArtistV2`, `SongArtistV2`, `createArtistV2`, …) were kept, because `Song` and `Artist` are
still taken by the UI view-models. Merging those is a separate refactor.
