<template>
  <Teleport to="body">
    <div
      v-if="editMode.showKeepEditing"
      class="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4"
      role="alertdialog"
      aria-labelledby="keep-editing-title"
    >
      <div class="w-full max-w-sm rounded-lg border border-gray-700 bg-gray-800 p-5 shadow-xl">
        <h2 id="keep-editing-title" class="text-lg font-semibold text-white">{{ I18N.EDIT_MODE.KEEP_TITLE }}</h2>
        <p class="mt-2 text-sm text-gray-300">{{ I18N.EDIT_MODE.KEEP_MESSAGE }}</p>
        <div class="mt-5 flex gap-3">
          <button
            @click="editMode.stopEditing()"
            class="flex-1 rounded-lg border border-gray-600 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            {{ I18N.EDIT_MODE.STOP }}
          </button>
          <button
            @click="editMode.keepEditing()"
            class="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm text-white hover:bg-blue-700 transition-colors"
          >
            {{ I18N.EDIT_MODE.KEEP }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useEditModeStore } from '@/stores/editMode'
import { I18N } from '@/constants/i18n'

const editMode = useEditModeStore()
</script>
