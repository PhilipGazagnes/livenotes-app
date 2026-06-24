<template>
  <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white">New public library</h2>
      <button
        @click="drawerStore.pop()"
        :disabled="isLoading"
        class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :aria-label="I18N.ARIA.CLOSE"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-6 space-y-5" :class="{ 'pointer-events-none opacity-60': isLoading }">
    <!-- Name -->
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.FORM.NAME }}</label>
      <input
        v-model="form.name"
        type="text"
        maxlength="60"
        class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        :placeholder="I18N.PLACEHOLDERS.LIBRARY_NAME"
        @input="onNameInput"
      />
    </div>

    <!-- Slug -->
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.FORM.URL_SLUG }}</label>
      <input
        v-model="form.slug"
        type="text"
        maxlength="40"
        class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none lowercase"
        :placeholder="I18N.PLACEHOLDERS.URL_SLUG"
      />
      <p v-if="settingsStore.projectSlug" class="text-xs text-gray-500 mt-1">
        URL: /{{ settingsStore.projectSlug }}/{{ form.slug || '...' }}
      </p>
    </div>

    <!-- Tags -->
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-2">{{ I18N.FORM.TAGS_FILTER }}</label>
      <div v-if="tagsStore.tags.length === 0" class="text-sm text-gray-500">{{ I18N.EMPTY_STATES.NO_TAGS_AVAILABLE }}</div>
      <div v-else class="flex flex-wrap gap-2">
        <button
          v-for="tag in tagsStore.tags"
          :key="tag.id"
          @click="toggleTag(tag.id)"
          class="px-3 py-1 rounded-full text-sm border transition-colors"
          :class="form.tagIds.includes(tag.id)
            ? 'bg-blue-600 border-blue-500 text-white'
            : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500'"
        >{{ tag.name }}</button>
      </div>
    </div>

    <!-- Header image mobile -->
    <div>
      <label class="block text-sm text-gray-400 mb-1">
        Header image — mobile URL <span class="text-gray-600">(shown below 768 px instead of title)</span>
      </label>
      <input
        v-model="form.headerImageMobile"
        type="url"
        class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        :placeholder="I18N.PLACEHOLDERS.COVER_URL"
      />
    </div>

    <!-- Header image desktop -->
    <div>
      <label class="block text-sm text-gray-400 mb-1">
        Header image — desktop URL <span class="text-gray-600">(shown from 768 px instead of title)</span>
      </label>
      <input
        v-model="form.headerImageDesktop"
        type="url"
        class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        :placeholder="I18N.PLACEHOLDERS.COVER_URL"
      />
    </div>
  </div>

  <div class="flex-shrink-0 p-4 border-t border-gray-700 flex gap-3">
    <button
      @click="drawerStore.pop()"
      :disabled="isLoading"
      class="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
    >
      {{ I18N.BUTTONS.CANCEL }}
    </button>
    <button
      @click="handleSubmit"
      :disabled="!form.name.trim() || !form.slug.trim() || isLoading"
      class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
    >
      <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      {{ isLoading ? I18N.LOADING.SAVING : I18N.BUTTONS.SAVE }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePublicLibrariesStore } from '@/stores/publicLibraries'
import { useTagsStore } from '@/stores/tags'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { useDrawerStore } from '@/stores/drawer'
import { useUiStore } from '@/stores/ui'
import { I18N } from '@/constants/i18n'
import { slugify } from '@/utils/slugify'

const store = usePublicLibrariesStore()
const tagsStore = useTagsStore()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const drawerStore = useDrawerStore()
const uiStore = useUiStore()

const form = ref({ name: '', slug: '', tagIds: [] as string[], headerImageMobile: '', headerImageDesktop: '' })
const isLoading = ref(false)

onMounted(async () => {
  const projectId = authStore.activeProjectId
  if (projectId) await tagsStore.fetchTags(projectId)
})

function onNameInput() {
  form.value.slug = slugify(form.value.name)
}

function toggleTag(tagId: string) {
  const idx = form.value.tagIds.indexOf(tagId)
  if (idx === -1) form.value.tagIds.push(tagId)
  else form.value.tagIds.splice(idx, 1)
}

async function handleSubmit() {
  const slug = form.value.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '')
  if (!slug) { uiStore.showToast(I18N.VALIDATION.INVALID_SLUG, 'error'); return }

  isLoading.value = true
  try {
    const result = await store.createLibrary(form.value.name, slug, form.value.tagIds, {
      header_image_mobile: form.value.headerImageMobile.trim() || null,
      header_image_desktop: form.value.headerImageDesktop.trim() || null,
    })
    if (result.success) {
      uiStore.showToast(I18N.TOAST.LIBRARY_CREATED, 'success')
      drawerStore.pop()
    } else {
      uiStore.showToast(result.error || I18N.TOAST.LIBRARY_SAVE_FAILED, 'error')
    }
  } finally {
    isLoading.value = false
  }
}
</script>
