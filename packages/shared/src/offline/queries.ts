/**
 * Read models rebuilt from a ProjectSnapshot.
 *
 * Each function mirrors a web service read (same shape, same ordering) so the
 * app behaves the same online and offline. Keep them pure: snapshot in, data out.
 */
import type {
  ArtistV2,
  ArtistWithCount,
  LibrarySong,
  LibrarySongWithDetails,
  List,
  ListItem,
  ListWithItems,
  Note,
  NoteType,
  Project,
  SongV2,
  Tag,
} from '../types'
import type { ProjectSnapshot } from './snapshot'

// Declaration order of the Postgres `note_type` enum (ORDER BY type follows it).
const NOTE_TYPE_ORDER: NoteType[] = [
  'songcode', 'plain_text', 'youtube', 'image', 'video', 'audio',
  'tablature', 'looper_notes', 'lyrics', 'chords', 'looper',
]

type Sortable = string | number | null | undefined

/** Postgres ORDER BY semantics: ASC puts NULLs last, DESC puts NULLs first. */
function compareNullable(a: Sortable, b: Sortable, direction: 'asc' | 'desc'): number {
  const aNull = a === null || a === undefined
  const bNull = b === null || b === undefined
  if (aNull && bNull) return 0
  if (aNull) return direction === 'asc' ? 1 : -1
  if (bNull) return direction === 'asc' ? -1 : 1
  const result = a < b ? -1 : a > b ? 1 : 0
  return direction === 'asc' ? result : -result
}

function byName(a: { name: string }, b: { name: string }): number {
  return a.name.localeCompare(b.name)
}

/** Lookup tables built once per snapshot (snapshots are immutable once saved). */
interface SnapshotIndex {
  songs: Map<string, SongV2>
  artists: Map<string, ArtistV2>
  artistIdsBySong: Map<string, Array<{ artistId: string; position: number }>>
  tags: Map<string, Tag>
  tagIdsByLibrarySong: Map<string, string[]>
  lists: Map<string, List>
  listItemsByLibrarySong: Map<string, ListItem[]>
  listItemsByList: Map<string, ListItem[]>
  notesByLibrarySong: Map<string, Note[]>
  librarySongs: Map<string, LibrarySong>
}

const indexCache = new WeakMap<ProjectSnapshot, SnapshotIndex>()

function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const existing = map.get(key)
  if (existing) existing.push(value)
  else map.set(key, [value])
}

function getIndex(s: ProjectSnapshot): SnapshotIndex {
  const cached = indexCache.get(s)
  if (cached) return cached

  const index: SnapshotIndex = {
    songs: new Map(s.songs.map(song => [song.id, song])),
    artists: new Map(s.artists.map(artist => [artist.id, artist])),
    artistIdsBySong: new Map(),
    tags: new Map(s.tags.map(tag => [tag.id, tag])),
    tagIdsByLibrarySong: new Map(),
    lists: new Map(s.lists.map(list => [list.id, list])),
    listItemsByLibrarySong: new Map(),
    listItemsByList: new Map(),
    notesByLibrarySong: new Map(),
    librarySongs: new Map(s.librarySongs.map(ls => [ls.id, ls])),
  }
  for (const sa of s.songArtists) push(index.artistIdsBySong, sa.song_id, { artistId: sa.artist_id, position: sa.position })
  for (const lst of s.librarySongTags) push(index.tagIdsByLibrarySong, lst.library_song_id, lst.tag_id)
  for (const item of s.listItems) {
    push(index.listItemsByList, item.list_id, item)
    if (item.library_song_id) push(index.listItemsByLibrarySong, item.library_song_id, item)
  }
  for (const note of s.notes) push(index.notesByLibrarySong, note.library_song_id, note)

  indexCache.set(s, index)
  return index
}

function songArtists(index: SnapshotIndex, songId: string): Array<ArtistV2 & { position: number }> {
  return (index.artistIdsBySong.get(songId) ?? [])
    .map(({ artistId, position }) => {
      const artist = index.artists.get(artistId)
      return artist ? { ...artist, position } : null
    })
    .filter((a): a is ArtistV2 & { position: number } => a !== null)
    .sort((a, b) => a.position - b.position)
}

function librarySongTags(index: SnapshotIndex, librarySongId: string): Tag[] {
  return (index.tagIdsByLibrarySong.get(librarySongId) ?? [])
    .map(id => index.tags.get(id))
    .filter((t): t is Tag => t !== undefined)
}

/** One entry per list item, like the server join `lists:list_items(list:lists(...))`. */
function librarySongLists(index: SnapshotIndex, librarySongId: string): List[] {
  return (index.listItemsByLibrarySong.get(librarySongId) ?? [])
    .map(item => index.lists.get(item.list_id))
    .filter((l): l is List => l !== undefined)
}

function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) =>
    NOTE_TYPE_ORDER.indexOf(a.type) - NOTE_TYPE_ORDER.indexOf(b.type) ||
    compareNullable(a.display_order, b.display_order, 'asc')
  )
}

