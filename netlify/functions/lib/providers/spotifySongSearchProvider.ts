import { normalizeSpotifyTitle } from '../../../../src/utils/spotifyTitleNormalization'
import type { ArtistSuggestion, SongSearchProvider, SongTitleSuggestion } from '../songSearchProvider'

const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SEARCH_URL = 'https://api.spotify.com/v1/search'
// Fetch more raw candidates than we'll display, so title-derivative groups
// (Live/Remaster/Remix versions of the same song) have enough room to
// collapse into a handful of distinct titles before we take the top N.
const RAW_CANDIDATE_LIMIT = 50

interface SpotifyTrack {
  name: string
  popularity: number
  artists: { name: string }[]
}

interface SpotifySearchResponse {
  tracks: { items: SpotifyTrack[] }
}

interface SpotifyArtist {
  name: string
}

interface SpotifyArtistSearchResponse {
  artists: { items: SpotifyArtist[] }
}

interface TitleGroup {
  title: string
  isDerivative: boolean
  artistSets: string[][]
}

function sameArtistSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((name, i) => name === b[i])
}

export class SpotifySongSearchProvider implements SongSearchProvider {
  private cachedToken: { value: string; expiresAt: number } | null = null

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string
  ) {}

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      return this.cachedToken.value
    }

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64'),
      },
      body: 'grant_type=client_credentials',
    })

    if (!res.ok) {
      throw new Error(`Spotify token request failed: ${res.status}`)
    }

    const json = (await res.json()) as { access_token: string; expires_in: number }
    // Refresh a minute early so a near-expiry token never gets used mid-request.
    this.cachedToken = {
      value: json.access_token,
      expiresAt: Date.now() + (json.expires_in - 60) * 1000,
    }
    return this.cachedToken.value
  }

  async searchTitles(query: string, limit = 5): Promise<SongTitleSuggestion[]> {
    const token = await this.getAccessToken()

    const url = new URL(SEARCH_URL)
    url.searchParams.set('q', query)
    url.searchParams.set('type', 'track')
    url.searchParams.set('limit', String(RAW_CANDIDATE_LIMIT))

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) {
      throw new Error(`Spotify search failed: ${res.status}`)
    }

    const json = (await res.json()) as SpotifySearchResponse
    const groups = new Map<string, TitleGroup>()
    // Spotify's own relevance ranking, not popularity, decides which titles
    // make the top N — we only dedup within that order, never reorder it.
    const orderedKeys: string[] = []

    for (const track of json.tracks.items) {
      const { key, strippedTitle, isDerivative } = normalizeSpotifyTitle(track.name)
      const artists = track.artists.map((a) => a.name)
      const existing = groups.get(key)

      if (!existing) {
        groups.set(key, { title: strippedTitle, isDerivative, artistSets: [artists] })
        orderedKeys.push(key)
        continue
      }

      if (!existing.artistSets.some((set) => sameArtistSet(set, artists))) {
        existing.artistSets.push(artists)
      }
      // A non-derivative hit replaces a derivative one as the group's display title.
      if (existing.isDerivative && !isDerivative) {
        existing.title = strippedTitle
        existing.isDerivative = false
      }
    }

    return orderedKeys
      .slice(0, limit)
      .map((key) => groups.get(key)!)
      .map(({ title, artistSets }) => ({ title, artistSets }))
  }

  async searchArtists(query: string, limit = 8): Promise<ArtistSuggestion[]> {
    const token = await this.getAccessToken()

    const url = new URL(SEARCH_URL)
    url.searchParams.set('q', query)
    url.searchParams.set('type', 'artist')
    url.searchParams.set('limit', '15')

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) {
      throw new Error(`Spotify artist search failed: ${res.status}`)
    }

    const json = (await res.json()) as SpotifyArtistSearchResponse
    const seen = new Set<string>()
    const results: ArtistSuggestion[] = []

    for (const artist of json.artists.items) {
      const key = artist.name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      results.push({ name: artist.name })
      if (results.length >= limit) break
    }

    return results
  }
}
