<template>
  <ion-page>
    <ion-content>
      <AppHeader :title="I18N.PAGE_TITLES.PUBLIC_LIBRARIES" :show-back="true" :show-menu="true">
      </AppHeader>

      <div class="p-4 space-y-4 pb-24">
        <!-- No slug warning -->
        <div v-if="!settingsStore.projectSlug" class="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
          <p class="text-yellow-300 text-sm">
            You need to set a project URL slug in Project settings (avatar menu) before your public library URLs will work.
          </p>
        </div>

        <!-- Library list -->
        <div v-if="store.isLoading" class="flex justify-center py-12">
          <BaseLoadingSpinner />
        </div>

        <div v-else-if="store.libraries.length === 0" class="text-center py-12">
          <svg class="w-20 h-20 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
          </svg>
          <h2 class="text-xl font-semibold text-white mb-2">{{ I18N.EMPTY_STATES.NO_PUBLIC_LIBRARIES.TITLE }}</h2>
          <p class="text-gray-400 mb-6">{{ I18N.EMPTY_STATES.NO_PUBLIC_LIBRARIES.SUBTITLE }}</p>
        </div>

        <div v-else class="space-y-3">
          <BaseCard
            v-for="lib in filteredLibraries"
            :key="lib.id"
            :id="lib.id"
            :title="lib.name"
            :title-segments="getTitleSegments(lib)"
            :text="settingsStore.projectSlug ? `/${settingsStore.projectSlug}/${lib.slug}` : undefined"
            :tags="lib.tags"
            :dropdown-items="getLibraryMenuItems(lib)"
          />
        </div>

      </div>

      <BaseStickyBar
        v-model:search-query="searchQuery"
        :all-item-ids="filteredLibraries.map(l => l.id)"
        :filters-enabled="false"
        @new-clicked="openCreate"
        @choose-action-clicked="handleChooseAction"
      />

      <!-- Create / Edit modal -->
      <div v-if="showForm" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
        <div class="w-full max-w-md bg-gray-900 rounded-xl border border-gray-700 p-6 space-y-4">
          <h2 class="text-lg font-semibold text-white">{{ editingId ? 'Edit library' : 'New public library' }}</h2>

          <!-- Name -->
          <div>
            <label class="block text-sm text-gray-400 mb-1">{{ I18N.FORM.NAME }}</label>
            <input
              v-model="form.name"
              type="text"
              maxlength="60"
              class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              :placeholder="I18N.PLACEHOLDERS.LIBRARY_NAME"
              @input="onNameInput"
            />
          </div>

          <!-- Slug -->
          <div>
            <label class="block text-sm text-gray-400 mb-1">{{ I18N.FORM.URL_SLUG }}</label>
            <input
              v-model="form.slug"
              type="text"
              maxlength="40"
              class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none lowercase"
              :placeholder="I18N.PLACEHOLDERS.URL_SLUG"
            />
            <p v-if="settingsStore.projectSlug" class="text-xs text-gray-500 mt-1">
              URL: /{{ settingsStore.projectSlug }}/{{ form.slug || '...' }}
            </p>
          </div>

          <!-- Tags -->
          <div>
            <label class="block text-sm text-gray-400 mb-2">{{ I18N.FORM.TAGS_FILTER }}</label>
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

          <!-- Header images -->
          <div>
            <label class="block text-sm text-gray-400 mb-1">Header image — mobile URL <span class="text-gray-600">(shown below 768 px instead of title)</span></label>
            <input
              v-model="form.headerImageMobile"
              type="url"
              class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              :placeholder="I18N.PLACEHOLDERS.COVER_URL"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Header image — desktop URL <span class="text-gray-600">(shown from 768 px instead of title)</span></label>
            <input
              v-model="form.headerImageDesktop"
              type="url"
              class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              :placeholder="I18N.PLACEHOLDERS.COVER_URL"
            />
          </div>

          <!-- Active toggle (edit only) -->
          <div v-if="editingId" class="flex items-center justify-between">
            <span class="text-sm text-gray-300">{{ I18N.SETTINGS.ACTIVE }}</span>
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
              {{ I18N.BUTTONS.CANCEL }}
            </button>
            <button
              @click="handleSubmit"
              :disabled="!form.name.trim() || !form.slug.trim() || store.isLoading"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ store.isLoading ? I18N.LOADING.SAVING : I18N.BUTTONS.SAVE }}
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { IonPage, IonContent } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseLoadingSpinner from '@/components/BaseLoadingSpinner.vue'
import BaseStickyBar from '@/components/BaseStickyBar.vue'
import BulkActionsDrawer from '@/components/BulkActionsDrawer.vue'
import type { BulkAction } from '@/types/bulkAction'
import ConfirmDrawer from '@/components/ConfirmDrawer.vue'
import { I18N } from '@/constants/i18n'
import { usePublicLibrariesStore } from '@/stores/publicLibraries'
import { useSettingsStore } from '@/stores/settings'
import { useTagsStore } from '@/stores/tags'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useDrawerStore } from '@/stores/drawer'
import { slugify } from '@/utils/slugify'
import { useFuseSearch } from '@/composables/useFuseSearch'
import PublicLibraryFormDrawer from '@/components/PublicLibraryFormDrawer.vue'
import type { PublicLibraryWithTags } from '@/types/database'

