# Livenotes V1 - Polish & Enhancements Plan

**Status**: Phase 1 - UX Polish & New Features  
**Created**: April 2, 2026

This plan focuses on improving the app based on real usage feedback.

---

## Phase 1: Lists Enhancements

### 1.1 Database Migration - List Titles

**Goal:** Support both song items and title separators in lists.

- [ ] Create database migration
  ```sql
  -- Add type column to list_items
  ALTER TABLE list_items 
  ADD COLUMN type TEXT NOT NULL DEFAULT 'song' 
  CHECK (type IN ('song', 'title'));
  
  -- Add title column (nullable for song items)
  ALTER TABLE list_items 
  ADD COLUMN title TEXT;
  
  -- Make song_id nullable (titles don't have a song)
  ALTER TABLE list_items 
  ALTER COLUMN song_id DROP NOT NULL;
  
  -- Add constraint: if type='song' then song_id required, if type='title' then title required
  ALTER TABLE list_items 
  ADD CONSTRAINT list_item_type_check 
  CHECK (
    (type = 'song' AND song_id IS NOT NULL AND title IS NULL) OR
    (type = 'title' AND song_id IS NULL AND title IS NOT NULL)
  );
  ```

- [ ] Update TypeScript types in `src/types/database.ts`
  ```typescript
  interface ListItem {
    id: string
    list_id: string
    song_id: string | null
    position: number
    type: 'song' | 'title'
    title: string | null
    created_at: string
  }
  
  interface ListItemWithSong extends ListItem {
    song?: SongWithArtistsAndTags
  }
  ```

**Reference:** Keep it simple - titles are just visual separators, no hierarchy.

---

### 1.2 Enhanced Drag & Drop UX

**Goal:** Better visual feedback during drag operations (both mobile and desktop).

- [ ] Install drag & drop library (if not already using one)
  - Consider `@vueuse/gesture` or native HTML5 drag & drop
  - Support both touch (long-press) and mouse

- [ ] Update `ListDetailPage.vue` drag styles:
  - **Dragging item:** Add outer glow + slight tilt (5-10deg rotation)
  - **Original position:** Keep space with gray background placeholder
  - **Insertion indicator:** Glowing horizontal line (absolute position, green/blue accent)
  - **On drop:** Animate items to new positions (simple 200ms transition)

- [ ] CSS classes to create:
  ```css
  .is-dragging {
    /* Outer glow + tilt */
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
    transform: rotate(3deg) scale(1.05);
    opacity: 0.9;
    z-index: 1000;
  }
  
  .drag-placeholder {
    /* Gray background for original space */
    background: rgba(107, 114, 128, 0.2);
    border: 2px dashed rgba(107, 114, 128, 0.4);
  }
  
  .drop-indicator {
    /* Glowing insertion line */
    position: absolute;
    height: 3px;
    background: linear-gradient(90deg, transparent, #3b82f6, transparent);
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);
    left: 0;
    right: 0;
    pointer-events: none;
  }
  ```

- [ ] Update drag logic:
  - Calculate insertion position based on mouse/touch Y coordinate
  - Show indicator line between target items
  - Update positions on drop
  - Save to database

**Reference:** Keep animations simple, focus on clarity over fanciness.

---

### 1.3 Remove Up/Down Arrows

**Goal:** Simplify UI now that drag & drop is enhanced.

- [ ] Remove arrow buttons from `ListSongCard.vue`
- [ ] Remove arrow event handlers from `ListDetailPage.vue`
- [ ] Remove moveUp/moveDown functions from lists store
- [ ] Update UI to show only drag handle (☰)

**Reference:** Drag & drop is now the primary reordering method.

---

### 1.4 Title Cards Implementation

**Goal:** Allow users to add section titles within lists.

- [ ] Create `ListTitleCard.vue` component
  - Display: Large/bold title text (visually stronger than song cards)
  - Drag handle (☰) on left
  - Dropdown menu (⋮) on right
  - Actions: Rename, Delete
  - Style: Different background, larger text, no song metadata

- [ ] Add "Add Title" button to `ListDetailPage.vue`
  - Position: Near top, alongside other controls
  - Opens inline input or simple modal
  - Creates title item in list

- [ ] Update `ListDetailPage.vue` rendering
  - Loop through list items
  - Render `ListTitleCard` for type='title'
  - Render `ListSongCard` for type='song'
  - Both share same drag & drop logic

- [ ] Implement title CRUD in lists store
  - `addTitleToList(listId, titleText)` - adds at bottom or specified position
  - `updateListItemTitle(itemId, newTitle)` - rename
  - `removeItemFromList(itemId)` - works for both songs and titles

- [ ] Title card dropdown menu
  - Rename: Inline edit or modal input
  - Delete: Remove from list (no confirmation needed, just visual separator)

**Reference:** Titles are purely visual separators, no hierarchical behavior.

---

### 1.5 Settings Page & Show/Hide Tags/Lists Toggle

**Goal:** Global setting to show/hide tags and lists on song cards in list pages.

#### A. Create Settings Page

- [ ] Create `src/pages/SettingsPage.vue`
  - Header: "Settings"
  - Sections structure (for future settings)
  - First section: "List Pages"

- [ ] Add route: `/settings` → SettingsPage

- [ ] Add "Settings" link to `HamburgerMenu.vue`

#### B. Create User Settings Store

- [ ] Create `src/stores/settings.ts`
  - State:
    ```typescript
    {
      showTagsAndListsInListPages: boolean // default: true
    }
    ```
  - Actions:
    - `fetchSettings()` - load from localStorage or user profile
    - `updateSetting(key, value)` - save to localStorage
    - (Future: sync to Supabase user metadata if needed)