function toLibrarySongWithDetails(
  index: SnapshotIndex,
  ls: LibrarySong,
  withNotes: boolean,
): LibrarySongWithDetails | null {
  const song = index.songs.get(ls.song_id)
  if (!song) return null
  return {
    ...ls,
    song: { ...song, artists: songArtists(index, song.id) },
    tags: librarySongTags(index, ls.id),
    notes: withNotes ? sortNotes(index.notesByLibrarySong.get(ls.id) ?? []) : [],
    lists: librarySongLists(index, ls.id),
  }
}

/** Mirrors libraryService.fetchLibrarySongs (ordered by added_at desc). */
export function selectLibrarySongs(s: ProjectSnapshot): LibrarySongWithDetails[] {
  const index = getIndex(s)
  return [...s.librarySongs]
    .sort((a, b) => compareNullable(a.added_at, b.added_at, 'desc'))
    .map(ls => toLibrarySongWithDetails(index, ls, false))
    .filter((ls): ls is LibrarySongWithDetails => ls !== null)
}

/** Mirrors libraryService.fetchLibrarySongWithDetails. */
export function selectLibrarySongWithDetails(s: ProjectSnapshot, librarySongId: string): LibrarySongWithDetails | null {
  const index = getIndex(s)
  const ls = index.librarySongs.get(librarySongId)
  return ls ? toLibrarySongWithDetails(index, ls, true) : null
}

/** Mirrors noteService.fetchNotes (ordered by type, then display_order). */
export function selectNotes(s: ProjectSnapshot, librarySongId: string): Note[] {
  return sortNotes(getIndex(s).notesByLibrarySong.get(librarySongId) ?? [])
}

/** Mirrors listService.fetchLists (ordered by created_at desc). */
export function selectLists(s: ProjectSnapshot): List[] {
  return [...s.lists].sort((a, b) => compareNullable(a.created_at, b.created_at, 'desc'))
}

/** Mirrors listService.fetchListWithItems (items ordered by position). */
export function selectListWithItems(s: ProjectSnapshot, listId: string): ListWithItems | null {
  const index = getIndex(s)
  const list = index.lists.get(listId)
  if (!list) return null

  const items = [...(index.listItemsByList.get(listId) ?? [])]
    .sort((a, b) => a.position - b.position)
    .map(item => {
      const ls = item.library_song_id ? index.librarySongs.get(item.library_song_id) : undefined
      const song = ls ? index.songs.get(ls.song_id) : undefined
      return {
        ...item,
        song: ls && song
          ? {
              ...song,
              artists: songArtists(index, song.id),
              tags: librarySongTags(index, ls.id),
              lists: librarySongLists(index, ls.id),
            }
          : null,
      }
    })

  return { ...list, items: items as unknown as ListWithItems['items'] }
}

function countSongItems(s: ProjectSnapshot, listId: string): number {
  return (getIndex(s).listItemsByList.get(listId) ?? []).filter(item => item.type === 'song').length
}

/** Mirrors listService.fetchListItemCount. */
export function selectListItemCount(s: ProjectSnapshot, listId: string): number {
  return countSongItems(s, listId)
}

/** Mirrors listService.fetchListSongCounts. */
export function selectListSongCounts(s: ProjectSnapshot, listIds: string[]): Map<string, number> {
  return new Map(listIds.map(id => [id, countSongItems(s, id)]))
}

/** Mirrors tagService.fetchTags (ordered by name). */
export function selectTags(s: ProjectSnapshot): Tag[] {
  return [...s.tags].sort(byName)
}

/** Mirrors tagService.fetchTagSongCounts. */
export function selectTagSongCounts(s: ProjectSnapshot, tagIds: string[]): Map<string, number> {
  const counts = new Map(tagIds.map(id => [id, 0]))
  for (const lst of s.librarySongTags) {
    const current = counts.get(lst.tag_id)
    if (current !== undefined) counts.set(lst.tag_id, current + 1)
  }
  return counts
}

/** Mirrors artistService.fetchArtistsWithCount: artists of library songs, counted per library song. */
export function selectArtistsWithCount(s: ProjectSnapshot): ArtistWithCount[] {
  const index = getIndex(s)
  const counts = new Map<string, ArtistWithCount>()
  for (const ls of s.librarySongs) {
    for (const { artistId } of index.artistIdsBySong.get(ls.song_id) ?? []) {
      const artist = index.artists.get(artistId)
      if (!artist) continue
      const existing = counts.get(artist.id)
      if (existing) {
        existing.song_count++
      } else {
        counts.set(artist.id, {
          id: artist.id,
          project_id: s.projectId,
          name: artist.name,
          created_at: artist.created_at,
          updated_at: artist.updated_at,
          song_count: 1,
        })
      }
    }
  }
  return [...counts.values()].sort(byName)
}

/** Mirrors projectService.fetchProjectById. */
export function selectProject(s: ProjectSnapshot): Project | null {
  return s.project
}
