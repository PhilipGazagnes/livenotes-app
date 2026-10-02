import type { ArtistV2, LibrarySong, List, ListItem, Note, SongV2, Tag } from '../../types'
import type { ProjectSnapshot } from '../snapshot'
import { SNAPSHOT_SCHEMA_VERSION } from '../snapshot'

export const PROJECT_ID = 'p1'

export function song(id: string, title: string): SongV2 {
  return {
    id, title, fingerprint: null, is_verified: null, verified_by: null, verified_at: null,
    created_by: 'u1', created_at: null, updated_at: null, popularity_score: null,
    merged_into_id: null, merge_reason: null,
  }
}

export function artist(id: string, name: string): ArtistV2 {
  return {
    id, name, fingerprint: null, is_verified: null, verified_by: null, verified_at: null,
    bio: null, image_url: null, external_links: null, created_by: 'u1',
    created_at: null, updated_at: null, merged_into_id: null, merge_reason: null,
  }
}

export function librarySong(id: string, songId: string, addedAt: string | null, customTitle: string | null = null): LibrarySong {
  return { id, project_id: PROJECT_ID, song_id: songId, added_by: 'u1', added_at: addedAt, custom_title: customTitle, custom_notes: null }
}

export function tag(id: string, name: string): Tag {
  return { id, project_id: PROJECT_ID, name, created_at: null }
}

export function list(id: string, name: string, createdAt: string | null): List {
  return { id, project_id: PROJECT_ID, name, description: null, created_at: createdAt, updated_at: null, created_by: 'u1' }
}

export function listItem(id: string, listId: string, position: number, librarySongId: string | null, type: 'song' | 'title' = 'song'): ListItem {
  return {
    id, list_id: listId, song_id: null, library_song_id: librarySongId, position, type,
    title: type === 'title' ? 'Set 1' : null, added_at: '2026-01-01', note_id: null, list_annotations: null,
  }
}

export function note(id: string, librarySongId: string, type: Note['type'], order: number | null): Note {
  return {
    id, library_song_id: librarySongId, type, title: null, content: `${type} ${id}`, data: null,
    created_by: 'u1', created_at: null, updated_by: 'u1', updated_at: null, display_order: order,
    is_public: null, is_shareable: null, share_token: null,
  }
}

/**
 * Library: ls1 "Alpha" (Ann + Bob), ls2 "Beta" (Bob), ls3 "Gamma" (no artist), added in that order.
 * Tags: rock on ls1 and ls2, jazz on ls3. Setlist l1: title, ls2, ls1.
 */
export function makeSnapshot(overrides: Partial<ProjectSnapshot> = {}): ProjectSnapshot {
  return {
    projectId: PROJECT_ID,
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    syncedAt: '2026-10-02T10:00:00.000Z',
    project: {
      id: PROJECT_ID, name: 'Band', slug: 'band', owner_id: 'u1', created_at: null, updated_at: null,
      description: null, thumbnail_url: null, contact_enabled: false, contact_info: null,
    },
    role: 'editor',
    librarySongs: [
      librarySong('ls1', 's1', '2026-01-01'),
      librarySong('ls2', 's2', '2026-02-01'),
      librarySong('ls3', 's3', '2026-03-01', 'Gamma (live)'),
    ],
    songs: [song('s1', 'Alpha'), song('s2', 'Beta'), song('s3', 'Gamma')],
    songArtists: [
      { id: 'sa1', song_id: 's1', artist_id: 'a2', position: 1, created_at: '' },
      { id: 'sa2', song_id: 's1', artist_id: 'a1', position: 0, created_at: '' },
      { id: 'sa3', song_id: 's2', artist_id: 'a2', position: 0, created_at: '' },
    ],
    artists: [artist('a1', 'Ann'), artist('a2', 'Bob')],
    librarySongTags: [
      { id: 't-1', library_song_id: 'ls1', tag_id: 't1', created_at: '' },
      { id: 't-2', library_song_id: 'ls2', tag_id: 't1', created_at: '' },
      { id: 't-3', library_song_id: 'ls3', tag_id: 't2', created_at: '' },
    ],
    notes: [
      note('n1', 'ls1', 'lyrics', 1),
      note('n2', 'ls1', 'songcode', null),
      note('n3', 'ls1', 'lyrics', 0),
    ],
    tags: [tag('t1', 'rock'), tag('t2', 'jazz')],
    lists: [list('l1', 'Gig', '2026-05-01'), list('l2', 'Empty', '2026-06-01')],
    listItems: [
      listItem('i3', 'l1', 2, 'ls1'),
      listItem('i1', 'l1', 0, null, 'title'),
      listItem('i2', 'l1', 1, 'ls2'),
    ],
    ...overrides,
  }
}
