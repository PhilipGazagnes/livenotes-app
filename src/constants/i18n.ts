/**
 * Internationalization constants
 * All user-facing text strings for the application
 */

export const I18N = {
  // ============================================================================
  // APP
  // ============================================================================
  APP: {
    NAME: 'Livenotes',
  },

  // ============================================================================
  // BUTTONS & ACTIONS
  // ============================================================================
  BUTTONS: {
    CREATE: 'Create',
    SAVE: 'Save',
    CANCEL: 'Cancel',
    EDIT: 'Edit',
    DELETE: 'Delete',
    RENAME: 'Rename',
    DUPLICATE: 'Duplicate',
    ADD: 'Add',
    REMOVE: 'Remove',
    DISCARD: 'Discard',
    GO_BACK: 'Go Back',
    KEEP_EDITING: 'Keep Editing',
    SELECT: 'Select',
    SELECT_ALL: 'Select All',
    DESELECT_ALL: 'Deselect All',
    DONE: 'Done',
  },

  // Loading states for buttons
  LOADING: {
    SAVING: 'Saving...',
    CREATING: 'Creating...',
    SIGNING_IN: 'Signing in...',
    CREATING_ACCOUNT: 'Creating account...',
  },

  // ============================================================================
  // NAVIGATION & MENU
  // ============================================================================
  NAVIGATION: {
    ALL_SONGS: 'All Songs',
    TAGS: 'Tags',
    LISTS: 'Lists',
    LOGOUT: 'Logout',
  },

  // ============================================================================
  // PAGE TITLES
  // ============================================================================
  PAGE_TITLES: {
    ALL_SONGS: 'All Songs',
    NEW_SONG: 'New Song',
    EDIT_SONG: 'Edit Song',
    TAGS: 'Tags',
    LISTS: 'Lists',
    LIST_DETAIL: 'List',
    LOGIN: 'Sign in to your account',
    SIGNUP: 'Create your account',
  },

  // ============================================================================
  // FORM LABELS
  // ============================================================================
  FORM: {
    TITLE: 'Title',
    ARTIST: 'Artist',
    NOTES: 'Notes',
    POC_ID: 'POC ID',
    EMAIL: 'Email',
    PASSWORD: 'Password',
    CONFIRM_PASSWORD: 'Confirm Password',
    TAG_NAME: 'Tag Name',
    LIST_NAME: 'List Name',
    REQUIRED: '*',
  },

  // ============================================================================
  // FORM PLACEHOLDERS
  // ============================================================================
  PLACEHOLDERS: {
    SONG_TITLE: 'Song title',
    ARTIST_NAME: 'Artist name',
    SONG_NOTES: 'Add notes about this song...',
    POC_ID: '####',
    EMAIL: 'your@email.com',
    PASSWORD: '••••••••',
    TAG_NAME: 'Enter tag name',
    LIST_NAME: 'Enter list name...',
    SEARCH_SONGS: 'Search songs...',
    TAG_NAME_SHORT: 'Tag name...',
    LIST_NAME_SHORT: 'List name...',
  },

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================
  AUTH: {
    SIGN_IN: 'Sign In',
    SIGN_UP: 'Sign Up',
    SIGN_IN_WITH_GOOGLE: 'Sign in with Google',
    SIGN_IN_WITH_FACEBOOK: 'Sign in with Facebook',
    SIGN_UP_WITH_GOOGLE: 'Sign up with Google',
    SIGN_UP_WITH_FACEBOOK: 'Sign up with Facebook',
    OR_CONTINUE_WITH: 'Or continue with',
    NO_ACCOUNT: "Don't have an account?",
    HAVE_ACCOUNT: 'Already have an account?',
    SIGN_UP_LINK: 'Sign up',
    SIGN_IN_LINK: 'Sign in',
    PASSWORD_MIN_LENGTH: 'At least 6 characters',
    PASSWORD_MISMATCH: 'Passwords do not match',
    PASSWORD_TOO_SHORT: 'Password must be at least 6 characters',
  },

  // ============================================================================
  // EMPTY STATES
  // ============================================================================
  EMPTY_STATES: {
    NO_SONGS: {
      TITLE: 'No songs yet',
      SUBTITLE: 'Get started by creating your first song',
      CTA: 'Create Your First Song',
    },
    NO_TAGS: {
      TITLE: 'No tags yet',
      SUBTITLE: 'Organize your songs with tags',
      CTA: 'Create Your First Tag',
    },
    NO_LISTS: {
      TITLE: 'No lists yet',
      SUBTITLE: 'Create playlists to organize your songs',
      CTA: 'Create Your First List',
    },
    LIST_NO_SONGS: {
      TITLE: 'No songs in this list',
      SUBTITLE: 'Add songs to this list from the song menu',
    },
    LIST_NOT_FOUND: {
      TITLE: 'List not found',
      SUBTITLE: 'This list may have been deleted',
    },
    NO_TAGS_IN_MODAL: 'No tags yet. Create one above!',
    NO_LISTS_IN_MODAL: 'No lists yet. Create one above!',
    NO_RESULTS: 'No songs match your search or filter criteria',
  },

  // ============================================================================
  // MODALS & DIALOGS
  // ============================================================================
  MODALS: {
    CREATE_TAG: 'Create Tag',
    RENAME_TAG: 'Rename Tag',
    DELETE_TAG: 'Delete Tag',
    CREATE_LIST: 'Create New List',
    RENAME_LIST: 'Rename List',
    DELETE_LIST: 'Delete List',
    MANAGE_TAGS: 'Manage Tags',
    MANAGE_LISTS: 'Manage Lists',
    DISCARD_CHANGES: 'Discard Changes?',
    DUPLICATE_SONG: 'Duplicate Song',
    FILTER_BY_TAGS: 'Filter by Tags',
  },

  // ============================================================================
  // MODAL CONTENT
  // ============================================================================
  MODAL_CONTENT: {
    CREATE_NEW_TAG: 'Create new tag:',
    CREATE_NEW_LIST: 'Create new list:',
    AVAILABLE_TAGS: 'Available tags:',
    AVAILABLE_LISTS: 'Available lists:',
    MANAGE_TAGS_TITLE: (songTitle: string) => `Manage Tags - ${songTitle}`,
    MANAGE_LISTS_TITLE: (songTitle: string) => `Manage Lists - ${songTitle}`,
    DUPLICATE_SONG_CONFIRM: (songTitle: string) => `Create a copy of "${songTitle}"?`,
    BULK_DELETE_SONGS_TITLE: (count: number) => `Delete ${count} ${count === 1 ? 'Song' : 'Songs'}?`,
    BULK_DELETE_SONGS_MESSAGE: (count: number) => `This will permanently delete ${count} ${count === 1 ? 'song' : 'songs'}. This action cannot be undone.`,
    BULK_DELETE_LISTS_TITLE: (count: number) => `Delete ${count} ${count === 1 ? 'List' : 'Lists'}?`,
    BULK_DELETE_LISTS_MESSAGE: (count: number) => `This will permanently delete ${count} ${count === 1 ? 'list' : 'lists'}. Songs will remain in your library.`,
    BULK_ASSIGN_TAGS_TITLE: 'Assign Tags to Songs',
    BULK_REMOVE_TAGS_TITLE: 'Remove Tags from Songs',
    BULK_ADD_TO_LISTS_TITLE: 'Add Songs to Lists',
  },

  // ============================================================================
  // DROPDOWN MENU ACTIONS
  // ============================================================================
  DROPDOWN: {
    REMOVE_FROM_LIST: 'Remove from List',
    EDIT: 'Edit',
    DUPLICATE: 'Duplicate',
    MANAGE_TAGS: 'Manage Tags',
    MANAGE_LISTS: 'Manage Lists',
    DELETE: 'Delete',
    RENAME: 'Rename',
    CREATE_NEW_SONG: 'Create New Song',
    SELECT_SONGS: 'Select Songs',
  },

  // ============================================================================
  // CHARACTER COUNTERS
  // ============================================================================
  COUNTERS: {
    CHARACTERS: (current: number, max: number) => `${current} / ${max} characters`,
    CHAR_COUNT: (current: number, max: number) => `${current}/${max}`,
    SELECTED: (count: number) => `${count} selected`,
  },

  // ============================================================================
  // PLURALIZATION
  // ============================================================================
  PLURALS: {
    SONG: (count: number) => (count === 1 ? 'song' : 'songs'),
    TAG: (count: number) => (count === 1 ? 'tag' : 'tags'),
    LIST: (count: number) => (count === 1 ? 'list' : 'lists'),
    SONG_COUNT: (count: number) => `${count} ${count === 1 ? 'song' : 'songs'}`,
    TAG_COUNT: (count: number) => `${count} ${count === 1 ? 'tag' : 'tags'}`,
    LIST_COUNT: (count: number) => `${count} ${count === 1 ? 'list' : 'lists'}`,
  },

  // ============================================================================
  // BULK ACTIONS
  // ============================================================================
  BULK_ACTIONS: {
    DELETE: 'Delete Songs',
    ADD_TO_LISTS: 'Add to Lists',
    ASSIGN_TAGS: 'Assign Tags',
    REMOVE_TAGS: 'Remove Tags',
    REMOVE_FROM_LIST: 'Remove from List',
    DELETE_LISTS: 'Delete Lists',
  },

  // ============================================================================
  // VALIDATION ERRORS (inline)
  // ============================================================================
  VALIDATION: {
    TAG_NAME_REQUIRED: 'Tag name is required',
    TAG_NAME_TOO_LONG: 'Tag name must be 50 characters or less',
    TAG_ALREADY_EXISTS: 'A tag with this name already exists',
    LIST_NAME_REQUIRED: 'List name is required',
    LIST_NAME_TOO_LONG: 'List name must be 50 characters or less',
    LIST_ALREADY_EXISTS: 'A list with this name already exists',
    PROJECT_NOT_FOUND: 'Project not found',
    SONG_ID_REQUIRED: 'Song ID is required',
    SONG_NOT_FOUND: 'Song not found',
  },

  // ============================================================================
  // ARIA LABELS (Accessibility)
  // ============================================================================
  ARIA: {
    MENU: 'Menu',
    CLOSE_MENU: 'Close menu',
    CLOSE: 'Close',
    LIST_OPTIONS: 'List options',
    SONG_OPTIONS: 'Song options',
    TAG_OPTIONS: 'Tag options',
    MOVE_UP: 'Move up',
    MOVE_DOWN: 'Move down',
  },

  // ============================================================================
  // TOAST MESSAGES (Success/Error)
  // ============================================================================
  TOAST: {
    REMOVED_FROM_LIST: (listName: string) => `Removed from ${listName}`,
    BULK_DELETED_SONGS: (count: number) => `Deleted ${count} ${count === 1 ? 'song' : 'songs'}`,
    BULK_ADDED_TO_LISTS: (count: number) => `Added ${count} ${count === 1 ? 'song' : 'songs'} to lists`,
    BULK_TAGS_ASSIGNED: (count: number) => `Assigned tags to ${count} ${count === 1 ? 'song' : 'songs'}`,
    BULK_TAGS_REMOVED: (count: number) => `Removed tags from ${count} ${count === 1 ? 'song' : 'songs'}`,
    BULK_DELETED_LISTS: (count: number) => `Deleted ${count} ${count === 1 ? 'list' : 'lists'}`,
    BULK_REMOVED_FROM_LIST: (count: number, listName: string) => `Removed ${count} ${count === 1 ? 'song' : 'songs'} from ${listName}`,
  },

  // ============================================================================
  // FILTER
  // ============================================================================
  FILTER: {
    SELECTED_TAGS: 'Selected tags',
    AVAILABLE_TAGS: 'Available tags',
    UNCHECK_ALL: 'Uncheck All',
    APPLY: 'Apply',
    FILTER_BY_TAGS: 'Filter by Tags',
  },
} as const

// Type helper for autocomplete
export type I18nKeys = typeof I18N
