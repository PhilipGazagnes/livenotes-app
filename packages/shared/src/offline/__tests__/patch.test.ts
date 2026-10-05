import { describe, expect, it } from 'vitest'
import { applySnapshotPatch } from '../patch'
import { selectLibrarySongWithDetails, selectListWithItems, selectTags } from '../queries'
import type { RawLibrarySong, RawList } from '../fetchSnapshot'
import { artist, librarySong, list, listItem, makeSnapshot, note, song, tag } from './fixtures'

function rawLibrarySong(overrides: Partial<RawLibrarySong> = {}): RawLibrarySong {
  return {
    ...librarySong('ls1', 's1', '2026-01-01', 'Alpha (edited)'),
    song: {
      ...song('s1', 'Alpha'),
      song_artists: [{ id: 'sa9', song_id: 's1', artist_id: 'a3', position: 0, created_at: '', artist: artist('a3', 'Cid') }],
    },
    tags: [{ id: 't-9', library_song_id: 'ls1', tag_id: 't2', created_at: '' }],
    notes: [note('n1', 'ls1', 'lyrics', 0)],
    ...overrides,
  }
}

describe('applySnapshotPatch', () => {
  it('returns a new object and leaves the original untouched', () => {
    const s = makeSnapshot()
    const next = applySnapshotPatch(s, { version: 4 })
    expect(next).not.toBe(s)
    expect(next.version).toBe(4)
    expect(s.version).toBe(3)
  })

  it('replaces a library song aggregate: title, artists, tags and notes', () => {
    const s = makeSnapshot({
      listItems: [{ ...listItem('i3', 'l1', 2, 'ls1'), note_id: 'n2' }],
    })
    const next = applySnapshotPatch(s, { librarySongs: [rawLibrarySong()] })

    const ls = selectLibrarySongWithDetails(next, 'ls1')!
    expect(ls.custom_title).toBe('Alpha (edited)')
    expect(ls.song.artists.map(a => a.name)).toEqual(['Cid'])
    expect(ls.tags.map(t => t.name)).toEqual(['jazz'])
    expect(ls.notes.map(n => n.id)).toEqual(['n1'])
    // n2 and n3 were deleted: the list item pointing at n2 loses the link
    expect(next.listItems[0].note_id).toBeNull()
    // other library songs are untouched
    expect(next.notes.filter(n => n.library_song_id !== 'ls1')).toEqual(s.notes.filter(n => n.library_song_id !== 'ls1'))
    expect(next.librarySongs).toHaveLength(3)
  })

  it('adds a new library song', () => {
    const raw = rawLibrarySong({ ...librarySong('ls4', 's4', '2026-04-01'), song: { ...song('s4', 'Delta'), song_artists: [] }, tags: [], notes: [] })
    const next = applySnapshotPatch(makeSnapshot(), { librarySongs: [raw] })
    expect(selectLibrarySongWithDetails(next, 'ls4')?.song.title).toBe('Delta')
  })

  it('removes a library song with its tags, notes and list items', () => {
    const next = applySnapshotPatch(makeSnapshot(), { removedLibrarySongIds: ['ls1'] })
    expect(next.librarySongs.map(ls => ls.id)).toEqual(['ls2', 'ls3'])
    expect(next.notes).toHaveLength(0)
    expect(next.librarySongTags.some(t => t.library_song_id === 'ls1')).toBe(false)
    expect(next.listItems.map(i => i.id).sort()).toEqual(['i1', 'i2'])
  })

  it('replaces a setlist with its items', () => {
    const raw: RawList = { ...list('l1', 'Gig (renamed)', '2026-05-01'), items: [listItem('i9', 'l1', 0, 'ls3')] }
    const next = applySnapshotPatch(makeSnapshot(), { lists: [raw] })
    const l1 = selectListWithItems(next, 'l1')!
    expect(l1.name).toBe('Gig (renamed)')
    expect(l1.items.map(i => i.id)).toEqual(['i9'])
    expect(next.lists).toHaveLength(2)
  })

  it('removes a setlist with its items', () => {
    const next = applySnapshotPatch(makeSnapshot(), { removedListIds: ['l1'] })
    expect(next.lists.map(l => l.id)).toEqual(['l2'])
    expect(next.listItems).toHaveLength(0)
  })

  it('upserts and removes tags, cascading to library song links', () => {
    const next = applySnapshotPatch(makeSnapshot(), {
      tags: [tag('t2', 'jazz-fusion'), tag('t3', 'pop')],
      removedTagIds: ['t1'],
    })
    expect(selectTags(next).map(t => t.name)).toEqual(['jazz-fusion', 'pop'])
    expect(next.librarySongTags.map(t => t.tag_id)).toEqual(['t2'])
  })

  it('updates catalog artists the copy already shows, ignores others', () => {
    const next = applySnapshotPatch(makeSnapshot(), { artists: [artist('a1', 'Annie'), artist('a9', 'Nobody')] })
    expect(next.artists.map(a => a.name)).toEqual(['Annie', 'Bob'])
  })

  it('replaces the project row', () => {
    const s = makeSnapshot()
    const next = applySnapshotPatch(s, { project: { ...s.project!, name: 'New name' } })
    expect(next.project?.name).toBe('New name')
  })
})