const store = usePublicLibrariesStore()
const settingsStore = useSettingsStore()
const tagsStore = useTagsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()
const drawerStore = useDrawerStore()

const searchQuery = ref('')

const { filteredItems: filteredLibraries, getTitleSegments } =
  useFuseSearch(computed(() => store.libraries), searchQuery, l => l.name, () => undefined)


function getLibraryMenuItems(lib: PublicLibraryWithTags) {
  return [
    { label: I18N.DROPDOWN.EDIT, callback: () => openEdit(lib) },
    { label: I18N.DROPDOWN.DELETE, variant: 'danger' as const, callback: () => handleDelete(lib.id) },
  ]
}

const showForm = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ name: '', slug: '', tagIds: [] as string[], isActive: true, headerImageMobile: '', headerImageDesktop: '' })

onMounted(async () => {
  const projectId = authStore.activeProjectId
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

function handleChooseAction() {
  const actions: BulkAction[] = [
    { label: I18N.DROPDOWN.DELETE, variant: 'danger', keepDrawerOpen: true, onClick: handleBulkDelete },
  ]
  drawerStore.push(BulkActionsDrawer, { actions })
}

function handleBulkDelete() {
  const count = uiStore.selectedIds.length
  const ids = [...uiStore.selectedIds]
  const label = count !== 1 ? 'libraries' : 'library'

  drawerStore.push(ConfirmDrawer, {
    title: `Delete ${count} ${label}?`,
    message: `This will permanently delete ${count} public ${label}.`,
    confirmLabel: I18N.BUTTONS.DELETE,
    cancelLabel: I18N.BUTTONS.CANCEL,
    confirmVariant: 'danger',
    confirmCallback: async () => {
      try {
        for (const id of ids) {
          await store.deleteLibrary(id)
        }
        uiStore.showToast(`Deleted ${count} public ${label}`, 'success')
        uiStore.exitSelectionMode()
        drawerStore.popAll()
      } catch (err) {
        uiStore.showErrorToast('delete libraries', err as Error)
        drawerStore.popAll()
      }
    },
  })
}

function openCreate() {
  drawerStore.push(PublicLibraryFormDrawer, {})
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
  if (!slug) { uiStore.showToast(I18N.VALIDATION.INVALID_SLUG, 'error'); return }

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
    uiStore.showToast(editingId.value ? I18N.TOAST.LIBRARY_UPDATED : I18N.TOAST.LIBRARY_CREATED, 'success')
  } else {
    uiStore.showToast(result.error || I18N.TOAST.LIBRARY_SAVE_FAILED, 'error')
  }
}

function handleDelete(id: string) {
  drawerStore.push(ConfirmDrawer, {
    title: I18N.MODALS.DELETE_LIBRARY,
    message: I18N.MODAL_CONTENT.DELETE_LIBRARY_CONFIRM,
    confirmLabel: I18N.BUTTONS.DELETE,
    cancelLabel: I18N.BUTTONS.CANCEL,
    confirmVariant: 'danger',
    confirmCallback: async () => {
      try {
        const result = await store.deleteLibrary(id)
        if (result.success) {
          uiStore.showToast(I18N.TOAST.LIBRARY_DELETED, 'success')
          drawerStore.popAll()
        } else {
          uiStore.showToast(result.error || I18N.TOAST.LIBRARY_DELETE_FAILED, 'error')
          drawerStore.popAll()
        }
      } catch (err) {
        uiStore.showErrorToast('delete library', err as Error)
        drawerStore.popAll()
      }
    },
  })
}
</script>
