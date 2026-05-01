import type { Ref } from 'vue'

export function useArtistFormList(artistIds: Ref<(string | null)[]>) {
  function handleAddArtist() {
    artistIds.value.push(null)
  }

  function handleRemoveArtist(index: number) {
    artistIds.value.splice(index, 1)
    if (artistIds.value.length === 0) {
      artistIds.value.push(null)
    }
  }

  function handleMoveArtistUp(index: number) {
    if (index > 0) {
      const temp = artistIds.value[index]
      artistIds.value[index] = artistIds.value[index - 1]
      artistIds.value[index - 1] = temp
    }
  }

  function handleMoveArtistDown(index: number) {
    if (index < artistIds.value.length - 1) {
      const temp = artistIds.value[index]
      artistIds.value[index] = artistIds.value[index + 1]
      artistIds.value[index + 1] = temp
    }
  }

  return { handleAddArtist, handleRemoveArtist, handleMoveArtistUp, handleMoveArtistDown }
}
