import type { BrowserContext, Route } from '@playwright/test'

/**
 * In-memory Supabase stand-in for the offline e2e tests: answers the auth and
 * PostgREST requests the app makes, so the real app runs without a database.
 * Set `backend.offline = true` together with `context.setOffline(true)`.
 */

export const MOCK_SUPABASE_URL = 'https://mock.supabase.co'
export const USER_ID = 'u1'
export const PROJECT_ID = 'p1'

const now = '2026-01-01T00:00:00.000Z'
const user = {
  id: USER_ID, aud: 'authenticated', role: 'authenticated', email: 'offline@test.dev',
  app_metadata: { provider: 'email' }, user_metadata: {}, created_at: now,
}
const project = {
  id: PROJECT_ID, name: 'Offline Band', slug: 'offline-band', owner_id: USER_ID, created_at: now,
  updated_at: now, description: null, thumbnail_url: null, contact_enabled: false, contact_info: null,
}
const profile = { id: USER_ID, display_name: 'Tester', avatar_url: null, active_project_id: PROJECT_ID, is_super_admin: false, created_at: now, updated_at: now }
const artists = [
  { id: 'a1', name: 'Oasis', created_at: now, updated_at: now },
  { id: 'a2', name: 'The Beatles', created_at: now, updated_at: now },
]
const songs = [
  { id: 's1', title: 'Wonderwall', created_by: USER_ID, created_at: now, updated_at: now },
  { id: 's2', title: 'Yesterday', created_by: USER_ID, created_at: now, updated_at: now },
]
const songArtists = [
  { id: 'sa1', song_id: 's1', artist_id: 'a1', position: 0, created_at: now },
  { id: 'sa2', song_id: 's2', artist_id: 'a2', position: 0, created_at: now },
]
const librarySongs = [
  { id: 'ls1', project_id: PROJECT_ID, song_id: 's1', added_by: USER_ID, added_at: '2026-01-01T00:00:00Z', custom_title: null, custom_notes: null },
  { id: 'ls2', project_id: PROJECT_ID, song_id: 's2', added_by: USER_ID, added_at: '2026-02-01T00:00:00Z', custom_title: null, custom_notes: null },
]
const tags = [{ id: 't1', project_id: PROJECT_ID, name: 'rock', created_at: now }]
const librarySongTags = [{ id: 'lst1', library_song_id: 'ls1', tag_id: 't1', created_at: now }]
const notes = [{
  id: 'n1', library_song_id: 'ls1', type: 'lyrics', title: null, content: 'Today is gonna be the day',
  data: null, display_order: 0, created_at: now, updated_at: now, is_public: false, is_shareable: false,
  created_by: USER_ID, updated_by: USER_ID, share_token: null,
}]
const lists = [{ id: 'l1', project_id: PROJECT_ID, name: 'Friday Gig', description: null, created_at: now, updated_at: now, created_by: USER_ID }]
const listItems = [
  { id: 'i1', list_id: 'l1', library_song_id: null, song_id: null, position: 0, type: 'title', title: 'Set 1', added_at: now, note_id: null, list_annotations: null },
  { id: 'i2', list_id: 'l1', library_song_id: 'ls2', song_id: null, position: 1, type: 'song', title: null, added_at: now, note_id: null, list_annotations: null },
  { id: 'i3', list_id: 'l1', library_song_id: 'ls1', song_id: null, position: 2, type: 'song', title: null, added_at: now, note_id: null, list_annotations: null },
]

type Row = Record<string, unknown>
const byId = <T extends { id: string }>(rows: T[], id: unknown) => rows.find(r => r.id === id)!

const songWithArtistJoins = (songId: string) => ({
  ...byId(songs, songId),
  artists: songArtists.filter(sa => sa.song_id === songId).map(sa => ({ position: sa.position, artist: byId(artists, sa.artist_id) })),
})
const libraryRowForViews = (ls: (typeof librarySongs)[number]) => ({
  ...ls,
  song: songWithArtistJoins(ls.song_id),
  tags: librarySongTags.filter(t => t.library_song_id === ls.id).map(t => ({ tag: byId(tags, t.tag_id) })),
  notes: notes.filter(n => n.library_song_id === ls.id),
  lists: listItems.filter(i => i.library_song_id === ls.id).map(i => ({ list: byId(lists, i.list_id) })),
})

