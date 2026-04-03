# SongCode Feature Implementation Plan

**Created**: April 3, 2026  
**Status**: ✅ Completed

---

## Overview

Add SongCode editing and Livenotes JSON generation feature to allow manual conversion of SongCode to Livenotes JSON format for upcoming performances.

### Requirements
- Editable SongCode field per song
- Manual "Generate Livenotes JSON" trigger (uses livenotes-sc-converter)
- "Copy Livenotes JSON" button for clipboard
- Track `updated_at` and `updated_by` for both SongCode and Livenotes JSON
- Client-side conversion (for quick implementation)
- Separate table for performance (large text/JSON data)

---

## Phase 1: Database & Setup (30 min)

### 1.1 Create Migration `009_add_songcode_table.sql`

```sql
-- Migration: Add SongCode Table
-- Description: Separate table for SongCode and generated Livenotes JSON
-- Date: April 3, 2026

-- =============================================================================
-- Create SongCode Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS songcode (
  song_id UUID PRIMARY KEY REFERENCES songs(id) ON DELETE CASCADE,
  songcode TEXT,
  songcode_updated_at TIMESTAMPTZ,
  songcode_updated_by UUID REFERENCES auth.users(id),
  livenotes_json JSONB,
  livenotes_json_updated_at TIMESTAMPTZ,
  livenotes_json_updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE songcode IS 'SongCode and generated Livenotes JSON for songs (one-to-one)';
COMMENT ON COLUMN songcode.songcode IS 'Raw SongCode text format';
COMMENT ON COLUMN songcode.livenotes_json IS 'Generated Livenotes JSON from SongCode (read-only)';

-- =============================================================================
-- Add Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_songcode_song_id ON songcode(song_id);

-- =============================================================================
-- Enable RLS
-- =============================================================================

ALTER TABLE songcode ENABLE ROW LEVEL SECURITY;

-- Users can view songcode for songs they have access to
CREATE POLICY "Users can view songcode for their project songs"
  ON songcode FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM songs s
      JOIN projects p ON s.project_id = p.id
      WHERE s.id = songcode.song_id
        AND p.id IN (
          SELECT project_id FROM project_members
          WHERE user_id = auth.uid()
        )
    )
  );

-- Users can insert songcode for songs they have access to
CREATE POLICY "Users can create songcode for their project songs"
  ON songcode FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM songs s
      JOIN projects p ON s.project_id = p.id
      WHERE s.id = songcode.song_id
        AND p.id IN (
          SELECT project_id FROM project_members
          WHERE user_id = auth.uid()
        )
    )
  );

-- Users can update songcode for songs they have access to
CREATE POLICY "Users can update songcode for their project songs"
  ON songcode FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM songs s
      JOIN projects p ON s.project_id = p.id
      WHERE s.id = songcode.song_id
        AND p.id IN (
          SELECT project_id FROM project_members
          WHERE user_id = auth.uid()
        )
    )
  );

-- Users can delete songcode for songs they have access to
CREATE POLICY "Users can delete songcode for their project songs"
  ON songcode FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM songs s
      JOIN projects p ON s.project_id = p.id
      WHERE s.id = songcode.song_id
        AND p.id IN (
          SELECT project_id FROM project_members
          WHERE user_id = auth.uid()
        )
    )
  );
```

### 1.2 Install Dependencies

```bash
cd /Users/a1234/Documents/www/livenotes-app
npm install livenotes-sc-converter
```

---

## Phase 2: TypeScript Types (15 min)

### 2.1 Update `src/types/database.ts`

Add the SongCode interface:

```typescript
export interface SongCode {
  song_id: string
  songcode: string | null
  songcode_updated_at: string | null
  songcode_updated_by: string | null
  livenotes_json: any | null
  livenotes_json_updated_at: string | null
  livenotes_json_updated_by: string | null
  created_at: string
}
```

---

## Phase 3: Pinia Store (45 min)

### 3.1 Create `src/stores/songcode.ts`

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/utils/supabase'
import type { SongCode } from '@/types/database'
import { useAuthStore } from './auth'
import { generateLivenotesJson } from '@/utils/songcodeConverter'
import { useUiStore } from './ui'

