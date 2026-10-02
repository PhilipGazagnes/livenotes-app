// Validation rules and constraints

export const VALIDATION = {
  // Song fields
  SONG_TITLE_MIN_LENGTH: 1,
  SONG_TITLE_MAX_LENGTH: 100,
  SONG_ARTIST_MAX_LENGTH: 100,
  SONG_NOTES_MAX_LENGTH: 255,
  SONG_POC_ID_LENGTH: 4, // Exactly 4 or empty
  
  // Tag fields
  TAG_NAME_MIN_LENGTH: 1,
  TAG_NAME_MAX_LENGTH: 50,
  
  // List fields
  LIST_NAME_MIN_LENGTH: 1,
  LIST_NAME_MAX_LENGTH: 50,
  LIST_DESCRIPTION_MAX_LENGTH: 500,
  
  // Note fields (V2)
  NOTE_TITLE_MAX_LENGTH: 100,
  NOTE_CONTENT_MAX_LENGTH: 100000, // 100KB
  
  // Library song custom fields (V2)
  CUSTOM_TITLE_MAX_LENGTH: 100,
  CUSTOM_NOTES_MAX_LENGTH: 500,
  
  // Search & UI
  SEARCH_DEBOUNCE_MS: 200,
  TOAST_DURATION_MS: 3000,
  LOADING_DELAY_MS: 500, // Show spinner only if operation takes longer
} as const

// Note types for validation (V2)
export const NOTE_TYPES = [
  'songcode',
  'plain_text',
  'youtube',
  'image',
  'video',
  'audio',
  'tablature',
  'looper_notes',
  'looper',
  'lyrics',
  'chords',
] as const

export type NoteType = (typeof NOTE_TYPES)[number]
