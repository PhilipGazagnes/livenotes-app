import { describe, expect, it } from 'vitest'
import { fetchProjectSnapshot, SNAPSHOT_PAGE_SIZE, SnapshotSyncError, type LivenotesClient } from '../fetchSnapshot'

type Result = { data: unknown; error: unknown }

/**
 * Minimal chainable stand-in for the Supabase query builder.
 * `respond(table, range)` decides each response.
 */
function mockClient(respond: (table: string, range: [number, number] | null) => Result) {
  const calls: Array<{ table: string; range: [number, number] | null }> = []
  const client = {
    from(table: string) {
      let range: [number, number] | null = null
      const builder = {
        select: () => builder,
        eq: () => builder,
        order: () => builder,
        range: (from: number, to: number) => { range = [from, to]; return builder },
        maybeSingle: () => builder,
        then(resolve: (r: Result) => unknown, reject: (e: unknown) => unknown) {
          calls.push({ table, range })
          return Promise.resolve(respond(table, range)).then(resolve, reject)
        },
      }
      return builder
    },
  }
  return { client: client as unknown as LivenotesClient, calls }
}

const project = { id: 'p1', name: 'Band' }

function okResponses(libraryRows: unknown[]) {
  return (table: string, range: [number, number] | null): Result => {
    switch (table) {
      case 'projects': return { data: project, error: null }
      case 'project_memberships': return { data: { role: 'reader' }, error: null }
      case 'library_songs': return { data: range ? libraryRows.slice(range[0], range[1] + 1) : libraryRows, error: null }
      case 'tags': return { data: [{ id: 't1', project_id: 'p1', name: 'rock', created_at: null }], error: null }
      case 'lists': return { data: [{ id: 'l1', name: 'Gig', items: [{ id: 'i1', list_id: 'l1' }] }], error: null }
      default: throw new Error(`unexpected table ${table}`)
    }
  }
}

function libraryRow(i: number, songId = `s${i}`) {
  return {
    id: `ls${i}`, project_id: 'p1', song_id: songId,
    song: { id: songId, title: `Song ${i}`, song_artists: [{ id: `sa${i}`, song_id: songId, artist_id: 'a1', position: 0, artist: { id: 'a1', name: 'Ann' } }] },
    tags: [{ id: `lst${i}`, library_song_id: `ls${i}`, tag_id: 't1' }],
    notes: [{ id: `n${i}`, library_song_id: `ls${i}` }],
  }
}

describe('fetchProjectSnapshot', () => {
  it('flattens embedded rows into tables and deduplicates shared artists', async () => {
    const { client } = mockClient(okResponses([libraryRow(1), libraryRow(2)]))
    const s = await fetchProjectSnapshot(client, 'p1', 'u1')

    expect(s.projectId).toBe('p1')
    expect(s.project).toEqual(project)
    expect(s.role).toBe('reader')
    expect(s.librarySongs.map(ls => ls.id)).toEqual(['ls1', 'ls2'])
    expect(s.librarySongs[0]).not.toHaveProperty('song')
    expect(s.songs.map(x => x.id)).toEqual(['s1', 's2'])
    expect(s.songs[0]).not.toHaveProperty('song_artists')
    expect(s.songArtists).toHaveLength(2)
    expect(s.artists).toEqual([{ id: 'a1', name: 'Ann' }])
    expect(s.librarySongTags).toHaveLength(2)
    expect(s.notes).toHaveLength(2)
    expect(s.lists).toEqual([{ id: 'l1', name: 'Gig' }])
    expect(s.listItems).toEqual([{ id: 'i1', list_id: 'l1' }])
  })

  it('pages through more rows than one page holds', async () => {
    const rows = Array.from({ length: SNAPSHOT_PAGE_SIZE + 3 }, (_, i) => libraryRow(i))
    const { client, calls } = mockClient(okResponses(rows))
    const s = await fetchProjectSnapshot(client, 'p1', 'u1')

    expect(s.librarySongs).toHaveLength(SNAPSHOT_PAGE_SIZE + 3)
    expect(calls.filter(c => c.table === 'library_songs').map(c => c.range)).toEqual([
      [0, SNAPSHOT_PAGE_SIZE - 1],
      [SNAPSHOT_PAGE_SIZE, 2 * SNAPSHOT_PAGE_SIZE - 1],
    ])
  })

  it('rejects with the failing step and returns nothing partial', async () => {
    const ok = okResponses([libraryRow(1)])
    const { client } = mockClient((table, range) =>
      table === 'lists' ? { data: null, error: { message: 'permission denied' } } : ok(table, range)
    )
    const promise = fetchProjectSnapshot(client, 'p1', 'u1')
    await expect(promise).rejects.toBeInstanceOf(SnapshotSyncError)
    await expect(promise).rejects.toThrow('Sync failed while loading setlists: permission denied')
  })

  it('reports progress for each step', async () => {
    const { client } = mockClient(okResponses([]))
    const steps: string[] = []
    await fetchProjectSnapshot(client, 'p1', 'u1', p => steps.push(p.step))
    expect(steps).toEqual(['Project', 'Library', 'Tags', 'Setlists'])
  })
})
