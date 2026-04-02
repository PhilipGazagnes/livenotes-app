# Livenotes Offline & Performance Implementation Plan

**Created**: April 2, 2026  
**Status**: Planning Phase

---

## Phase 1: Fix Reordering Performance (Immediate - 1-2 hours)

### Problem
- Currently: One API call per item when reordering (100 items = 100 sequential API calls)
- Result: 10-30 second delays, poor UX, high Supabase quota usage

### Solution: Batch Update with Optimistic UI

#### 1.1 Update `reorderListItems` in lists store

**Current (suspected):**
```typescript
// src/stores/lists.ts
async function reorderListItems(listId: string, itemIds: string[]) {
  for (let i = 0; i < itemIds.length; i++) {
    await supabase
      .from('list_items')
      .update({ position: i })
      .eq('id', itemIds[i])
  }
}
```

**Fix to:**
```typescript
async function reorderListItems(listId: string, itemIds: string[]) {
  // Build update query with position updates
  const updates = itemIds.map((id, index) => ({
    id,
    position: index
  }))
  
  // Single batch upsert (or use Supabase RPC function)
  const { error } = await supabase
    .from('list_items')
    .upsert(updates)
  
  return { success: !error, error: error?.message }
}
```

**Alternative: PostgreSQL RPC Function**
```sql
-- Migration: create function for batch position update
CREATE OR REPLACE FUNCTION update_list_item_positions(
  item_updates jsonb
)
RETURNS void AS $$
DECLARE
  item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(item_updates)
  LOOP
    UPDATE list_items
    SET position = (item->>'position')::integer
    WHERE id = (item->>'id')::uuid;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

```typescript
// Then call from store
const { error } = await supabase.rpc('update_list_item_positions', {
  item_updates: itemIds.map((id, index) => ({ id, position: index }))
})
```

#### 1.2 Add Optimistic Updates in ListDetailPage

```typescript
// src/pages/ListDetailPage.vue
async function handleDrop(event: DragEvent, index: number) {
  // ... existing drag calculation ...
  
  // 1. Update UI immediately (optimistic)
  const items = [...displayedItems.value]
  const [draggedItem] = items.splice(draggedIdx, 1)
  items.splice(dropIdx, 0, draggedItem)
  
  // Update local state immediately
  currentList.value.items = items
  
  // 2. Sync to server in background
  const itemIds = items.map(item => item.id)
  const result = await listsStore.reorderListItems(currentList.value.id, itemIds)
  
  if (result.success) {
    uiStore.showToast('Order updated', 'success')
  } else {
    // Rollback on error
    await handleRefresh()
    uiStore.showToast(result.error || 'Failed to update order', 'error')
  }
  
  handleDragEnd()
}
```

**Expected improvement:** 100 items reorder goes from 10-30 seconds to <1 second

---

## Phase 2: Offline-First Architecture (2-3 weeks)

### Overview
- **Local-first**: All data operations happen on IndexedDB first
- **Background sync**: Changes sync to Supabase when online
- **Real-time subscriptions**: Pull updates from other users when online
- **Conflict resolution**: Last-write-wins with timestamps

### 2.1 Technology Stack

```json
{
  "dependencies": {
    "dexie": "^3.2.4",              // IndexedDB wrapper
    "dexie-react-hooks": "^1.1.7",   // React/Vue hooks (optional)
    "idb": "^7.1.1",                 // Alternative: simpler IndexedDB
    "workbox-core": "^7.0.0",        // Service worker utilities
    "@supabase/realtime-js": "^2.9.3" // Already included in supabase-js
  }
}
```

### 2.2 Database Schema (IndexedDB)

```typescript
// src/db/schema.ts
import Dexie, { Table } from 'dexie'

export interface LocalSong {
  id: string
  // ... all song fields
  _local_updated_at: number      // Local modification timestamp
  _synced: boolean                // Has this been synced to server?
  _deleted: boolean               // Soft delete flag
}

export interface LocalList {
  id: string
  // ... all list fields
  _local_updated_at: number
  _synced: boolean
  _deleted: boolean
}

