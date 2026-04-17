// User-facing messages

export const MESSAGES = {
  // Auth messages
  SUCCESS: {
    LOGIN: 'Welcome back!',
    SIGNUP: 'Account created! Welcome to Livenotes',
    LOGOUT: 'Signed out successfully',
    SONG_CREATED: 'Song created',
    SONG_UPDATED: 'Song updated',
    SONG_DELETED: 'Song deleted',
    SONG_DUPLICATED: 'Song duplicated',
    TAG_CREATED: 'Tag created',
    TAG_UPDATED: 'Tag renamed',
    TAG_DELETED: 'Tag deleted',
    TAGS_UPDATED: 'Tags updated',
    LIST_CREATED: 'List created',
    LIST_RENAMED: 'List renamed',
    LIST_UPDATED: 'List updated',
    LIST_DELETED: 'List deleted',
    LISTS_UPDATED: 'Lists updated',
    ORDER_UPDATED: 'Order updated',
  },

  ERROR: {
    LOGIN_FAILED: 'Login failed. Please check your credentials.',
    SIGNUP_FAILED: 'Signup failed. Please try again.',
    LOGOUT_FAILED: 'Logout failed. Please try again.',
    TITLE_REQUIRED: 'Title is required',
    TITLE_TOO_LONG: 'Title is too long (max 100 characters)',
    ARTIST_TOO_LONG: 'Artist is too long (max 100 characters)',
    NOTES_TOO_LONG: 'Notes are too long (max 255 characters)',
    POC_ID_INVALID: 'POC ID must be exactly 4 characters or empty',
    TAG_NAME_REQUIRED: 'Tag name is required',
    TAG_NAME_TOO_LONG: 'Tag name is too long (max 50 characters)',
    TAG_ALREADY_EXISTS: 'Tag already exists',
    LIST_NAME_REQUIRED: 'List name is required',
    LIST_NAME_TOO_LONG: 'List name is too long (max 50 characters)',
    LIST_ALREADY_EXISTS: 'List already exists',
    SONG_ALREADY_IN_LIST: 'Song already in list',
    NETWORK: 'Network error. Please try again.',
    SAVE_FAILED: 'Failed to save. Please try again.',
    OFFLINE: 'You are offline. This action requires an internet connection.',
  },

  // Legacy flat messages (for backward compatibility if needed)
  SUCCESS_SONGS_DELETED: (count: number) => `${count} songs deleted`,
  SUCCESS_TAGS_ASSIGNED: (count: number) => `Tags assigned to ${count} songs`,
  SUCCESS_TAGS_REMOVED: (count: number) => `Tags removed from ${count} songs`,
  SUCCESS_REMOVED_FROM_LIST: (listName: string) => `Removed from ${listName}`,
  SUCCESS_SONGS_ADDED_TO_LIST: (count: number, listName: string) => 
    `${count} songs added to ${listName}`,
  
  // Confirmation messages
  CONFIRM_DELETE_SONG: (title: string) => 
    `Delete '${title}'? This cannot be undone.`,
  CONFIRM_DELETE_SONGS: (count: number) => 
    `Delete ${count} songs? This cannot be undone.`,
  CONFIRM_DELETE_TAG: (name: string) => 
    `Delete tag '${name}'? It will be removed from all songs.`,
  CONFIRM_DELETE_LIST: (name: string) => 
    `Delete list '${name}'? Songs will not be deleted.`,
  CONFIRM_UNSAVED_CHANGES: 'You have unsaved changes. Discard them?',
  
  // Empty states
  EMPTY_NO_SONGS: 'No songs yet',
  EMPTY_NO_SONGS_SUBTITLE: 'Create your first song!',
  EMPTY_NO_SEARCH_RESULTS: 'No songs match your search',
  EMPTY_NO_SEARCH_RESULTS_SUBTITLE: 'Try different keywords or clear filters',
  EMPTY_NO_FILTER_RESULTS: 'No songs with selected tags',
  EMPTY_NO_FILTER_RESULTS_SUBTITLE: 'Try different tag combinations',
  EMPTY_LIST_NO_SONGS: 'This list is empty',
  EMPTY_LIST_NO_SONGS_SUBTITLE: 'Add songs from the All Songs page',
  EMPTY_LIST_NO_SEARCH_RESULTS: 'No songs match in this list',
  EMPTY_NO_TAGS: 'No tags yet',
  EMPTY_NO_TAGS_SUBTITLE: 'Create tags to organize your songs',
  EMPTY_NO_LISTS: 'No lists yet',
  EMPTY_NO_LISTS_SUBTITLE: 'Create a list to organize your songs',
} as const