- [ ] Use localStorage for now (per-user, per-device)
  - Key: `livenotes_settings_${userId}`
  - JSON stringified object

#### C. Build Settings UI

- [ ] In SettingsPage.vue, create "List Pages" section
  - Slider-style checkbox (toggle switch)
  - Label: "Show tags and lists on song cards"
  - Bound to settings store
  - Updates immediately on change

- [ ] Install or create toggle switch component
  - Use existing Ionic component or create custom with Tailwind
  - Active color: accent blue/green
  - Smooth animation

#### D. Apply Setting to ListSongCard

- [ ] Update `ListSongCard.vue`
  - Import settings store
  - Conditionally render tags/lists rows based on `showTagsAndListsInListPages`
  - Always show on AllSongsPage (setting only affects list pages)

**Reference:** Setting is global for all list pages, stored per user in localStorage.

---

## Phase 2: Artists Page Enhancement

### 2.1 Add Search Bar to Artists Page

**Goal:** Filter artists by name (same UX as songs search).

- [ ] Add SearchBar component to `ArtistsPage.vue`
  - Position: Sticky at bottom (consistent with AllSongsPage)
  - No filter button (artists have no tags)
  - Debounced input (200ms)
  - Clear button

- [ ] Add search logic to artists store
  - Add `searchQuery` state ref
  - Add `filteredArtists` computed
    - Filter by name (case-insensitive, partial match)
    - Alphabetically sorted

- [ ] Update ArtistsPage to render `filteredArtists` instead of all artists

- [ ] Test search
  - Type "beat" → matches "The Beatles", "Beats International"
  - Clear button works
  - Empty state if no matches

**Reference:** Same search UX as songs, but no tag filtering.

---

## Phase 3: General UI Improvements

### 3.1 Dropdown Menu Overlay

**Goal:** Add visual separation when dropdown menus are open.

- [ ] Create global overlay component or utility
  - Semi-transparent backdrop (20% black: `rgba(0, 0, 0, 0.2)`)
  - Positioned behind dropdown menu
  - Click to close menu
  - Smooth fade in/out (150ms transition)

- [ ] Update all dropdown menu components:
  - `SongDropdownMenu.vue`
  - `ListDropdownMenu.vue`
  - `ArtistDropdownMenu.vue`
  - `TagDropdownMenu.vue`
  - `ListSongDropdownMenu.vue`
  - `ListTitleDropdownMenu.vue` (new)

- [ ] Implementation approach:
  - Option 1: Backdrop element rendered by each dropdown
  - Option 2: Global overlay managed by UI store
  - Recommend: Each dropdown renders its own overlay (simpler, no global state)

- [ ] Overlay behavior:
  - Appears when menu opens
  - Click overlay → close menu
  - Z-index: Menu at 50, overlay at 40
  - Covers entire viewport

**Reference:** Click overlay closes menu, 20% opacity.

---

## Testing Checklist

### Lists Enhancements
- [ ] Drag & drop works on mobile (long-press)
- [ ] Drag & drop works on desktop (mouse)
- [ ] Dragging item shows glow and tilt
- [ ] Original position shows gray placeholder
- [ ] Insertion line appears between items
- [ ] Drop reorders items correctly
- [ ] Positions saved to database
- [ ] Up/down arrows removed
- [ ] Create title card
- [ ] Rename title card
- [ ] Delete title card
- [ ] Drag title cards
- [ ] Drag songs above/below titles
- [ ] Title cards visually distinct from songs

### Settings
- [ ] Settings page accessible from menu
- [ ] Toggle switch works
- [ ] Setting persists on page reload
- [ ] Tags/lists hidden in list pages when toggle off
- [ ] Tags/lists still shown in All Songs page
- [ ] Setting stored per user

### Artists Search
- [ ] Search bar appears on Artists page
- [ ] Search filters artists by name
- [ ] Partial match works
- [ ] Case-insensitive
- [ ] Clear button works
- [ ] Empty state for no results

### Dropdown Overlays
- [ ] Overlay appears when dropdown opens
- [ ] Overlay is 20% opacity
- [ ] Click overlay closes menu
- [ ] Works on all card types (song, list, artist, tag, title)
- [ ] Smooth fade in/out animation

---

## Implementation Order (Recommended)

1. **Quick Wins First:**
   - Dropdown overlays (3.1) - simple, big visual impact
   - Remove up/down arrows (1.3) - cleanup
   - Artists search (2.1) - reuse existing pattern

2. **Settings Foundation:**
   - Settings store (1.5.B)
   - Settings page (1.5.A, C)
   - Apply to ListSongCard (1.5.D)

3. **List Titles:**
   - Database migration (1.1)
   - ListTitleCard component (1.4)
   - Integration in ListDetailPage (1.4)

4. **Enhanced Drag & Drop:**
   - Implement new drag UX (1.2)
   - Test thoroughly on mobile and desktop

---

## Success Criteria

Phase 1 is complete when:

- ✅ Dropdown menus have 20% overlay backdrop, click to close
- ✅ Artists page has search bar (no filter), works like songs search
- ✅ Settings page exists with "List Pages" section
- ✅ Global toggle to show/hide tags/lists on list page song cards
- ✅ Setting persists per user (localStorage)
- ✅ Up/down arrows removed from list detail page
- ✅ Title cards can be added to lists
- ✅ Title cards can be renamed and deleted
- ✅ Title cards are visually distinct (larger, bolder)
- ✅ Title cards are draggable (same as songs)
- ✅ Enhanced drag & drop UX:
  - ✅ Dragging item has glow + tilt
  - ✅ Original space shows gray placeholder
  - ✅ Insertion line shows drop target
  - ✅ Works on mobile (touch/long-press) and desktop (mouse)
  - ✅ Smooth animations (200ms)

---

**Last Updated**: April 2, 2026
