import { supabase } from '@/lib/supabase'
import { commitWrite } from '@/lib/offline/projectWrites'

export function updateListItemTitle(id: string, title: string): Promise<void> {
  return commitWrite(
    async () => {
      const { data, error } = await supabase
        .from('list_items')
        .update({ title })
        .eq('id', id)
        .select('list_id')
      if (error) throw error
      return data.map(item => item.list_id)
    },
    listIds => ({ listIds }),
  ).then(() => undefined)
}

export function createListItemTitle(listId: string, title: string, position: number): Promise<void> {
  return commitWrite(
    async () => {
      const { error } = await supabase
        .from('list_items')
        .insert({ list_id: listId, type: 'title', title, position })
      if (error) throw error
    },
    { listIds: [listId] },
  )
}

export function deleteListItem(id: string): Promise<void> {
  return commitWrite(
    async () => {
      const { data, error } = await supabase
        .from('list_items')
        .delete()
        .eq('id', id)
        .select('list_id')
      if (error) throw error
      return data.map(item => item.list_id)
    },
    listIds => ({ listIds }),
  ).then(() => undefined)
}
