# Sticky Bottom Bar — Implementation TODO

## Overview

Replace all inline bottom bar implementations across 6 pages with a single shared
`StickyBar` component. The bar has 4 controls: text search, filters, bulk actions, and new.

**Component API (final)**

```
Props:
  searchQuery: string       // v-model
  allItemIds: string[]      // IDs of currently visible items (for "select all")
  filtersEnabled: boolean   // default false — disables filter button
  filtersActive: boolean    // default false — shows active indicator on filter button

Events:
  update:searchQuery
  filtersClicked            // page opens its own filter drawer
  newClicked                // page opens its own creation drawer
  chooseActionClicked       // page opens its own bulk actions drawer
```

Internal: reads/writes `uiStore.selectionMode` and `uiStore.selectedIds` directly.

---

## Phase 1 — StickyBar component

- [ ] Create `src/components/StickyBar.vue`
  - [ ] Layout: search input (flex-grow), filter button, bulk button, new button
  - [ ] Search input: left search icon, right clear (×) button when non-empty, emits `update:searchQuery`
  - [ ] Filter button: disabled when `filtersEnabled=false`, active indicator when `filtersActive=true`, emits `filtersClicked`
  - [ ] Bulk button: toggles `uiStore.selectionMode` on click; active/highlighted when selectionMode is true; on deactivate → clears `uiStore.selectedIds`
  - [ ] New button: emits `newClicked`
  - [ ] Selection strip (renders above the bar when `uiStore.selectionMode` is true):
    - [ ] "{n} selected" count (from `uiStore.selectedIds.length`)
    - [ ] × deselect-all button → sets `uiStore.selectedIds = []`
    - [ ] "Select all" button → sets `uiStore.selectedIds = [...allItemIds]`
    - [ ] "Choose action" button → emits `chooseActionClicked`
  - [ ] Bar is always visible (no v-if on the outer wrapper)

---

## Phase 2 — Text highlight in Card

- [ ] Add `highlightText: string` prop (default `''`) to `src/components/Card.vue`
  - [ ] Apply highlight rendering to the card **title** field
  - [ ] Apply highlight rendering to the card **text/body** field
  - [ ] Use a helper (e.g. `highlightMatch(text, query)`) that wraps matches in `<mark>` or a styled `<span>`; handle empty query gracefully (render plain text)

---

## Phase 3 — Page integrations

For each page: add `StickyBar`, wire search + allItemIds, handle 3 events, pass `highlightText` to cards, remove old bar code.

### 3a. LibraryPage (`src/pages/authenticated/LibraryPage.vue`)
- [ ] Add `StickyBar` with `filtersEnabled=true`, bind `filtersActive` to whether any tag filters are active
- [ ] `filtersClicked` → open filter drawer (existing tag filter + AND/OR logic)
- [ ] `newClicked` → open new-song creation drawer
- [ ] `chooseActionClicked` → open bulk actions drawer (actions: Add to lists, Assign tags, Remove tags, Delete)
- [ ] Pass `highlightText` to `Card` components
- [ ] Remove inline bottom bar code

### 3b. TagsPage (`src/pages/authenticated/TagsPage.vue`)
- [ ] Add `StickyBar` with `filtersEnabled=false`
- [ ] `newClicked` → open new-tag creation drawer
- [ ] `chooseActionClicked` → open bulk actions drawer (actions: Delete)
- [ ] Pass `highlightText` to `Card` components
- [ ] Wire local `searchQuery` ref + filtered list for `allItemIds`

### 3c. ArtistsPage (`src/pages/authenticated/ArtistsPage.vue`)
- [ ] Add `StickyBar` with `filtersEnabled=false`
- [ ] `newClicked` → open new-artist creation drawer
- [ ] `chooseActionClicked` → open bulk actions drawer (actions: Delete)
- [ ] Pass `highlightText` to `Card` components
- [ ] Remove existing inline search bar

### 3d. ListsPage (`src/pages/authenticated/ListsPage.vue`)
- [ ] Add `StickyBar` with `filtersEnabled=false`
- [ ] `newClicked` → open new-list creation drawer
- [ ] `chooseActionClicked` → open bulk actions drawer (actions: Delete)
- [ ] Pass `highlightText` to `Card` components
- [ ] Wire local `searchQuery` ref + filtered list for `allItemIds`
- [ ] Remove existing inline selection-mode bar

### 3e. ListDetailPage (`src/pages/authenticated/ListDetailPage.vue`)
- [ ] Add `StickyBar` with `filtersEnabled=false`
- [ ] `newClicked` → open new-separator creation drawer
- [ ] `chooseActionClicked` → open bulk actions drawer (actions: Remove from list, Assign tags, Remove tags, Delete)
- [ ] Pass `highlightText` to `Card` components
- [ ] Wire local `searchQuery` ref + filtered list for `allItemIds`
- [ ] Remove existing dual-mode bar (ListBulkActions + ListFilterBar usage)

### 3f. PublicLibrariesPage (`src/pages/authenticated/PublicLibrariesPage.vue`)
- [ ] Add `StickyBar` with `filtersEnabled=false`
- [ ] `newClicked` → open new-public-library creation drawer
- [ ] `chooseActionClicked` → open bulk actions drawer (actions: Delete)
- [ ] Pass `highlightText` to `Card` components
- [ ] Wire local `searchQuery` ref + filtered list for `allItemIds`

---

## Phase 4 — Cleanup

- [ ] Delete `src/components/ListBulkActions.vue` (dead code after 3e)
- [ ] Delete `src/components/ListFilterBar.vue` (dead code after 3e)
- [ ] Verify no remaining inline fixed-bottom bars in any page file

---

## Notes

- "New" drawers: some creation forms need to be refactored/built — deferred to a follow-up task. For now, `newClicked` handlers can be wired up but left as stubs if the drawer doesn't exist yet.
- `chooseActionClicked` opens a drawer whose content is a vertical list of labeled action buttons. Each action that needs a confirmation or sub-form pushes a second drawer via `drawerStore.push()`.
- Bulk selection state lives in `uiStore` — cards already read `uiStore.selectionMode` to show checkboxes; no changes needed there.
