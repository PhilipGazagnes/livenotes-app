// Route paths

export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  ALL_SONGS: '/',
  SONG_NEW: '/song/new',
  SONG_EDIT: (id: string) => `/song/${id}/edit`,
  LISTS: '/lists',
  LIST_DETAIL: (id: string) => `/lists/${id}`,
  TAGS: '/tags',
  ARTISTS: '/artists', // TODO: Phase 8 - Artists page
} as const