export interface LocalListItem {
  id: string
  // ... all list_item fields
  _local_updated_at: number
  _synced: boolean
  _deleted: boolean
}

export interface SyncQueue {
  id?: number
  entity_type: 'song' | 'list' | 'list_item' | 'tag' | 'artist'
  entity_id: string
  operation: 'create' | 'update' | 'delete'
  payload: any
  created_at: number
  retries: number
}

class LivenotesDB extends Dexie {
  songs!: Table<LocalSong>
  lists!: Table<LocalList>
  list_items!: Table<LocalListItem>
  tags!: Table<LocalTag>
  artists!: Table<LocalArtist>
  sync_queue!: Table<SyncQueue>

  constructor() {
    super('LivenotesDB')
    this.version(1).stores({
      songs: 'id, project_id, *tags, _synced, _deleted',
      lists: 'id, project_id, _synced, _deleted',
      list_items: 'id, list_id, song_id, position, _synced, _deleted',
      tags: 'id, project_id, _synced, _deleted',
      artists: 'id, project_id, _synced, _deleted',
      sync_queue: '++id, entity_type, entity_id, created_at'
    })
  }
}

export const db = new LivenotesDB()
```

### 2.3 Sync Engine Architecture

```typescript
// src/services/sync/SyncEngine.ts

export class SyncEngine {
  private supabase: SupabaseClient
  private db: LivenotesDB
  private isOnline: boolean = navigator.onLine
  private syncInterval: number | null = null
  private realtimeSubscription: RealtimeChannel | null = null

  constructor(supabase: SupabaseClient, db: LivenotesDB) {
    this.supabase = supabase
    this.db = db
    this.setupNetworkListeners()
  }

  // 1. Initial Sync (on login or app start)
  async initialSync(userId: string) {
    const projectId = await this.getPersonalProjectId(userId)
    
    // Fetch user's assigned lists and songs
    const { data: lists } = await this.supabase
      .from('lists')
      .select('*, items(*)')
      .eq('project_id', projectId)
    
    const songIds = new Set()
    lists.forEach(list => {
      list.items.forEach(item => songIds.add(item.song_id))
    })
    
    const { data: songs } = await this.supabase
      .from('songs')
      .select('*, tags(*), artists(*)')
      .in('id', Array.from(songIds))
    
    // Store in IndexedDB
    await db.songs.bulkPut(songs.map(s => ({
      ...s,
      _local_updated_at: Date.now(),
      _synced: true,
      _deleted: false
    })))
    
    await db.lists.bulkPut(lists.map(l => ({
      ...l,
      _local_updated_at: Date.now(),
      _synced: true,
      _deleted: false
    })))
    
    return { success: true }
  }

  // 2. Push local changes to server
  async pushChanges() {
    const queue = await db.sync_queue
      .orderBy('created_at')
      .toArray()
    
    for (const item of queue) {
      try {
        await this.syncItem(item)
        await db.sync_queue.delete(item.id!)
      } catch (error) {
        console.error('Sync failed for item:', item, error)
        // Increment retry counter
        await db.sync_queue.update(item.id!, {
          retries: item.retries + 1
        })
      }
    }
  }

  private async syncItem(item: SyncQueue) {
    const table = this.getTableName(item.entity_type)
    
    switch (item.operation) {
      case 'create':
      case 'update':
        const { error } = await this.supabase
          .from(table)
          .upsert(item.payload)
        if (error) throw error
        
        // Mark as synced in local DB
        await this.updateLocalSyncStatus(item.entity_type, item.entity_id, true)
        break
        
      case 'delete':
        await this.supabase
          .from(table)
          .delete()
          .eq('id', item.entity_id)
        
        // Remove from local DB
        await this.deleteLocalEntity(item.entity_type, item.entity_id)
        break
    }
  }

  // 3. Pull remote changes (Real-time subscriptions)
  setupRealtimeSync(projectId: string) {
    if (!this.isOnline) return
    
    this.realtimeSubscription = this.supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'songs',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => this.handleRemoteChange('song', payload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lists',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => this.handleRemoteChange('list', payload)
      )
      .subscribe()
  }

