import type { Ref } from 'vue'

export type ArtistSlot = { id: string; artistId: string | null }

export function useArtistFormList(slots: Ref<ArtistSlot[]>) {
  function handleAddArtist() {
    slots.value.push({ id: crypto.randomUUID(), artistId: null })
  }

  function handleRemoveArtist(index: number) {
    slots.value.splice(index, 1)
    if (slots.value.length === 0) {
      slots.value.push({ id: crypto.randomUUID(), artistId: null })
    }
  }

  function handleMoveArtistUp(index: number) {
    if (index > 0) {
      const temp = slots.value[index]
      slots.value[index] = slots.value[index - 1]
      slots.value[index - 1] = temp
    }
  }

  function handleMoveArtistDown(index: number) {
    if (index < slots.value.length - 1) {
      const temp = slots.value[index]
      slots.value[index] = slots.value[index + 1]
      slots.value[index + 1] = temp
    }
  }

  return { handleAddArtist, handleRemoveArtist, handleMoveArtistUp, handleMoveArtistDown }
}
