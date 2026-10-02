import { MESSAGES } from '@/constants/messages'
import { VALIDATION } from '@/constants/validation'

/**
 * Normalize text by trimming and collapsing multiple spaces to single space
 */
export function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

/**
 * Validate song title
 * @returns Error message or null if valid
 */
export function validateSongTitle(title: string): string | null {
  const normalized = normalizeText(title)
  
  if (normalized.length === 0) {
    return MESSAGES.ERROR.TITLE_REQUIRED
  }
  
  if (normalized.length > VALIDATION.SONG_TITLE_MAX_LENGTH) {
    return MESSAGES.ERROR.TITLE_TOO_LONG
  }
  
  return null // Valid
}

/**
 * Validate song artist
 * @returns Error message or null if valid
 */
export function validateSongArtist(artist: string): string | null {
  const normalized = normalizeText(artist)
  
  if (normalized.length > VALIDATION.SONG_ARTIST_MAX_LENGTH) {
    return MESSAGES.ERROR.ARTIST_TOO_LONG
  }
  
  return null // Valid
}

/**
 * Validate song notes
 * @returns Error message or null if valid
 */
export function validateSongNotes(notes: string): string | null {
  if (notes.length > VALIDATION.SONG_NOTES_MAX_LENGTH) {
    return MESSAGES.ERROR.NOTES_TOO_LONG
  }
  
  return null // Valid
}

/**
 * Validate POC ID (must be exactly 4 characters or empty)
 * @returns Error message or null if valid
 */
export function validatePocId(pocId: string): string | null {
  if (pocId.length === 0) {
    return null // Empty is valid
  }
  
  if (pocId.length !== VALIDATION.SONG_POC_ID_LENGTH) {
    return MESSAGES.ERROR.POC_ID_INVALID
  }
  
  return null // Valid
}