export const useSongcodeStore = defineStore('songcode', () => {
  // State
  const currentSongcode = ref<SongCode | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  
  /**
   * Fetch SongCode for a specific song
   */
  async function fetchSongcode(songId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await supabase
        .from('songcode')
        .select('*')
        .eq('song_id', songId)
        .single()
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (not an error, just no songcode yet)
        throw fetchError
      }
      
      currentSongcode.value = data || null
      return { success: true, data }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch songcode'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update SongCode text
   */
  async function updateSongcode(songId: string, songcodeText: string) {
    const authStore = useAuthStore()
    if (!authStore.userId) {
      error.value = 'User not authenticated'
      return { success: false, error: error.value }
    }

    isLoading.value = true
    error.value = null
    
    try {
      const payload = {
        song_id: songId,
        songcode: songcodeText.trim(),
        songcode_updated_at: new Date().toISOString(),
        songcode_updated_by: authStore.userId,
      }

      const { data, error: upsertError } = await supabase
        .from('songcode')
        .upsert(payload)
        .select()
        .single()
      
      if (upsertError) throw upsertError
      
      currentSongcode.value = data
      return { success: true, data }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update songcode'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Generate Livenotes JSON from current SongCode
   */
  async function generateLivenotesJsonForSong(songId: string) {
    const authStore = useAuthStore()
    const uiStore = useUiStore()
    
    if (!authStore.userId) {
      error.value = 'User not authenticated'
      return { success: false, error: error.value }
    }

    if (!currentSongcode.value?.songcode) {
      error.value = 'No songcode to convert'
      return { success: false, error: error.value }
    }

    isLoading.value = true
    error.value = null
    
    try {
      // Run converter
      const conversionResult = await generateLivenotesJson(currentSongcode.value.songcode)
      
      if (!conversionResult.success) {
        throw new Error(conversionResult.error)
      }

      // Save to database
      const payload = {
        song_id: songId,
        livenotes_json: conversionResult.json,
        livenotes_json_updated_at: new Date().toISOString(),
        livenotes_json_updated_by: authStore.userId,
      }

      const { data, error: updateError } = await supabase
        .from('songcode')
        .upsert(payload)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      currentSongcode.value = data
      uiStore.showToast('Livenotes JSON generated successfully', 'success')
      return { success: true, data }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate Livenotes JSON'
      error.value = errorMsg
      uiStore.showToast(errorMsg, 'error')
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Copy Livenotes JSON to clipboard
   */
  async function copyLivenotesJsonToClipboard() {
    const uiStore = useUiStore()
    
    if (!currentSongcode.value?.livenotes_json) {
      uiStore.showToast('No Livenotes JSON to copy', 'error')
      return { success: false, error: 'No JSON available' }
    }

    try {
      const jsonString = JSON.stringify(currentSongcode.value.livenotes_json, null, 2)
      await navigator.clipboard.writeText(jsonString)
      uiStore.showToast('Livenotes JSON copied to clipboard', 'success')
      return { success: true }
    } catch (err) {
      const errorMsg = 'Failed to copy to clipboard'
      uiStore.showToast(errorMsg, 'error')
      return { success: false, error: errorMsg }
    }
  }

  /**
   * Clear current songcode state
   */
  function clearCurrentSongcode() {
    currentSongcode.value = null
    error.value = null
  }

  return {
    // State
    currentSongcode,
    isLoading,
    error,
    // Actions
    fetchSongcode,
    updateSongcode,
    generateLivenotesJsonForSong,
    copyLivenotesJsonToClipboard,
    clearCurrentSongcode,
  }
})
```

---

## Phase 4: Converter Integration (30 min)

### 4.1 Create `src/utils/songcodeConverter.ts`

```typescript
/**
 * Wrapper for livenotes-sc-converter
 */

// Import the converter
// Note: Adjust import based on actual package exports
import type { SongCodeError } from 'livenotes-sc-converter/dist/errors/SongCodeError'

interface ConversionSuccess {
  success: true
  json: any
}

interface ConversionFailure {
  success: false
  error: string
}

type ConversionResult = ConversionSuccess | ConversionFailure

/**
 * Convert SongCode text to Livenotes JSON
 */
export async function generateLivenotesJson(songcode: string): Promise<ConversionResult> {
  try {
    // Dynamic import to avoid bundling if not needed
    const { default: convert } = await import('livenotes-sc-converter')
    
    // Run conversion
    const result = convert(songcode)
    
    return {
      success: true,
      json: result
    }
  } catch (error) {
    // Extract error message
    let errorMessage = 'Unknown conversion error'
    
    if (error instanceof Error) {
      errorMessage = error.message
      
      // Check if it's a SongCodeError with more details
      if ('line' in error && 'column' in error) {
        const scError = error as any
        errorMessage = `Line ${scError.line}, Column ${scError.column}: ${scError.message}`
      }
    }
    
    return {
      success: false,
      error: errorMessage
    }
  }
}
```

---

## Phase 5: UI Components (90 min)

### 5.1 Create `src/components/SongCodeDrawer.vue`

Full-page modal/drawer for editing SongCode:

```vue
<template>
  <ion-modal
    :is-open="isOpen"
    @didDismiss="handleClose"
    :breakpoints="[0, 1]"
    :initialBreakpoint="1"
  >
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button @click="handleClose">Cancel</ion-button>
          </ion-buttons>
          <ion-title>SongCode Editor</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="handleSave" :disabled="!hasChanges">
              Save
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding">
        <!-- Loading State -->
        <div v-if="songcodeStore.isLoading" class="flex justify-center items-center h-full">
          <ion-spinner />
        </div>

        <!-- Main Content -->
        <div v-else class="flex flex-col h-full gap-4">
          <!-- SongCode Textarea -->
          <div class="flex-1 flex flex-col">
            <div class="flex justify-between items-center mb-2">
              <label class="text-sm font-medium">SongCode</label>
              <span v-if="songcodeStore.currentSongcode?.songcode_updated_at" class="text-xs text-gray-500">
                Updated {{ formatDate(songcodeStore.currentSongcode.songcode_updated_at) }}
              </span>
            </div>
            <textarea
              v-model="songcodeText"
              class="flex-1 w-full p-3 font-mono text-sm border rounded resize-none focus:outline-none focus:ring-2"
              placeholder="Enter your SongCode here..."
            />
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2">
            <ion-button
              expand="block"
              @click="handleGenerate"
              :disabled="!songcodeText.trim() || songcodeStore.isLoading"
              class="flex-1"
            >
              <ion-icon :icon="codeSlash" slot="start" />
              Generate Livenotes JSON
            </ion-button>
          </div>

          <!-- Livenotes JSON Preview -->
          <div v-if="songcodeStore.currentSongcode?.livenotes_json" class="flex flex-col">
            <div class="flex justify-between items-center mb-2">
              <label class="text-sm font-medium">Livenotes JSON</label>
              <div class="flex gap-2 items-center">
                <span class="text-xs text-gray-500">
                  Generated {{ formatDate(songcodeStore.currentSongcode.livenotes_json_updated_at) }}
                </span>
                <ion-button size="small" fill="outline" @click="handleCopyJson">
                  <ion-icon :icon="copyOutline" slot="start" />
                  Copy
                </ion-button>
              </div>
            </div>
            <pre class="p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs overflow-auto max-h-64 border">{{
              JSON.stringify(songcodeStore.currentSongcode.livenotes_json, null, 2)
            }}</pre>
          </div>

          <!-- Error Display -->
          <ion-card v-if="songcodeStore.error" color="danger">
            <ion-card-content>
              <div class="text-sm">{{ songcodeStore.error }}</div>
            </ion-card-content>
          </ion-card>
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
  IonCard,
  IonCardContent,
} from '@ionic/vue'
import { codeSlash, copyOutline } from 'ionicons/icons'
import { useSongcodeStore } from '@/stores/songcode'
import { useUiStore } from '@/stores/ui'

interface Props {
  isOpen: boolean
  songId: string
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

function handleClose() {
  if (hasChanges.value) {
    // TODO: Add confirmation dialog
  }
  songcodeStore.clearCurrentSongcode()
  emit('close')
}

function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString()
}
</script>
```

### 5.2 Update `src/pages/SongDetailPage.vue`

Add button to open SongCode drawer:

```vue
<!-- In the header toolbar, add a button -->
<ion-buttons slot="end">
  <!-- Existing buttons -->
  
  <ion-button @click="openSongcodeDrawer">
    <ion-icon :icon="codeSlash" />
  </ion-button>
</ion-buttons>

<!-- Add the drawer component -->
<SongCodeDrawer
  :is-open="showSongcodeDrawer"
  :song-id="songId"
  @close="showSongcodeDrawer = false"
/>

<!-- In script setup -->
import { codeSlash } from 'ionicons/icons'
import SongCodeDrawer from '@/components/SongCodeDrawer.vue'

const showSongcodeDrawer = ref(false)

function openSongcodeDrawer() {
  showSongcodeDrawer.value = true
}
```

---

## Phase 6: Error Handling & Polish (30 min)

### 6.1 Enhancements

- Add unsaved changes confirmation dialog
- Better error messages for converter failures
- Loading indicators during generation
- Empty state when no songcode exists
- Keyboard shortcuts (Cmd+S to save)
- Dark mode support for code preview

### 6.2 Testing Checklist

- [ ] Create new songcode for a song
- [ ] Edit existing songcode
- [ ] Generate Livenotes JSON
- [ ] Copy JSON to clipboard
- [ ] Handle converter errors gracefully
- [ ] Test on mobile viewport
- [ ] Verify RLS policies work correctly
- [ ] Check updated_at/by tracking

---

## Files Created/Modified

### New Files
- `migrations/009_add_songcode_table.sql`
- `src/stores/songcode.ts`
- `src/components/SongCodeDrawer.vue`
- `src/utils/songcodeConverter.ts`

### Modified Files
- `src/types/database.ts`
- `src/pages/SongDetailPage.vue`
- `package.json`

---

## Estimated Time: 3.5 hours

## Success Criteria

- ✅ SongCode can be edited per song
- ✅ Livenotes JSON can be generated from SongCode
- ✅ JSON can be copied to clipboard
- ✅ Metadata (updated_at/by) is tracked
- ✅ Works on mobile and desktop
- ✅ Errors are handled gracefully

---

## Future Enhancements (Post-MVP)

- Server-side conversion via Edge Function
- Syntax highlighting for SongCode
- Diff view for JSON changes
- Batch conversion for multiple songs
- Export/import SongCode files
- Version history
