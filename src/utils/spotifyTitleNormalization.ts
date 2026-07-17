import { slugify } from './slugify'

/**
 * Keywords found in Spotify track title suffixes that mark a derivative
 * recording (live, remaster, remix, ...) rather than the original release.
 * Not exhaustive — Spotify has no such flag on the track object, so this
 * list is a living heuristic: extend it as new derivative markers turn up
 * in real search results.
 */
export const DERIVATIVE_SUFFIX_KEYWORDS = [
  'live',
  'remaster',
  'remastered',
  'remix',
  'acoustic',
  'demo',
  'edit',
  'radio edit',
  'single version',
  'spotify singles',
  'version',
  'mix',
  'instrumental',
  'karaoke',
  'session',
  'extended',
  'deluxe',
  're-recorded',
  'rerecorded',
  'unplugged',
  'tribute',
  'cover',
  'revisited',
]

const PAREN_SUFFIX = /\s*\(([^()]*)\)\s*$/
const DASH_SUFFIX = /\s+-\s+([^-]+)$/

function containsDerivativeKeyword(segment: string): boolean {
  const folded = segment.toLowerCase()
  return DERIVATIVE_SUFFIX_KEYWORDS.some((keyword) => folded.includes(keyword))
}

export interface NormalizedSpotifyTitle {
  /** Dedup key: derivative suffix stripped, accent/case/punctuation-folded */
  key: string
  /** Derivative suffix stripped, original casing/accents preserved for display */
  strippedTitle: string
  /** True if a live/remaster/remix/... suffix was found and stripped */
  isDerivative: boolean
}

/**
 * Strip trailing "- Live", "(Remastered)", "- Remix"-style suffixes from a
 * Spotify track title so live/remaster/remix versions of the same song
 * collapse to the same dedup key as the original, instead of each eating a
 * separate slot in the top-5 suggestions.
 */
export function normalizeSpotifyTitle(rawTitle: string): NormalizedSpotifyTitle {
  let title = rawTitle.trim()
  let isDerivative = false

  while (true) {
    const parenMatch = title.match(PAREN_SUFFIX)
    if (parenMatch && containsDerivativeKeyword(parenMatch[1])) {
      title = title.slice(0, parenMatch.index).trim()
      isDerivative = true
      continue
    }

    const dashMatch = title.match(DASH_SUFFIX)
    if (dashMatch && containsDerivativeKeyword(dashMatch[1])) {
      title = title.slice(0, dashMatch.index).trim()
      isDerivative = true
      continue
    }

    break
  }

  return { key: slugify(title), strippedTitle: title, isDerivative }
}