/** Rows for `table`, shaped after the `select` the app asked for. */
function rowsFor(table: string, select: string): Row[] {
  switch (table) {
    case 'profiles': return [profile]
    case 'projects': return [project]
    case 'project_memberships':
      return select.includes('project:projects')
        ? [{ role: 'editor', project }]
        : [{ id: 'm1', project_id: PROJECT_ID, user_id: USER_ID, role: 'editor' }]
    case 'library_songs':
      if (select.includes('song_artists:song_artists_v2')) {
        // offline snapshot sync
        return librarySongs.map(ls => ({
          ...ls,
          song: { ...byId(songs, ls.song_id), song_artists: songArtists.filter(sa => sa.song_id === ls.song_id).map(sa => ({ ...sa, artist: byId(artists, sa.artist_id) })) },
          tags: librarySongTags.filter(t => t.library_song_id === ls.id),
          notes: notes.filter(n => n.library_song_id === ls.id),
        }))
      }
      if (select.includes('songs_v2!inner')) {
        return librarySongs.map(ls => ({
          id: ls.id, song_id: ls.song_id,
          songs_v2: { id: ls.song_id, song_artists_v2: songArtists.filter(sa => sa.song_id === ls.song_id).map(sa => ({ artist_id: sa.artist_id, artists_v2: byId(artists, sa.artist_id) })) },
        }))
      }
      return librarySongs.map(libraryRowForViews)
    case 'lists':
      return select.includes('items:list_items')
        ? lists.map(l => ({ ...l, items: listItems.filter(i => i.list_id === l.id) }))
        : lists
    case 'list_items':
      return select.includes('library_song:')
        ? listItems.map(i => ({ ...i, library_song: i.library_song_id ? libraryRowForViews(byId(librarySongs, i.library_song_id)) : null }))
        : listItems
    case 'tags': return tags
    case 'library_song_tags': return librarySongTags
    case 'notes': return notes
    default: return []
  }
}

/** Minimal PostgREST filters: `col=eq.value` and `col=in.(a,b)`. */
function applyFilters(rows: Row[], params: URLSearchParams): Row[] {
  let result = rows
  for (const [key, value] of params) {
    if (['select', 'order', 'limit', 'offset'].includes(key)) continue
    if (!result.some(r => key in r)) continue
    if (value.startsWith('eq.')) result = result.filter(r => String(r[key]) === value.slice(3))
    else if (value.startsWith('in.(')) {
      const values = value.slice(4, -1).split(',')
      result = result.filter(r => values.includes(String(r[key])))
    }
  }
  return result
}

function base64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function session() {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600
  const accessToken = `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url({ sub: USER_ID, exp: expiresAt, role: 'authenticated', aud: 'authenticated', email: user.email })}.signature`
  return { access_token: accessToken, token_type: 'bearer', expires_in: 3600, expires_at: expiresAt, refresh_token: 'refresh-token', user }
}

export interface MockBackend {
  offline: boolean
  restRequests: string[]
}

export async function mockSupabase(context: BrowserContext): Promise<MockBackend> {
  const backend: MockBackend = { offline: false, restRequests: [] }
  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

  await context.route(`${MOCK_SUPABASE_URL}/auth/v1/**`, async route => {
    if (backend.offline) return route.abort('internetdisconnected')
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/token')) return json(route, session())
    if (url.pathname.endsWith('/user')) return json(route, user)
    if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 204 })
    return json(route, {})
  })

  await context.route(`${MOCK_SUPABASE_URL}/rest/v1/**`, async route => {
    if (backend.offline) return route.abort('internetdisconnected')
    const request = route.request()
    const url = new URL(request.url())
    const table = url.pathname.replace('/rest/v1/', '')
    backend.restRequests.push(`${request.method()} ${table}`)
    if (request.method() !== 'GET') return json(route, [])
    const rows = applyFilters(rowsFor(table, url.searchParams.get('select') ?? '*'), url.searchParams)
    const wantsObject = (request.headers()['accept'] ?? '').includes('vnd.pgrst.object')
    if (wantsObject) return rows.length ? json(route, rows[0]) : json(route, { code: 'PGRST116', message: 'no rows' }, 406)
    return json(route, rows)
  })

  return backend
}
