// Route paths

export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  LIBRARY: '/project/library', // V2 - User's personal library
  SONG_NEW: '/project/song/new',
  LISTS: '/project/lists',
  LIST_DETAIL: (id: string) => `/project/lists/${id}`,
  TAGS: '/project/tags',
  ARTISTS: '/project/artists',
  SETTINGS: '/project/settings',
  PROJECT_SETTINGS: '/project/project-settings',
  PUBLIC_LIBRARIES: '/project/public-libraries',
  PUBLIC_LIBRARY: (projectSlug: string, librarySlug: string) => `/${projectSlug}/${librarySlug}`,
} as const