  private async handleRemoteChange(
    entityType: string,
    payload: RealtimePostgresChangesPayload<any>
  ) {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    switch (eventType) {
      case 'INSERT':
      case 'UPDATE':
        // Check for conflicts (last-write-wins)
        const local = await this.getLocalEntity(entityType, newRecord.id)
        
        if (!local || newRecord.updated_at > local._local_updated_at) {
          // Remote is newer, update local
          await this.updateLocalEntity(entityType, {
            ...newRecord,
            _local_updated_at: Date.now(),
            _synced: true,
            _deleted: false
          })
          
          // Notify UI of change
          this.emit('remote-update', { entityType, entity: newRecord })
        }
        // If local is newer, we'll push it on next sync
        break
        
      case 'DELETE':
        await this.deleteLocalEntity(entityType, oldRecord.id)
        this.emit('remote-delete', { entityType, entityId: oldRecord.id })
        break
    }
  }

  // 4. Network state management
  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.pushChanges() // Sync queued changes
      this.setupRealtimeSync(this.getCurrentProjectId())
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
      this.realtimeSubscription?.unsubscribe()
    })
  }

  // 5. Periodic background sync (every 30 seconds when online)
  startPeriodicSync() {
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline) {
        this.pushChanges()
      }
    }, 30000)
  }

  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
  }
}
```

### 2.4 Update Pinia Stores (Example: Songs)

```typescript
// src/stores/songs.ts
import { db } from '@/db/schema'
import { syncEngine } from '@/services/sync/SyncEngine'

export const useSongsStore = defineStore('songs', () => {
  const songs = ref<SongWithTags[]>([])
  const isLoading = ref(false)

  // Fetch from IndexedDB (instant)
  async function fetchSongs(projectId: string) {
    isLoading.value = true
    
    // Get from local DB first
    const localSongs = await db.songs
      .where('project_id')
      .equals(projectId)
      .and(song => !song._deleted)
      .toArray()
    
    songs.value = localSongs
    isLoading.value = false
    
    // Trigger background sync if online
    if (navigator.onLine) {
      syncEngine.pushChanges()
    }
  }

  // Create song (write to IndexedDB + queue for sync)
  async function createSong(projectId: string, songData: CreateSongInput) {
    const newSong = {
      id: crypto.randomUUID(),
      ...songData,
      project_id: projectId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _local_updated_at: Date.now(),
      _synced: false,
      _deleted: false
    }
    
    // 1. Write to IndexedDB immediately
    await db.songs.add(newSong)
    
    // 2. Add to sync queue
    await db.sync_queue.add({
      entity_type: 'song',
      entity_id: newSong.id,
      operation: 'create',
      payload: newSong,
      created_at: Date.now(),
      retries: 0
    })
    
    // 3. Update UI immediately
    songs.value.unshift(newSong)
    
    // 4. Trigger sync if online
    if (navigator.onLine) {
      syncEngine.pushChanges()
    }
    
    return { success: true, data: newSong }
  }

  // Update song
  async function updateSong(songId: string, updates: Partial<Song>) {
    const existing = await db.songs.get(songId)
    if (!existing) return { success: false, error: 'Song not found' }
    
    const updated = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
      _local_updated_at: Date.now(),
      _synced: false
    }
    
    await db.songs.put(updated)
    
    await db.sync_queue.add({
      entity_type: 'song',
      entity_id: songId,
      operation: 'update',
      payload: updated,
      created_at: Date.now(),
      retries: 0
    })
    
    // Update UI
    const index = songs.value.findIndex(s => s.id === songId)
    if (index !== -1) {
      songs.value[index] = updated
    }
    
    if (navigator.onLine) {
      syncEngine.pushChanges()
    }
    
    return { success: true, data: updated }
  }

  // Delete song (soft delete)
  async function deleteSong(songId: string) {
    await db.songs.update(songId, {
      _deleted: true,
      _synced: false,
      _local_updated_at: Date.now()
    })
    
    await db.sync_queue.add({
      entity_type: 'song',
      entity_id: songId,
      operation: 'delete',
      payload: { id: songId },
      created_at: Date.now(),
      retries: 0
    })
    
    songs.value = songs.value.filter(s => s.id !== songId)
    
    if (navigator.onLine) {
      syncEngine.pushChanges()
    }
    
    return { success: true }
  }

  return {
    songs,
    isLoading,
    fetchSongs,
    createSong,
    updateSong,
    deleteSong
  }
})
```

### 2.5 UI Indicators

```vue
<!-- src/components/SyncStatus.vue -->
<template>
  <div class="fixed top-4 right-4 z-50">
    <!-- Offline indicator -->
    <div v-if="!isOnline" class="bg-orange-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"/>
      </svg>
      <span class="text-sm font-medium">Offline Mode</span>
    </div>
    
    <!-- Syncing indicator -->
    <div v-else-if="isSyncing" class="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
      <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
      </svg>
      <span class="text-sm font-medium">Syncing...</span>
    </div>
    
    <!-- Pending changes badge -->
    <div v-else-if="pendingChanges > 0" class="bg-yellow-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span class="text-sm font-medium">{{ pendingChanges }} pending</span>
    </div>
  </div>
