/**
 * Provider-agnostic contract for the song creation flow's search step (see
 * docs/SONG_CREATION_FLOW.md). Swapping the backing API (Spotify today,
 * something else later) means writing a new class against this interface —
 * nothing above this seam should know which provider is active.
 */

export interface SongTitleSuggestion {
  /** Display title, already deduped/normalized by the provider. */
  title: string
  /**
   * Distinct artist-sets performing this title (most likely first). A
   * duet/co-credit is one entry, e.g. ['Ike & Tina Turner'], never split.
   * Empty when the provider has no artist data for this title.
   */
  artistSets: string[][]
}

export interface ArtistSuggestion {
  /** Display name, deduped by the provider. */
  name: string
}

export interface SongSearchProvider {
  /** Up to `limit` suggestions matching `query`, deduped by title. */
  searchTitles(query: string, limit?: number): Promise<SongTitleSuggestion[]>
  /** Up to `limit` artist name suggestions matching `query`. */
  searchArtists(query: string, limit?: number): Promise<ArtistSuggestion[]>
}
