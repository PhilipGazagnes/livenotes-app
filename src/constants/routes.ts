// Route paths

export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  ALL_SONGS: '/project/library', // Legacy - V1
  LIBRARY: '/project/library', // V2 - User's personal library
  SONG_NEW: '/project/song/new',
  SONG_EDIT: (id: string) => `/project/song/${id}/edit`,
  LISTS: '/project/lists',
  LIST_DETAIL: (id: string) => `/project/lists/${id}`,
  TAGS: '/project/tags',
  ARTISTS: '/project/artists',
  SETTINGS: '/project/settings',
  PUBLIC_LIBRARIES: '/project/public-libraries',
  PUBLIC_LIBRARY: (projectSlug: string, librarySlug: string) => `/${projectSlug}/${librarySlug}`,
} as const
