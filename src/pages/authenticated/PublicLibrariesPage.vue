<template>
  <ion-page>
    <ion-content>
      <AppHeader title="Public Libraries" :show-back="true" :show-menu="true">
        <template #action>
          <DropdownMenu :items="headerMenuItems" />
        </template>
      </AppHeader>

      <div class="p-4 space-y-4 pb-24">
        <!-- No slug warning -->
        <div v-if="!settingsStore.projectSlug" class="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
          <p class="text-yellow-300 text-sm">
            You need to set a project URL slug in
            <router-link :to="ROUTES.SETTINGS" class="underline font-medium">Settings</router-link>
            before your public library URLs will work.
          </p>
        </div>

        <!-- Library list -->
        <div v-if="store.isLoading" class="flex justify-center py-12">
          <LoadingSpinner />
        </div>

        <div v-else-if="store.libraries.length === 0" class="text-center py-12">
          <svg class="w-20 h-20 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
          </svg>
          <h2 class="text-xl font-semibold text-white mb-2">No public libraries yet</h2>
          <p class="text-gray-400 mb-6">Create a public library to share a song list with your audience</p>
        </div>

        <div v-else class="space-y-3">
          <Card
            v-for="lib in store.libraries"
            :key="lib.id"
            :title="lib.name"
            :text="settingsStore.projectSlug ? `/${settingsStore.projectSlug}/${lib.slug}` : undefined"
            :tags="lib.tags"
            :dropdown-items="getLibraryMenuItems(lib)"
          />
        </div>

      </div>

      <!-- Create / Edit modal -->
      <div v-if="showForm" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
        <div class="w-full max-w-md bg-gray-900 rounded-xl border border-gray-700 p-6 space-y-4">
          <h2 class="text-lg font-semibold text-white">{{ editingId ? 'Edit library' : 'New public library' }}</h2>

          <!-- Name -->
          <div>
            <label class="block text-sm text-gray-400 mb-1">Name</label>
            <input
              v-model="form.name"
              type="text"
              maxlength="60"
              class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. Saturday Night Setlist"
              @input="onNameInput"
            />
          </div>

          <!-- Slug -->
          <div>
            <label class="block text-sm text-gray-400 mb-1">URL slug</label>
            <input
              v-model="form.slug"
              type="text"
              maxlength="40"
              class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none lowercase"
              placeholder="saturday-night"
            />
            <p v-if="settingsStore.projectSlug" class="text-xs text-gray-500 mt-1">
              URL: /{{ settingsStore.projectSlug }}/{{ form.slug || '...' }}
            </p>
          </div>

          <!-- Tags -->
          <div>
            <label class="block text-sm text-gray-400 mb-2">Tags (songs with any of these tags will appear)</label>
            <div v-if="tagsStore.tags.length === 0" class="text-sm text-gray-500">No tags available</div>
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

          <!-- Header images -->
          <div>
            <label class="block text-sm text-gray-400 mb-1">Header image — mobile URL <span class="text-gray-600">(shown below 768 px instead of title)</span></label>
            <input
              v-model="form.headerImageMobile"
              type="url"
              class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="https://..."
            />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Header image — desktop URL <span class="text-gray-600">(shown from 768 px instead of title)</span></label>
            <input
              v-model="form.headerImageDesktop"
              type="url"
              class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="https://..."
            />
          </div>

          <!-- Active toggle (edit only) -->
          <div v-if="editingId" class="flex items-center justify-between">
            <span class="text-sm text-gray-300">Active</span>
            <button
              @click="form.isActive = !form.isActive"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
              :class="form.isActive ? 'bg-blue-600' : 'bg-gray-600'"
            >
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="form.isActive ? 'translate-x-6' : 'translate-x-1'" />
            </button>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <button @click="showForm = false" class="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button
              @click="handleSubmit"
              :disabled="!form.name.trim() || !form.slug.trim() || store.isLoading"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ store.isLoading ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { IonPage, IonContent } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import DropdownMenu from '@/components/DropdownMenu.vue'
import Card from '@/components/Card.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { ROUTES } from '@/constants/routes'
import { usePublicLibrariesStore } from '@/stores/publicLibraries'
import { useSettingsStore } from '@/stores/settings'
import { useTagsStore } from '@/stores/tags'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { slugify } from '@/utils/slugify'
import type { PublicLibraryWithTags } from '@/types/database'

const store = usePublicLibrariesStore()
const settingsStore = useSettingsStore()
const tagsStore = useTagsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const headerMenuItems = [
  { label: 'Create New', callback: openCreate },
]

function getLibraryMenuItems(lib: PublicLibraryWithTags) {
  return [
    { label: 'Edit', callback: () => openEdit(lib) },
    { label: 'Delete', variant: 'danger' as const, callback: () => handleDelete(lib.id) },
  ]
}

const showForm = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ name: '', slug: '', tagIds: [] as string[], isActive: true, headerImageMobile: '', headerImageDesktop: '' })

onMounted(async () => {
  const projectId = await authStore.getPersonalProjectId()
  if (!projectId) return
  await Promise.all([
    store.loadLibraries(),
    settingsStore.loadProjectSettings(projectId),
    tagsStore.fetchTags(projectId),
  ])
})

function onNameInput() {
  if (!editingId.value) form.value.slug = slugify(form.value.name)
}

function toggleTag(tagId: string) {
  const idx = form.value.tagIds.indexOf(tagId)
  if (idx === -1) form.value.tagIds.push(tagId)
  else form.value.tagIds.splice(idx, 1)
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', slug: '', tagIds: [], isActive: true, headerImageMobile: '', headerImageDesktop: '' }
  showForm.value = true
}

function openEdit(lib: PublicLibraryWithTags) {
  editingId.value = lib.id
  form.value = {
    name: lib.name,
    slug: lib.slug,
    tagIds: lib.tags.map(t => t.id),
    isActive: lib.is_active,
    headerImageMobile: lib.header_image_mobile ?? '',
    headerImageDesktop: lib.header_image_desktop ?? '',
  }
  showForm.value = true
}

async function handleSubmit() {
  const slug = form.value.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '')
  if (!slug) { uiStore.showToast('Invalid slug', 'error'); return }

  const headerImages = {
    header_image_mobile: form.value.headerImageMobile.trim() || null,
    header_image_desktop: form.value.headerImageDesktop.trim() || null,
  }

  let result
  if (editingId.value) {
    result = await store.updateLibrary(editingId.value, { name: form.value.name, slug, is_active: form.value.isActive, ...headerImages }, form.value.tagIds)
  } else {
    result = await store.createLibrary(form.value.name, slug, form.value.tagIds, headerImages)
  }

  if (result.success) {
    showForm.value = false
    uiStore.showToast(editingId.value ? 'Library updated' : 'Library created', 'success')
  } else {
    uiStore.showToast(result.error || 'Failed to save', 'error')
  }
}

async function handleDelete(id: string) {
  const confirmed = await uiStore.showConfirm('Delete library', 'This will remove the public library. The URL will stop working.', 'Delete', 'Cancel')
  if (!confirmed) return
  const result = await store.deleteLibrary(id)
  if (result.success) uiStore.showToast('Library deleted', 'success')
  else uiStore.showToast(result.error || 'Failed to delete', 'error')
}
</script>
