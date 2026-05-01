import { supabase } from '@/utils/supabase'

export async function updateListItemTitle(id: string, title: string): Promise<void> {
  const { error } = await supabase
    .from('list_items')
    .update({ title })
    .eq('id', id)
  if (error) throw error
}

export async function createListItemTitle(listId: string, title: string, position: number): Promise<void> {
  const { error } = await supabase
    .from('list_items')
    .insert({ list_id: listId, type: 'title', title, position })
  if (error) throw error
}

export async function deleteListItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('list_items')
    .delete()
    .eq('id', id)
  if (error) throw error
}
