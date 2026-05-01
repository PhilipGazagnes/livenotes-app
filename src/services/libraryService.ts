import { supabase } from '@/lib/supabase'
import type { LibrarySongWithDetails, Note } from '@/types/database'

export async function fetchLibrarySongWithDetails(id: string): Promise<LibrarySongWithDetails> {
  const { data, error } = await supabase
    .from('library_songs')
    .select(`
      *,
      song:songs_v2!library_songs_song_id_fkey(
        *,
        artists:song_artists_v2(
          position,
          artist:artists_v2(*)
        )
      ),
      tags:library_song_tags(
        tag:tags(*)
      ),
      notes:notes(*),
      lists:list_items(
        list:lists(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  if (!data) throw new Error('Library song not found')

  return {
    ...data,
    song: {
      ...data.song,
      artists: data.song.artists
        ?.map((sa: any) => ({
          ...sa.artist,
          position: sa.position,
        }))
        .filter(Boolean)
        .sort((a: any, b: any) => a.position - b.position) ?? [],
    },
    tags: data.tags?.map((lst: any) => lst.tag).filter(Boolean) ?? [],
    notes: (data.notes ?? []) as unknown as Note[],
    lists: data.lists?.map((li: any) => li.list).filter(Boolean) ?? [],
  }
}