</template>
```

### 2.6 Service Worker for Background Sync

```typescript
// public/sw.js
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST)

// Cache API responses with network-first strategy
registerRoute(
  ({ url }) => url.origin === 'https://qmnbjnyypyhiachhqilh.supabase.co',
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3
  })
)

// Background sync for queued changes
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-changes') {
    event.waitUntil(syncQueuedChanges())
  }
})

async function syncQueuedChanges() {
  // Trigger sync engine to push changes
  const clients = await self.clients.matchAll()
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_TRIGGERED' })
  })
}
```

---

## Phase 2 Implementation Steps

### Step 1: Setup IndexedDB (Days 1-2)
- [ ] Install Dexie
- [ ] Create database schema
- [ ] Add migration for version 1
- [ ] Test basic CRUD operations

### Step 2: Build Sync Engine (Days 3-5)
- [ ] Create SyncEngine class
- [ ] Implement push changes logic
- [ ] Implement pull changes (Realtime)
- [ ] Add network state listeners
- [ ] Test conflict resolution

### Step 3: Update Pinia Stores (Days 6-8)
- [ ] Refactor songs store
- [ ] Refactor lists store
- [ ] Refactor tags store
- [ ] Refactor artists store
- [ ] Add sync queue management

### Step 4: UI Updates (Days 9-10)
- [ ] Add SyncStatus component
- [ ] Add offline indicators
- [ ] Show "Syncing..." states
- [ ] Handle sync errors gracefully

### Step 5: Service Worker (Days 11-12)
- [ ] Setup Workbox
- [ ] Configure background sync
- [ ] Test offline functionality
- [ ] Test reconnection behavior

### Step 6: Testing (Days 13-15)
- [ ] Test offline create/update/delete
- [ ] Test sync after reconnection
- [ ] Test concurrent edits (conflict resolution)
- [ ] Test with poor network conditions
- [ ] Load testing with 100+ items in queue

---

## Success Metrics

### Phase 1 (Immediate)
- Reorder 100 items: From 10-30s → <1s
- API calls for reorder: From 100 → 1

### Phase 2 (Offline)
- Initial load: From 2-5s → <500ms (IndexedDB)
- Offline functionality: 100% of features work offline
- Sync time: Queue of 50 changes syncs in <5s
- Data freshness: Real-time updates arrive within 1s when online

---

## Risk Mitigation

### Data Loss Prevention
- Sync queue persists in IndexedDB (survives crashes)
- Retry failed syncs with exponential backoff
- Manual "Force Sync" button for users

### Storage Limits
- IndexedDB: ~50MB on mobile (more than enough for 1000+ songs)
- Monitor storage usage, warn at 80%
- Implement data pruning for old/unused songs

### Conflict Edge Cases
- Show notification when remote changes detected
- "Your version" vs "Server version" comparison UI
- Option to manually merge if last-write-wins fails

---

## Next Actions

1. **Immediate**: Review and approve this plan
2. **Phase 1**: Analyze current `reorderListItems` implementation
3. **Phase 1**: Implement batch update (1-2 hours)
4. **Phase 1**: Test with production data
5. **Phase 2**: Install Dexie and create schema (Day 1)
