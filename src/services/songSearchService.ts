export interface SongTitleSuggestion {
  title: string
  artistSets: string[][]
}

export interface ArtistSuggestion {
  name: string
}

interface SongSearchResponse {
  suggestions: SongTitleSuggestion[]
  error?: string
}

interface ArtistSearchResponse {
  suggestions: ArtistSuggestion[]
  error?: string
}

/**
 * Calls the song-search Netlify Function (backed by whichever provider is
 * configured server-side — see netlify/functions/lib/providers/index.ts).
 */
export async function searchSongTitles(query: string): Promise<SongTitleSuggestion[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const res = await fetch(`/.netlify/functions/song-search?q=${encodeURIComponent(trimmed)}`)
  const json = (await res.json()) as SongSearchResponse

  if (!res.ok || json.error) {
    throw new Error(json.error || `Song search failed: ${res.status}`)
  }

  return json.suggestions
}

/**
 * Calls the artist-search Netlify Function (same provider seam as song search).
 */
export async function searchArtistNames(query: string): Promise<ArtistSuggestion[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const res = await fetch(`/.netlify/functions/artist-search?q=${encodeURIComponent(trimmed)}`)
  const json = (await res.json()) as ArtistSearchResponse

  if (!res.ok || json.error) {
    throw new Error(json.error || `Artist search failed: ${res.status}`)
  }

  return json.suggestions
}
