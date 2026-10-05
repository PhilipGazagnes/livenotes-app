import type { ArtistV2, Project, Tag } from '../types'
import type { ProjectSnapshot } from './snapshot'
import type { RawLibrarySong, RawList } from './fetchSnapshot'

/**
 * Change to apply to a local copy after a successful write (ADR-012).
 *
 * Aggregates are replaced as a whole with the rows the server returned:
 * a library song with its song card, artists, tags and notes; a setlist with
 * its items. Removals follow the database's cascades.
 */
export interface SnapshotPatch {
  /** Replace these library songs (song card, artists, tags, notes). List items are kept. */
  librarySongs?: RawLibrarySong[]
  /** Remove library songs with their tags, notes and list items */
  removedLibrarySongIds?: string[]
  /** Replace these setlists and all their items */
  lists?: RawList[]
  /** Remove setlists with their items */
  removedListIds?: string[]
  /** Insert or replace tags */
  tags?: Tag[]
  /** Remove tags and their library song links */
  removedTagIds?: string[]
  /** Replace shared catalog artists already present in the copy */
  artists?: ArtistV2[]
  project?: Project | null
  /** New server version of the project */
  version?: number
}

function without<T extends { id: string }>(rows: T[], ids: Set<string>): T[] {
  return ids.size ? rows.filter(row => !ids.has(row.id)) : rows
}

/**
 * Apply `patch` to `snapshot`. Pure: returns a new snapshot object (read
 * indexes are cached per object, so the old one must not be mutated).
 */
export function applySnapshotPatch(snapshot: ProjectSnapshot, patch: SnapshotPatch): ProjectSnapshot {
  let { librarySongs, songs, songArtists, artists, librarySongTags, notes, tags, lists, listItems } = snapshot
  const removedNoteIds = new Set<string>()

  // Library songs removed: cascade to tags, notes and list items
  const removedLs = new Set(patch.removedLibrarySongIds ?? [])
  if (removedLs.size) {
    librarySongs = librarySongs.filter(ls => !removedLs.has(ls.id))
    librarySongTags = librarySongTags.filter(lst => !removedLs.has(lst.library_song_id))
    notes = notes.filter(n => {
      if (!removedLs.has(n.library_song_id)) return true
      removedNoteIds.add(n.id)
      return false
    })
    listItems = listItems.filter(item => !item.library_song_id || !removedLs.has(item.library_song_id))
  }

  // Library songs replaced: their own rows, the song card and its artists
  if (patch.librarySongs?.length) {
    const replaced = new Set(patch.librarySongs.map(ls => ls.id))
    const replacedSongs = new Set(patch.librarySongs.flatMap(ls => (ls.song ? [ls.song.id] : [])))
    const nextArtists = new Map(artists.map(a => [a.id, a]))
    const newLibrarySongs = []
    const newTags = []
    const newNotes = []
    const newSongs = []
    const newSongArtists = []

    for (const { song, tags: lsTags, notes: lsNotes, ...librarySong } of patch.librarySongs) {
      newLibrarySongs.push(librarySong)
      newTags.push(...(lsTags ?? []))
      newNotes.push(...(lsNotes ?? []))
      if (!song) continue
      const { song_artists, ...songRow } = song
      newSongs.push(songRow)
      for (const { artist, ...songArtist } of song_artists ?? []) {
        newSongArtists.push(songArtist)
        if (artist) nextArtists.set(artist.id, artist)
      }
    }

    const keptNoteIds = new Set(newNotes.map(n => n.id))
    for (const n of notes) {
      if (replaced.has(n.library_song_id) && !keptNoteIds.has(n.id)) removedNoteIds.add(n.id)
    }

    librarySongs = [...librarySongs.filter(ls => !replaced.has(ls.id)), ...newLibrarySongs]
    librarySongTags = [...librarySongTags.filter(lst => !replaced.has(lst.library_song_id)), ...newTags]
    notes = [...notes.filter(n => !replaced.has(n.library_song_id)), ...newNotes]
    songs = [...songs.filter(s => !replacedSongs.has(s.id)), ...newSongs]
    songArtists = [...songArtists.filter(sa => !replacedSongs.has(sa.song_id)), ...newSongArtists]
    artists = [...nextArtists.values()]
  }

  // Deleted notes: list items pointing at them lose the link (ON DELETE SET NULL)
  if (removedNoteIds.size) {
    listItems = listItems.map(item =>
      item.note_id && removedNoteIds.has(item.note_id) ? { ...item, note_id: null } : item
    )
  }

  // Setlists
  const removedLists = new Set(patch.removedListIds ?? [])
  if (removedLists.size) {
    lists = without(lists, removedLists)
    listItems = listItems.filter(item => !removedLists.has(item.list_id))
  }
  if (patch.lists?.length) {
    const replaced = new Set(patch.lists.map(l => l.id))
    const newLists = []
    const newItems = []
    for (const { items, ...list } of patch.lists) {
      newLists.push(list)
      newItems.push(...(items ?? []))
    }
    lists = [...lists.filter(l => !replaced.has(l.id)), ...newLists]
    listItems = [...listItems.filter(item => !replaced.has(item.list_id)), ...newItems]
  }

  // Tags
  const removedTags = new Set(patch.removedTagIds ?? [])
  if (removedTags.size) {
    tags = without(tags, removedTags)
    librarySongTags = librarySongTags.filter(lst => !removedTags.has(lst.tag_id))
  }
  if (patch.tags?.length) {
    const replaced = new Set(patch.tags.map(t => t.id))
    tags = [...tags.filter(t => !replaced.has(t.id)), ...patch.tags]
  }

  // Catalog artists (only those the copy already shows)
  if (patch.artists?.length) {
    const updates = new Map(patch.artists.map(a => [a.id, a]))
    artists = artists.map(a => updates.get(a.id) ?? a)
  }

  return {
    ...snapshot,
    project: patch.project !== undefined ? patch.project : snapshot.project,
    version: patch.version ?? snapshot.version,
    librarySongs,
    songs,
    songArtists,
    artists,
    librarySongTags,
    notes,
    tags,
    lists,
    listItems,
  }
}
