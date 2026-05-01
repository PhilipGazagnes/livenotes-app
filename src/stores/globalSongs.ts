import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/utils/supabase'
import type { SongV2, SongV2WithArtists, ArtistV2 } from '@/types/database'

/**
 * Global Songs Store (V2)
 * Manages the global song catalog - songs available to all users
 */
export const useGlobalSongsStore = defineStore('globalSongs', () => {
  // State
  const songs = ref<SongV2WithArtists[]>([])
  const artists = ref<ArtistV2[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions - Songs
  
  /**
   * Search songs in the global catalog
   * Includes duplicate detection via fingerprint matching
   */
  async function searchSongs(query: string): Promise<SongV2WithArtists[]> {
    if (!query.trim()) return []
    
    isLoading.value = true
    error.value = null
    
    try {
      const fingerprint = query.toLowerCase().replace(/[^a-z0-9]/g, '')
      
      const { data, error: searchError } = await supabase
        .from('songs_v2')
        .select(`
          *,
          artists:song_artists_v2(
            position,
            artist:artists_v2(*)
          )
        `)
        .or(`title.ilike.%${query}%,fingerprint.eq.${fingerprint}`)
        .order('popularity_score', { ascending: false })
        .limit(20)
      
      if (searchError) throw searchError
      
      // Transform to include artists with position
      const results = (data || []).map(song => ({
        ...song,
        artists: song.artists
          ?.map((sa: any) => ({
            ...sa.artist,
            position: sa.position,
          }))
          .filter(Boolean)
          .sort((a: any, b: any) => a.position - b.position) ?? [],
      }))
      
      return results
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to search songs'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new song in the global catalog
   */
  async function createSong(
    title: string,
    artistIds: string[]
  ): Promise<SongV2> {
    isLoading.value = true
    error.value = null
    
    try {
      // 1. Create the song
      const { data: { user: songUser } } = await supabase.auth.getUser()
      if (!songUser) throw new Error('User not authenticated')

      const { data: song, error: songError } = await supabase
        .from('songs_v2')
        .insert({ title, created_by: songUser.id })
        .select()
        .single()
      
      if (songError) throw songError
      
      // 2. Link artists (if any)
      if (artistIds.length > 0) {
        const { error: linkError } = await supabase
          .from('song_artists_v2')
          .insert(
            artistIds.map((artistId, index) => ({
              song_id: song.id,
              artist_id: artistId,
              position: index + 1,
            }))
          )
        
        if (linkError) throw linkError
      }
      
      return song
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create song'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get a single song by ID
   */
  async function getSongById(songId: string): Promise<SongV2WithArtists | null> {
    try {
      const { data, error: fetchError } = await supabase
        .from('songs_v2')
        .select(`
          *,
          artists:song_artists_v2(
            position,
            artist:artists_v2(*)
          )
        `)
        .eq('id', songId)
        .single()
      
      if (fetchError) throw fetchError
      if (!data) return null
      
      return {
        ...data,
        artists: data.artists
          ?.map((sa: any) => ({
            ...sa.artist,
            position: sa.position,
          }))
          .filter(Boolean)
          .sort((a: any, b: any) => a.position - b.position) ?? [],
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch song'
      return null
    }
  }

  // Actions - Artists
  
  /**
   * Search artists in the global catalog
   */
  async function searchArtists(query: string): Promise<ArtistV2[]> {
    if (!query.trim()) return []
    
    try {
      const { data, error: searchError } = await supabase
        .from('artists_v2')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(20)
      
      if (searchError) throw searchError
      return data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to search artists'
      throw err
    }
  }

  /**
   * Create a new artist in the global catalog
   */
  async function createArtist(name: string): Promise<ArtistV2> {
    isLoading.value = true
    error.value = null
    
    try {
      const { data: { user: artistUser } } = await supabase.auth.getUser()
      if (!artistUser) throw new Error('User not authenticated')

      const { data, error: createError } = await supabase
        .from('artists_v2')
        .insert({ name, created_by: artistUser.id })
        .select()
        .single()
      
      if (createError) throw createError
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create artist'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get or create artist by name (for quick creation flow)
   */
  async function getOrCreateArtist(name: string): Promise<ArtistV2> {
    // First, search for existing
    const existing = await searchArtists(name)
    const exactMatch = existing.find(
      a => a.name.toLowerCase() === name.toLowerCase()
    )
    
    if (exactMatch) return exactMatch
    
    // Create new if not found
    return createArtist(name)
  }

  return {
    // State
    songs,
    artists,
    isLoading,
    error,
    
    // Actions
    searchSongs,
    createSong,
    getSongById,
    searchArtists,
    createArtist,
    getOrCreateArtist,
  }
})
