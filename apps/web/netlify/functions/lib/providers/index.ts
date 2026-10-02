import type { SongSearchProvider } from '../songSearchProvider'
import { SpotifySongSearchProvider } from './spotifySongSearchProvider'

/**
 * Single seam for picking the active song search provider. Swapping away
 * from Spotify later means adding a case here (and a class implementing
 * SongSearchProvider) — callers never reference a provider directly.
 */
export function getSongSearchProvider(): SongSearchProvider {
  const provider = process.env.SONG_SEARCH_PROVIDER ?? 'spotify'

  switch (provider) {
    case 'spotify': {
      const clientId = process.env.SPOTIFY_CLIENT_ID
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
      if (!clientId || !clientSecret) {
        throw new Error('SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET are not set')
      }
      return new SpotifySongSearchProvider(clientId, clientSecret)
    }
    default:
      throw new Error(`Unknown SONG_SEARCH_PROVIDER: ${provider}`)
  }
}
