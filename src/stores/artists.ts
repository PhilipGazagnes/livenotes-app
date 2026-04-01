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
      // Fetch artists with song count
      const { data, error: fetchError } = await supabase
        .from('artists')
        .select(`
          *,
          song_artists(count)
        `)
        .eq('project_id', projectId)
        .order('name', { ascending: true })
      
      if (fetchError) throw fetchError
      
      // Transform data to include song_count
      const artistsWithCount: ArtistWithCount[] = (data || []).map((artist: any) => ({
        id: artist.id,
        project_id: artist.project_id,
        name: artist.name,
        created_at: artist.created_at,
        updated_at: artist.updated_at,
        song_count: artist.song_artists?.[0]?.count || 0
      }))
      
      return artistsWithCount
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
      
      // Check for duplicate
      const existing = artists.value.find(
        a => a.name.toLowerCase() === trimmedName.toLowerCase()
      )
      if (existing) {
        return { success: true, data: existing, isDuplicate: true }
      }
      
      const { data: newArtist, error: createError } = await supabase
        .from('artists')
        .insert({
          project_id: projectId,
          name: trimmedName,
        })
        .select()
        .single()
      
      if (createError) throw createError
      
      artists.value.push(newArtist)
      artists.value.sort((a, b) => a.name.localeCompare(b.name))
      
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
      const { data: updatedArtist, error: updateError } = await supabase
        .from('artists')
        .update({ name: name.trim() })
        .eq('id', artistId)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      const index = artists.value.findIndex(a => a.id === artistId)
      if (index !== -1) {
        artists.value[index] = updatedArtist
        artists.value.sort((a, b) => a.name.localeCompare(b.name))
      }
      
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
      // Check if artist is used by any songs
      const { data: songArtists, error: checkError } = await supabase
        .from('song_artists')
        .select('id')
        .eq('artist_id', artistId)
        .limit(1)
      
      if (checkError) throw checkError
      
      if (songArtists && songArtists.length > 0) {
        return { 
          success: false, 
          error: 'Cannot delete artist that is assigned to songs' 
        }
      }
      
      const { error: deleteError } = await supabase
        .from('artists')
        .delete()
        .eq('id', artistId)
      
      if (deleteError) throw deleteError
      
      artists.value = artists.value.filter(a => a.id !== artistId)
      
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
