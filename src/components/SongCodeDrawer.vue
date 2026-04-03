<template>
  <ion-modal
    :is-open="isOpen"
    class="songcode-modal"
  >
    <ion-page class="bg-gray-900">
      <ion-header class="bg-gray-800">
        <ion-toolbar class="bg-gray-800" style="--padding-top: 0.5rem; --padding-bottom: 0.5rem; --padding-start: 1rem;">
          <ion-title class="text-white text-base">{{ songTitle }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="handleCancel" class="text-gray-300">
              <ion-icon :icon="closeOutline" slot="icon-only" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="bg-gray-900">
        <!-- Loading State -->
        <div v-if="songcodeStore.isLoading" class="flex justify-center items-center h-full">
          <ion-spinner color="light" />
        </div>

        <!-- Main Content -->
        <div v-else class="flex flex-col h-full p-4 pb-24">
          <!-- SongCode Textarea -->
          <div class="flex-1 flex flex-col">
            <div class="flex justify-between items-center mb-2">
              <label class="text-sm font-medium text-gray-300">SongCode</label>
              <span v-if="songcodeStore.currentSongcode?.songcode_updated_at" class="text-xs text-gray-500">
                Updated {{ formatDate(songcodeStore.currentSongcode.songcode_updated_at) }}
              </span>
            </div>
            <textarea
              v-model="songcodeText"
              class="flex-1 w-full p-3 font-mono text-sm bg-gray-800 border border-gray-700 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
              placeholder="Enter your SongCode here..."
            />
          </div>


          <!-- Livenotes JSON Preview -->
          <div class="flex flex-col mt-4">
            <div class="flex justify-between items-center mb-2">
              <div class="flex items-center gap-2">
                <label class="text-sm font-medium text-gray-300">Livenotes JSON</label>
                <span v-if="isJsonOutdated" class="text-xs px-2 py-0.5 bg-orange-900/30 border border-orange-700 text-orange-400 rounded">
                  Outdated
                </span>
              </div>
              <div class="flex gap-2 items-center">
                <span v-if="songcodeStore.currentSongcode?.livenotes_json_updated_at" class="text-xs text-gray-500">
                  Generated {{ formatDate(songcodeStore.currentSongcode.livenotes_json_updated_at) }}
                </span>
                <button
                  v-if="songcodeStore.currentSongcode?.livenotes_json"
                  @click="handleCopyJson"
                  class="px-3 py-1.5 text-xs bg-gray-700 border border-gray-600 text-gray-300 rounded hover:bg-gray-600 transition-colors flex items-center gap-1"
                >
                  <ion-icon :icon="copyOutline" class="text-sm" />
                  Copy
                </button>
              </div>
            </div>
            <pre v-if="songcodeStore.currentSongcode?.livenotes_json" class="p-3 bg-gray-800 border border-gray-700 rounded text-xs overflow-auto h-52 text-gray-300">{{
              JSON.stringify(songcodeStore.currentSongcode.livenotes_json, null, 2)
            }}</pre>
            <div v-else class="p-3 bg-gray-800 border border-gray-700 rounded text-xs h-52 flex items-center justify-center text-gray-500">
              No JSON generated yet
            </div>
          </div>

          <!-- Error Display -->
          <div v-if="songcodeStore.error" class="mt-4 p-3 bg-red-900/20 border border-red-800 rounded">
            <div class="text-sm text-red-400">{{ songcodeStore.error }}</div>
          </div>
        </div>

        <!-- Sticky Footer -->
        <div class="fixed bottom-0 left-0 right-0 p-4 bg-gray-800 border-t border-gray-700 flex gap-3">
          <button
            type="button"
            @click="handleGenerate"
            :disabled="!songcodeText.trim() || songcodeStore.isLoading"
            class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ songcodeStore.isLoading ? 'Generating...' : 'Generate JSON' }}
          </button>
          <button
            type="button"
            @click="handleSave"
            :disabled="!hasChanges || songcodeStore.isLoading"
            class="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ songcodeStore.isLoading ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </ion-content>
    </ion-page>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  IonModal,
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonSpinner,
  IonIcon,
} from '@ionic/vue'
import { copyOutline, closeOutline } from 'ionicons/icons'
import { useSongcodeStore } from '@/stores/songcode'
import { useUiStore } from '@/stores/ui'

interface Props {
  isOpen: boolean
  songId: string
  songTitle: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const songcodeStore = useSongcodeStore()
const uiStore = useUiStore()

const songcodeText = ref('')
const originalSongcode = ref('')
const hasChanges = computed(() => songcodeText.value !== originalSongcode.value)

// Check if JSON is outdated (songcode updated after JSON generation)
const isJsonOutdated = computed(() => {
  const sc = songcodeStore.currentSongcode
  if (!sc?.songcode_updated_at || !sc?.livenotes_json_updated_at) return false
  
  const songcodeTime = new Date(sc.songcode_updated_at).getTime()
  const jsonTime = new Date(sc.livenotes_json_updated_at).getTime()
  
  return songcodeTime > jsonTime
})

// Load songcode when modal opens
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await songcodeStore.fetchSongcode(props.songId)
    songcodeText.value = songcodeStore.currentSongcode?.songcode || ''
    originalSongcode.value = songcodeText.value
  }
})

async function handleSave() {
  const result = await songcodeStore.updateSongcode(props.songId, songcodeText.value)
  if (result.success) {
    originalSongcode.value = songcodeText.value
    uiStore.showToast('SongCode saved', 'success')
  }
}

async function handleGenerate() {
  // Save first if there are changes
  if (hasChanges.value) {
    const saveResult = await songcodeStore.updateSongcode(props.songId, songcodeText.value)
    if (!saveResult.success) return
    originalSongcode.value = songcodeText.value
  }
  
  // Then generate
  await songcodeStore.generateLivenotesJsonForSong(props.songId)
}

async function handleCopyJson() {
  await songcodeStore.copyLivenotesJsonToClipboard()
}

function handleCancel() {
  // Discard changes and close without saving
  songcodeText.value = originalSongcode.value
  songcodeStore.clearCurrentSongcode()
  emit('close')
}

function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString()
}
</script>

<style scoped>
.songcode-modal {
  --width: 100%;
  --height: 100%;
}

ion-header {
  --background: rgb(31 41 55);
}

ion-toolbar {
  --background: rgb(31 41 55);
  --color: white;
}
</style>
