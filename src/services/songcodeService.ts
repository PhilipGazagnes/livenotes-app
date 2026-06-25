import { supabase } from '@/lib/supabase'
import type { SongCode, LivenotesJson } from '@/types/database'
import type { Json } from '@/types/supabase'

export async function fetchSongcode(songId: string): Promise<SongCode | null> {
  const { data, error } = await supabase
    .from('songcode')
    .select('song_id, songcode, songcode_updated_at, songcode_updated_by, livenotes_json, livenotes_json_updated_at, livenotes_json_updated_by, created_at')
    .eq('song_id', songId)
    .maybeSingle()
  if (error) throw error
  return data as unknown as SongCode | null
}

export async function upsertSongcode(
  songId: string,
  songcodeText: string,
  userId: string,
): Promise<SongCode> {
  const { data, error } = await supabase
    .from('songcode')
    .upsert({
      song_id: songId,
      songcode: songcodeText.trim(),
      songcode_updated_at: new Date().toISOString(),
      songcode_updated_by: userId,
    })
    .select()
    .single()
  if (error) throw error
  return data as unknown as SongCode
}

export async function upsertLivenotesJson(
  songId: string,
  livenotesJson: LivenotesJson,
  userId: string,
): Promise<SongCode> {
  const { data, error } = await supabase
    .from('songcode')
    .upsert({
      song_id: songId,
      livenotes_json: livenotesJson as unknown as Json,
      livenotes_json_updated_at: new Date().toISOString(),
      livenotes_json_updated_by: userId,
    })
    .select()
    .single()
  if (error) throw error
  return data as unknown as SongCode
}
