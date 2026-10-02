import { describe, it, expect } from 'vitest'
import {
  normalizeText,
  validateSongTitle,
  validateSongArtist,
  validateSongNotes,
  validatePocId
} from '../validation'

describe('validation', () => {
  describe('normalizeText', () => {
    it('should trim whitespace', () => {
      expect(normalizeText('  hello  ')).toBe('hello')
    })

    it('should collapse multiple spaces to single space', () => {
      expect(normalizeText('hello    world')).toBe('hello world')
    })

    it('should handle tabs and newlines', () => {
      expect(normalizeText('hello\t\n  world')).toBe('hello world')
    })

    it('should handle empty string', () => {
      expect(normalizeText('')).toBe('')
    })

    it('should handle only whitespace', () => {
      expect(normalizeText('   \t\n  ')).toBe('')
    })
  })

  describe('validateSongTitle', () => {
    it('should accept valid title', () => {
      expect(validateSongTitle('My Song')).toBeNull()
    })

    it('should reject empty title', () => {
      const error = validateSongTitle('')
      expect(error).toBeTruthy()
      expect(error).toContain('required')
    })

    it('should reject whitespace-only title', () => {
      const error = validateSongTitle('   ')
      expect(error).toBeTruthy()
    })

    it('should reject title exceeding max length', () => {
      const longTitle = 'a'.repeat(101) // Assuming max is 100
      const error = validateSongTitle(longTitle)
      expect(error).toBeTruthy()
      expect(error).toContain('too long')
    })

    it('should accept title at max length', () => {
      const maxTitle = 'a'.repeat(100) // Assuming max is 100
      expect(validateSongTitle(maxTitle)).toBeNull()
    })

    it('should trim and normalize before validation', () => {
      expect(validateSongTitle('  valid  song  ')).toBeNull()
    })
  })

  describe('validateSongArtist', () => {
    it('should accept valid artist', () => {
      expect(validateSongArtist('Artist Name')).toBeNull()
    })

    it('should accept empty artist', () => {
      expect(validateSongArtist('')).toBeNull()
    })

    it('should reject artist exceeding max length', () => {
      const longArtist = 'a'.repeat(101) // Assuming max is 100
      const error = validateSongArtist(longArtist)
      expect(error).toBeTruthy()
      expect(error).toContain('long')
    })

    it('should accept artist at max length', () => {
      const maxArtist = 'a'.repeat(100) // Assuming max is 100
      expect(validateSongArtist(maxArtist)).toBeNull()
    })
  })

  describe('validateSongNotes', () => {
    it('should accept valid notes', () => {
      expect(validateSongNotes('Some notes here')).toBeNull()
    })

    it('should accept empty notes', () => {
      expect(validateSongNotes('')).toBeNull()
    })

    it('should reject notes exceeding max length', () => {
      const longNotes = 'a'.repeat(256) // Max is 255
      const error = validateSongNotes(longNotes)
      expect(error).toBeTruthy()
      expect(error).toContain('long')
    })

    it('should accept notes at max length', () => {
      const maxNotes = 'a'.repeat(255) // Max is 255
      expect(validateSongNotes(maxNotes)).toBeNull()
    })

    it('should accept multiline notes', () => {
      const notes = 'Line 1\nLine 2\nLine 3'
      expect(validateSongNotes(notes)).toBeNull()
    })
  })

  describe('validatePocId', () => {
    it('should accept empty POC ID', () => {
      expect(validatePocId('')).toBeNull()
    })

    it('should accept exactly 4 characters', () => {
      expect(validatePocId('ABCD')).toBeNull()
      expect(validatePocId('1234')).toBeNull()
      expect(validatePocId('A1B2')).toBeNull()
    })

    it('should reject less than 4 characters', () => {
      const error = validatePocId('ABC')
      expect(error).toBeTruthy()
      expect(error).toContain('4')
    })

    it('should reject more than 4 characters', () => {
      const error = validatePocId('ABCDE')
      expect(error).toBeTruthy()
      expect(error).toContain('4')
    })
  })
})
