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
    BACK: 'Back',
    CHOOSE: 'Choose',
    COPY: 'Copy',
    GENERATE_JSON: 'Generate JSON',
    SYNC_NOW: 'Sync now',
    CREATE_AND_ADD: 'Create & Add to Library',
    CLEAR: 'Clear',
    ADD_TO_LIBRARY: 'Add to Library',
    RESET: 'Reset',
    DOWNLOAD_CONTACT_CARD: 'Download Contact Card',
    SAVE_CONTACT: 'Save Contact Info',
  },

  // Loading states for buttons
  LOADING: {
    SAVING: 'Saving...',
    CREATING: 'Creating...',
    SIGNING_IN: 'Signing in...',
    CREATING_ACCOUNT: 'Creating account...',
    GENERATING: 'Generating...',
    SYNCING: 'Syncing...',
    SAVING_CONTACT: 'Saving...',
  },

  // ============================================================================
  // NAVIGATION & MENU
  // ============================================================================
  NAVIGATION: {
    ALL_SONGS: 'All Songs',
    TAGS: 'Tags',
    LISTS: 'Lists',
    LOGOUT: 'Logout',
    SETTINGS: 'Settings',
    ARTISTS: 'Artists',
    PROJECT_SETTINGS: 'Project',
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
    SETTINGS: 'Settings',
    ARTISTS: 'Artists',
    PUBLIC_LIBRARIES: 'Public Libraries',
    PROJECT_SETTINGS: 'Project Settings',
    MY_LIBRARY: 'My Library',
    SONGS_WITH_TAG: (tagName: string) => `Songs with tag "${tagName}"`,
    SONGS_BY_ARTIST: (artistName: string) => `Songs by ${artistName}`,
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
    NAME: 'Name',
    URL_SLUG: 'URL slug',
    LABEL: 'Field Label',
    TAGS_FILTER: 'Tags (songs with any of these tags will appear)',
    SONG_TITLE: 'Song Title',
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
    SECTION_TITLE: 'Enter section title',
    LIBRARY_NAME: 'e.g. Saturday Night Setlist',
    URL_SLUG: 'saturday-night',
    COVER_URL: 'https://...',
    PROJECT_SLUG: 'my-band-name',
    FIELD_LABEL: 'Enter label...',
    SONGCODE: 'Enter your SongCode here...',
    NOTE_SONGCODE: 'Enter SongCode notation...',
    NOTE_CONTENT: 'Enter your notes here...',
    LOOPER_BPM: '120',
    LOOPER_PATTERN: 'e.g., Kick-Snare-Kick-Snare',
    LOOPER_PATTERN_VAR1: 'e.g., Double time on chorus',
    LOOPER_PATTERN2: 'e.g., Bass line loop',
    LOOPER_PATTERN_VAR2: 'e.g., Variation for bridge',
    LOOPER_NOTES: 'Additional notes about the looper setup...',
    NOTE_TITLE: 'Enter note title',
    SEARCH_ARTISTS: 'Search artists...',
    SEARCH_OR_ADD_ARTISTS: 'Search or add artists...',
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
    NO_SONGS_MATCH_FILTERS: 'No songs match your filters',
    NO_SONGS_MATCH_SEARCH: 'No songs match your search.',
    NO_LYRICS: 'No lyrics found',
    NO_LYRICS_AVAILABLE: 'No lyrics available for this song',
    NO_LYRICS_FOR_SONG: 'No lyrics for this song',
    NO_JSON_YET: 'No JSON generated yet',
    NO_NOTES_YET: 'No notes yet',
    NO_ARTISTS: 'No artists found',
    NO_PUBLIC_LIBRARIES: {
      TITLE: 'No public libraries yet',
      SUBTITLE: 'Create a public library to share a song list with your audience',
    },
    PUBLIC_LIBRARY_NOT_FOUND: {
      TITLE: 'Not found',
      SUBTITLE: "This library doesn't exist or is no longer active.",
    },
    NO_TAGS_AVAILABLE: 'No tags available',
    SLUG_MISSING_WARNING: 'You need to set a project URL slug in Settings before your public library URLs will work.',
    NO_SONGS_FOUND_CREATE: 'No songs found. Create a new one?',
    LIBRARY_EMPTY: 'Your library is empty',
    LIBRARY_EMPTY_SUBTITLE: 'Search and add songs from the catalog',
    NO_ARTISTS_SUBTITLE: 'Create your first artist to get started',
    NO_SEARCH_RESULTS: 'Try a different search term',
    NO_CONTENT: 'No content',
  },

  // ============================================================================
  // MODALS & DIALOGS
  // ============================================================================
  MODALS: {
    ADD_SONG_TO_LIBRARY: 'Add Song to Library',
    SEARCH_FOR_SONG: 'Search for a song',
    CREATE_TAG: 'Create Tag',
    RENAME_TAG: 'Rename Tag',
    DELETE_TAG: 'Delete Tag',
    DELETE_ARTIST: 'Delete Artist',
    CREATE_LIST: 'Create New List',
    RENAME_LIST: 'Rename List',
    DELETE_LIST: 'Delete List',
    MANAGE_TAGS: 'Manage Tags',
    MANAGE_LISTS: 'Manage Lists',
    DISCARD_CHANGES: 'Discard Changes?',
    DUPLICATE_SONG: 'Duplicate Song',
    FILTER_BY_TAGS: 'Filter by Tags',
    CREATE_ARTIST: 'Create Artist',
    RENAME_ARTIST: 'Rename Artist',
    DELETE_LIBRARY: 'Delete library',
    ADD_TITLE_SECTION: 'Add Title Section',
    EDIT_TITLE_SECTION: 'Edit Title',
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
    DELETE_LIBRARY_CONFIRM: 'This will remove the public library. The URL will stop working.',
    DELETE_ARTIST_CONFIRM: (name: string) => `Are you sure you want to delete "${name}"? This cannot be undone.`,
  },

  // ============================================================================
  // DROPDOWN MENU ACTIONS
  // ============================================================================
  DROPDOWN: {
    REMOVE_FROM_LIST: 'Remove from List',
    REMOVE_FROM_LIBRARY: 'Remove from Library',
    EDIT: 'Edit',
    DUPLICATE: 'Duplicate',
    MANAGE_TAGS: 'Manage Tags',
    MANAGE_LISTS: 'Manage Lists',
    DELETE: 'Delete',
    RENAME: 'Rename',
    CREATE_NEW_SONG: 'Create New Song',
    SELECT_SONGS: 'Select Songs',
    CREATE_NEW_LIST: 'Create New List',
    SELECT_LISTS: 'Select Lists',
    ADD_TITLE_SECTION: 'Add Title Section',
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
    SONG_COUNT_FOUND: (count: number) => `Found ${count} ${count === 1 ? 'song' : 'songs'}`,
    ADDED_COUNT: (count: number) => `Added ${count} ${count === 1 ? 'time' : 'times'}`,
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
    LABEL_LENGTH: 'Label must be between 1 and 30 characters',
    INVALID_SLUG: 'Invalid slug',
    SYNC_REQUIRES_ONLINE: 'You must be online to sync data.',
    PROJECT_SLUG_HINT: 'Lowercase letters, numbers and hyphens only. Cannot be "project".',
    ARTIST_ALREADY_EXISTS: 'An artist with this name already exists',
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
    CLEAR_SEARCH: 'Clear search',
    EDIT_NOTE: 'Edit note',
    DELETE_NOTE: 'Delete note',
    ZOOM_IN: 'Zoom in',
    ZOOM_OUT: 'Zoom out',
    TOGGLE_SHOW_TAGS: 'Toggle show tags in lists',
    TOGGLE_SHOW_LISTS: 'Toggle show lists in lists',
    TOGGLE_SHOW_ARTISTS: 'Toggle show artists in lists',
    TOGGLE_SHOW_LYRICS: 'Toggle show lyrics on tap',
    TOGGLE_FORCE_OFFLINE: 'Toggle force offline mode',
    TOGGLE_SHOW_NOTES_FIELD: 'Toggle show notes field',
    TOGGLE_CONTACT_ENABLED: 'Toggle contact banner on public pages',
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
    TITLE_UPDATED: 'Title updated',
    TITLE_ADDED: 'Title added',
    TITLE_DELETED: 'Title deleted',
    TITLE_SAVE_FAILED: 'Failed to save title',
    TITLE_DELETE_FAILED: 'Failed to delete title',
    LIST_LOAD_FAILED: 'Failed to load list',
    REORDER_FAILED: 'Failed to reorder items',
    MANAGE_TAGS_ERROR: 'Cannot manage tags: missing library song ID',
    MANAGE_LISTS_ERROR: 'Cannot manage lists: missing library song ID',
    NOTES_CANNOT_OPEN: 'Cannot open notes for this song',
    SONGS_REMOVED_FROM_LIBRARY: (count: number) => `${count} ${count === 1 ? 'song' : 'songs'} removed from library`,
    SYNCED_OFFLINE: 'All data synced for offline use',
    SYNC_FAILED: 'Sync failed. Please try again.',
    LABEL_UPDATED: 'Label updated successfully',
    SLUG_SAVED: 'Slug saved',
    SLUG_SAVE_FAILED: 'Failed to save slug',
    SCROLL_SETTINGS_SAVED: 'Scroll settings saved',
    SETTINGS_RESET: 'Settings reset to defaults',
    LIBRARY_UPDATED: 'Library updated',
    LIBRARY_CREATED: 'Library created',
    LIBRARY_SAVE_FAILED: 'Failed to save',
    LIBRARY_DELETED: 'Library deleted',
    LIBRARY_DELETE_FAILED: 'Failed to delete',
    SONGCODE_SAVED: 'SongCode saved',
    SEARCH_SONGS_FAILED: 'Failed to search songs',
    ADD_TO_LIBRARY_FAILED: 'Failed to add song to library',
    CREATE_SONG_FAILED: 'Failed to create song',
    NOTES_FIELD_ENABLED: 'Notes field enabled',
    NOTES_FIELD_DISABLED: 'Notes field disabled',
    SETTING_UPDATE_FAILED: 'Failed to update setting',
    ARTIST_RENAMED: 'Artist renamed successfully',
    ARTIST_DELETED: 'Artist deleted successfully',
    CONTACT_SAVED: 'Contact info saved',
    CONTACT_SAVE_FAILED: 'Failed to save contact info',
    THUMBNAIL_SAVED: 'Thumbnail saved',
    THUMBNAIL_SAVE_FAILED: 'Failed to save thumbnail',
    CONTACT_ENABLED_ON: 'Contact banner enabled',
    CONTACT_ENABLED_OFF: 'Contact banner disabled',
    PROJECT_NAME_SAVED: 'Project name saved',
    PROJECT_NAME_SAVE_FAILED: 'Failed to save project name',
    PROJECT_DESCRIPTION_SAVED: 'Description saved',
    PROJECT_DESCRIPTION_SAVE_FAILED: 'Failed to save description',
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

  // ============================================================================
  // SETTINGS PAGE
  // ============================================================================
  SETTINGS: {
    LIST_DISPLAY: 'List Display',
    SHOW_TAGS: 'Show Tags',
    SHOW_TAGS_DESC: 'Display song tags in list detail view',
    SHOW_LISTS: 'Show Lists',
    SHOW_LISTS_DESC: 'Display which lists contain each song in list detail view',
    SHOW_ARTISTS: 'Show Artists',
    SHOW_ARTISTS_DESC: 'Display artist names in list detail view',
    SHOW_LYRICS_ON_TAP: 'Show lyrics on tap',
    SHOW_LYRICS_ON_TAP_DESC: 'Tap a song to reveal lyrics inline in list view',
    LYRICS_TEXT_SIZE: 'Lyrics default text size',
    NOTES_FIELD: 'Notes Field',
    SHOW_NOTES_FIELD: 'Show Notes Field',
    SHOW_NOTES_FIELD_DESC: 'Display notes field when creating or editing songs',
    FIELD_LABEL_SECTION: 'Field Label',
    FIELD_LABEL_HINT: 'Customize the label for the notes field (e.g., "Looper", "Notes", "About")',
    PUBLIC_LIBRARIES: 'Public Libraries',
    PROJECT_URL_SLUG: 'Project URL slug',
    OFFLINE: 'Offline',
    FORCE_OFFLINE: 'Force Offline Mode',
    FORCE_OFFLINE_DESC: 'Use cached data only. Enable this when connected to a network without internet (e.g. a mixing console hotspot).',
    SYNC_FOR_OFFLINE: 'Sync for offline use',
    NEVER_SYNCED: 'Never synced',
    LAST_SYNCED: (date: string) => `Last synced: ${date}`,
    ACTIVE: 'Active',
    RESET_TO_DEFAULTS: 'Reset to defaults',
    RESET_SETTINGS_TITLE: 'Reset Settings',
    RESET_SETTINGS_CONFIRM: 'Are you sure you want to reset all settings to their default values?',
    PROJECT_NAME: 'Project Name',
    PROJECT_NAME_HINT: 'The name displayed publicly and in your contact card',
    PROJECT_DESCRIPTION: 'Description',
    PROJECT_DESCRIPTION_HINT: 'A short bio or description (max 200 characters)',
    PROJECT_THUMBNAIL: 'Project Thumbnail',
    PROJECT_THUMBNAIL_DESC: 'Image URL displayed on public pages and in the contact card',
    CONTACT_INFO: 'Contact Info',
    CONTACT_SHOW_ON_PUBLIC: 'Show on public pages',
    CONTACT_SHOW_ON_PUBLIC_DESC: 'Display a contact banner on your public library pages',
    CONTACT_PHONE: 'Phone',
    CONTACT_EMAIL: 'Email',
    CONTACT_LOCATION: 'Location',
    CONTACT_WEBSITE: 'Website',
    CONTACT_FACEBOOK: 'Facebook',
    CONTACT_INSTAGRAM: 'Instagram',
    CONTACT_X: 'X (Twitter)',
    CONTACT_YOUTUBE: 'YouTube',
  },

  // ============================================================================
  // NOTES SYSTEM
  // ============================================================================
  NOTES: {
    ADD_NOTE: 'Add Note',
    NEW_NOTE: (type: string) => `New ${type} Note`,
    CHOOSE_TYPE: 'Choose note type',
    FILL_DETAILS: 'Fill in note details',
    TYPE_PROMPT: 'What type of note would you like to add?',
    SONGCODE_TIP: '💡 Tip: Use section markers like [I]ntro, [V]erse, [C]horus, [B]ridge',
    LOOPER_BPM: 'BPM',
    LOOPER_PATTERN: 'Pattern',
    LOOPER_ADDITIONAL_NOTES: 'Additional Notes',
    URL_LABEL: 'URL',
    URL_CONTENT: 'Content',
    TYPE_LABELS: {
      songcode: 'SongCode',
      plain_text: 'Plain Text',
      youtube: 'YouTube',
      image: 'Image',
      video: 'Video',
      audio: 'Audio',
      tablature: 'Tablature',
      looper_notes: 'Looper Notes',
      looper: 'Looper',
      lyrics: 'Lyrics',
      chords: 'Chords',
    },
    TYPE_DESCRIPTIONS: {
      songcode: 'Structured song notation for arrangements',
      plain_text: 'General notes and annotations',
      looper: 'Loop pedal settings with BPM and patterns',
    },
  },

  // ============================================================================
  // SONGCODE DRAWER
  // ============================================================================
  SONGCODE: {
    GENERATE_JSON: 'Generate JSON',
    NO_JSON_YET: 'No JSON generated yet',
    ACTIVE_LABEL: 'Active',
  },

  // ============================================================================
  // LIBRARY PAGE
  // ============================================================================
  LIBRARY: {
    SELECT_SONGS_HINT: 'Select songs to perform bulk actions',
    ADD_FIRST_SONG: 'Add Your First Song',
    REMOVE_FROM_LIBRARY_TITLE: 'Remove from Library',
    REMOVE_FROM_LIBRARY_CONFIRM: (songTitle: string) => `Remove "${songTitle}" from your library?`,
    REMOVE_BUTTON: 'Remove',
    DELETE_SONGS_TITLE: 'Delete Songs',
    DELETE_SONGS_CONFIRM: (count: number) => `Are you sure you want to remove ${count} song(s) from your library?`,
  },

  // ============================================================================
  // RELATIVE TIME
  // ============================================================================
  TIME: {
    JUST_NOW: 'just now',
    MINUTES_AGO: (m: number) => `${m}m ago`,
    HOURS_AGO: (h: number) => `${h}h ago`,
    DAYS_AGO: (d: number) => `${d}d ago`,
  },
  // ============================================================================
  // PUBLIC CONTACT BANNER
  // ============================================================================
  PUBLIC_CONTACT: {
    BROUGHT_BY: 'This entertainment is brought to you by',
    SEE_CONTACT: 'Info / contact',
    CONTACT_CARD_TITLE: (name: string) => `Contact ${name}`,
    DOWNLOAD_VCARD: 'Download Contact Card',
  },
} as const

// Type helper for autocomplete
export type I18nKeys = typeof I18N
