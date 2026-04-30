import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/utils/supabase'
import type { Artist, ArtistWithCount } from '@/types/database'

export const useArtistsStore = defineStore('artists', () => {
  // State
  const artists = ref<Artist[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const artistCount = computed(() => artists.value.length)
  
  const sortedArtists = computed(() => {
    return [...artists.value].sort((a, b) => a.name.localeCompare(b.name))
  })

  // Actions
  async function fetchArtists(projectId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await supabase
        .from('artists')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true })
      
      if (fetchError) throw fetchError
      artists.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch artists'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchArtistsWithCount(projectId: string): Promise<ArtistWithCount[]> {
    isLoading.value = true
    error.value = null
    
    try {
      // V2: Get all library songs for this project with their artists
      const { data: librarySongs, error: fetchError } = await supabase
        .from('library_songs')
        .select(`
          id,
          song_id,
          songs_v2!inner(
            id,
            song_artists_v2!inner(
              artist_id,
              artists_v2!inner(
                id,
                name,
                created_at,
                updated_at
              )
            )
          )
        `)
        .eq('project_id', projectId)
      
      if (fetchError) throw fetchError
      
      // Aggregate artists and count library songs (not total songs)
      const artistMap = new Map<string, ArtistWithCount>()
      
      librarySongs?.forEach((librarySong: any) => {
        const songArtists = librarySong.songs_v2?.song_artists_v2 || []
        songArtists.forEach((sa: any) => {
          const artist = sa.artists_v2
          if (artist) {
            if (artistMap.has(artist.id)) {
              artistMap.get(artist.id)!.song_count++
            } else {
              artistMap.set(artist.id, {
                id: artist.id,
                project_id: projectId, // Virtual field for compatibility
                name: artist.name,
                created_at: artist.created_at,
                updated_at: artist.updated_at,
                song_count: 1
              })
            }
          }
        })
      })
      
      return Array.from(artistMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch artists with count'
      return []
    } finally {
      isLoading.value = false
    }
  }

  async function createArtist(projectId: string, name: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const trimmedName = name.trim()
      const fingerprint = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '')
      
      // V2: Check if artist exists in shared catalog by fingerprint
      const { data: existing, error: checkError } = await supabase
        .from('artists_v2')
        .select('*')
        .eq('fingerprint', fingerprint)
        .maybeSingle()
      
      if (checkError) throw checkError
      
      if (existing) {
        return { success: true, data: existing, isDuplicate: true }
      }
      
      // Get current user for created_by
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      // Create new artist in V2 shared catalog
      const { data: newArtist, error: createError } = await supabase
        .from('artists_v2')
        .insert({
          name: trimmedName,
          fingerprint: fingerprint,
          created_by: user.id,
        })
        .select()
        .single()
      
      if (createError) throw createError
      
      return { success: true, data: newArtist, isDuplicate: false }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create artist'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function updateArtist(artistId: string, name: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const trimmedName = name.trim()
      const fingerprint = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '')
      
      // V2: Check if user is the creator of this artist
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      const { data: artist, error: fetchError } = await supabase
        .from('artists_v2')
        .select('created_by')
        .eq('id', artistId)
        .single()
      
      if (fetchError) throw fetchError
      
      if (artist.created_by !== user.id) {
        return {
          success: false,
          error: 'Cannot edit artists created by others in the shared catalog'
        }
      }
      
      // Update artist in V2 shared catalog
      const { data: updatedArtist, error: updateError } = await supabase
        .from('artists_v2')
        .update({ 
          name: trimmedName,
          fingerprint: fingerprint,
          updated_at: new Date().toISOString()
        })
        .eq('id', artistId)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      return { success: true, data: updatedArtist }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update artist'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function deleteArtist(artistId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      // V2: Can't delete from shared catalog
      // Instead, check if artist is used in user's library songs
      
      // Get user's library songs
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      // Get user's project
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('owner_id', user.id)
        .single()
      
      if (!project) throw new Error('Project not found')
      
      // Get all library_songs for this project
      const { data: librarySongs } = await supabase
        .from('library_songs')
        .select('song_id')
        .eq('project_id', project.id)
      
      if (!librarySongs || librarySongs.length === 0) {
        return { success: true }
      }
      
      const songIds = librarySongs.map(ls => ls.song_id)
      
      // Check if artist is used in any of user's library songs
      const { data: songArtists, error: checkError } = await supabase
        .from('song_artists_v2')
        .select('id')
        .eq('artist_id', artistId)
        .in('song_id', songIds)
        .limit(1)
      
      if (checkError) throw checkError
      
      if (songArtists && songArtists.length > 0) {
        return { 
          success: false, 
          error: 'Cannot remove artist that is assigned to songs. Remove it from songs first.' 
        }
      }
      
      // If artist is not used in any songs, it will just disappear from the list
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete artist'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  function getArtistById(artistId: string): Artist | undefined {
    return artists.value.find(a => a.id === artistId)
  }

  function getArtistsByIds(artistIds: string[]): Artist[] {
    return artists.value.filter(a => artistIds.includes(a.id))
  }

  function searchArtists(query: string, limit = 5): Artist[] {
    if (!query.trim()) return []
    
    const searchTerm = query.toLowerCase()
    return artists.value
      .filter(artist => artist.name.toLowerCase().includes(searchTerm))
      .slice(0, limit)
  }

  function findExactMatch(name: string): Artist | undefined {
    const trimmedName = name.trim()
    return artists.value.find(
      a => a.name.toLowerCase() === trimmedName.toLowerCase()
    )
  }

  return {
    // State
    artists,
    isLoading,
    error,
    // Getters
    artistCount,
    sortedArtists,
    // Actions
    fetchArtists,
    fetchArtistsWithCount,
    createArtist,
    updateArtist,
    deleteArtist,
    getArtistById,
    getArtistsByIds,
    searchArtists,
    findExactMatch,
  }
})
