import { describe, expect, it } from 'vitest'
import {
  selectArtistsWithCount,
  selectLibrarySongs,
  selectLibrarySongWithDetails,
  selectListItemCount,
  selectLists,
  selectListSongCounts,
  selectListWithItems,
  selectNotes,
  selectTags,
  selectTagSongCounts,
} from '../queries'
import { librarySong, makeSnapshot } from './fixtures'

describe('selectLibrarySongs', () => {
  it('orders by added_at desc with NULLs first, like Postgres', () => {
    const s = makeSnapshot()
    s.librarySongs.push(librarySong('ls4', 's1', null))
    expect(selectLibrarySongs(s).map(ls => ls.id)).toEqual(['ls4', 'ls3', 'ls2', 'ls1'])
  })

  it('joins song, artists (by position), tags and lists; notes stay empty like the server list query', () => {
    const alpha = selectLibrarySongs(makeSnapshot()).find(ls => ls.id === 'ls1')!
    expect(alpha.song.title).toBe('Alpha')
    expect(alpha.song.artists.map(a => [a.name, a.position])).toEqual([['Ann', 0], ['Bob', 1]])
    expect(alpha.tags.map(t => t.name)).toEqual(['rock'])
    expect(alpha.lists.map(l => l.name)).toEqual(['Gig'])
    expect(alpha.notes).toEqual([])
  })

  it('skips library songs whose song row is missing', () => {
    const s = makeSnapshot({ songs: [] })
    expect(selectLibrarySongs(s)).toEqual([])
  })
})

describe('selectLibrarySongWithDetails', () => {
  it('includes notes ordered by note type enum order, then display_order', () => {
    const details = selectLibrarySongWithDetails(makeSnapshot(), 'ls1')!
    expect(details.notes.map(n => n.id)).toEqual(['n2', 'n3', 'n1'])
  })

  it('returns null for an unknown id', () => {
    expect(selectLibrarySongWithDetails(makeSnapshot(), 'nope')).toBeNull()
  })
})

describe('selectNotes', () => {
  it('returns notes of one library song in server order', () => {
    expect(selectNotes(makeSnapshot(), 'ls1').map(n => n.id)).toEqual(['n2', 'n3', 'n1'])
    expect(selectNotes(makeSnapshot(), 'ls2')).toEqual([])
  })
})

describe('lists', () => {
  it('selectLists orders by created_at desc', () => {
    expect(selectLists(makeSnapshot()).map(l => l.id)).toEqual(['l2', 'l1'])
  })

  it('selectListWithItems orders items by position and joins songs', () => {
    const list = selectListWithItems(makeSnapshot(), 'l1')!
    expect(list.name).toBe('Gig')
    expect(list.items.map(i => i.id)).toEqual(['i1', 'i2', 'i3'])
    expect(list.items[0].song).toBeNull()
    expect(list.items[1].song.title).toBe('Beta')
    expect(list.items[2].song.artists.map(a => a.name)).toEqual(['Ann', 'Bob'])
    expect(list.items[2].song.tags.map(t => t.name)).toEqual(['rock'])
  })

  it('selectListWithItems returns null for an unknown list', () => {
    expect(selectListWithItems(makeSnapshot(), 'nope')).toBeNull()
  })

  it('counts only song items', () => {
    const s = makeSnapshot()
    expect(selectListItemCount(s, 'l1')).toBe(2)
    expect([...selectListSongCounts(s, ['l1', 'l2', 'unknown'])]).toEqual([['l1', 2], ['l2', 0], ['unknown', 0]])
  })
})

describe('tags', () => {
  it('selectTags sorts by name', () => {
    expect(selectTags(makeSnapshot()).map(t => t.name)).toEqual(['jazz', 'rock'])
  })

  it('selectTagSongCounts counts library songs per requested tag', () => {
    expect([...selectTagSongCounts(makeSnapshot(), ['t1', 't2', 't3'])]).toEqual([['t1', 2], ['t2', 1], ['t3', 0]])
  })
})

describe('selectArtistsWithCount', () => {
  it('counts library songs per artist, sorted by name, scoped to the project', () => {
    const artists = selectArtistsWithCount(makeSnapshot())
    expect(artists.map(a => [a.name, a.song_count, a.project_id])).toEqual([['Ann', 1, 'p1'], ['Bob', 2, 'p1']])
  })
})
