// Route paths

export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  ALL_SONGS: '/', // Legacy - V1
  LIBRARY: '/', // V2 - User's personal library
  SONG_NEW: '/song/new',
  SONG_EDIT: (id: string) => `/song/${id}/edit`,
  LISTS: '/lists',
  LIST_DETAIL: (id: string) => `/lists/${id}`,
  TAGS: '/tags',
  ARTISTS: '/artists',
  SETTINGS: '/settings',
} as const
