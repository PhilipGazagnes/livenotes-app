import type { Context } from '@netlify/functions'
import { getSongSearchProvider } from './lib/providers/index'

const MAX_QUERY_LENGTH = 200

export default async (req: Request, _context: Context) => {
  const query = new URL(req.url).searchParams.get('q')?.trim() ?? ''

  if (!query) {
    return Response.json({ suggestions: [] })
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return Response.json({ error: 'query_too_long' }, { status: 400 })
  }

  try {
    const provider = getSongSearchProvider()
    const suggestions = await provider.searchTitles(query)
    return Response.json({ suggestions })
  } catch (err) {
    console.error('song-search failed', err)
    return Response.json({ suggestions: [], error: 'search_failed' }, { status: 502 })
  }
}
