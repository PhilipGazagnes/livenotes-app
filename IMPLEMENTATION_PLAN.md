# Livenotes V1 - Implementation Plan

**Status**: Ready to start  
**Last Updated**: March 30, 2026

This document provides a step-by-step implementation plan for Livenotes V1.

## 📚 Reference Documentation

All specifications are in `../livenotes-documentation/app/`:
- [Roadmap](../livenotes-documentation/app/roadmap.md) - Product vision and version strategy
- [V1 MVP Spec](../livenotes-documentation/app/v1-mvp-spec.md) - Overview and scope
- [V1 UI/UX Spec](../livenotes-documentation/app/v1-ui-spec.md) - Complete UI specifications
- [V1 Technical Spec](../livenotes-documentation/app/v1-technical-spec.md) - Complete technical specifications
- [Data Model](../livenotes-documentation/app/data-model.md) - Database schema
- [Features](../livenotes-documentation/app/features.md) - Feature specifications

---

## Phase 0: Project Setup

### 0.1 Initialize Frontend Project

- [ ] Create Vite + Vue 3 + TypeScript project
  ```bash
  npm create vite@latest . -- --template vue-ts
  ```

- [ ] Install dependencies
  ```bash
  npm install
  npm install @ionic/vue @ionic/vue-router
  npm install vue-router@4 pinia
  npm install @supabase/supabase-js
  npm install @vueuse/core
  ```

- [ ] Install dev dependencies
  ```bash
  npm install -D @types/node
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  ```

- [ ] Configure Tailwind CSS for dark mode only
  - Update `tailwind.config.js`
  - Import Tailwind in main CSS
  - Configure Ionic with Tailwind

- [ ] Set up project structure
  ```
  src/
    assets/
    components/
    composables/
    constants/
      validation.ts
      messages.ts
      routes.ts
    pages/
    router/
    stores/
    types/
    utils/
    App.vue
    main.ts
  ```

- [ ] Configure TypeScript paths in `tsconfig.json`

- [ ] Set up environment variables structure
  - Copy `.env.example` to `.env.local`
  - Add to `.gitignore`

**Reference:** [V1 Technical Spec - Tech Stack](../livenotes-documentation/app/v1-technical-spec.md#technology-stack)

---

### 0.2 Set Up Supabase Backend

- [ ] Create Supabase project at https://supabase.com
  - Choose region closest to users
  - Note project URL and anon key

- [ ] Initialize Supabase CLI locally
  ```bash
  npm install -D supabase
  npx supabase init
  ```

- [ ] Create migration files
  ```bash
  npx supabase migration new initial_schema
  npx supabase migration new add_indexes
  npx supabase migration new add_rls_policies
  ```

- [ ] Copy SQL from technical spec to migration files:
  - `supabase/migrations/XXXXXX_initial_schema.sql`
    - Tables: projects, songs, tags, song_tags, lists, list_items
  - `supabase/migrations/XXXXXX_add_indexes.sql`
    - All performance indexes
  - `supabase/migrations/XXXXXX_add_rls_policies.sql`
    - Row Level Security policies
    - Triggers for updated_at

- [ ] Test migrations locally
  ```bash
  npx supabase start
  npx supabase db reset
  ```

- [ ] Push to Supabase cloud
  ```bash
  npx supabase db push
  ```

- [ ] Configure Supabase Auth
  - Enable email provider with email confirmation
  - Configure OAuth providers (Google, Facebook)
  - Set email templates
  - Configure redirect URLs

- [ ] Create Edge Function or Database Webhook for auto-creating personal project on signup
  - Trigger on `auth.users` insert
  - Create personal project for new user

**Reference:** 
- [V1 Technical Spec - Database Schema](../livenotes-documentation/app/v1-technical-spec.md#complete-schema-v1)
- [V1 Technical Spec - Authentication](../livenotes-documentation/app/v1-technical-spec.md#authentication)

---

### 0.3 Configure Environment

- [ ] Add Supabase credentials to `.env.local`
  ```
  VITE_SUPABASE_URL=https://xxxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbG...
  ```

- [ ] Create Supabase client singleton
  - `src/utils/supabase.ts`
  - Export initialized client

- [ ] Test connection
  - Create simple test page
  - Verify auth and data access

**Reference:** [V1 Technical Spec - Environment Variables](../livenotes-documentation/app/v1-technical-spec.md#environment-variables)

---

## Phase 1: Authentication & Core Infrastructure

**Goal:** Users can sign up, log in, and have a personal project created.

### 1.1 Create Constants Files

- [ ] `src/constants/validation.ts`
  - Copy validation constants from technical spec
  - Export VALIDATION object

- [ ] `src/constants/messages.ts`
  - Copy all messages from technical spec
  - Export MESSAGES object

- [ ] `src/constants/routes.ts`
  - Define all route paths
  - Export ROUTES object

**Reference:** [V1 Technical Spec - Constants & Messages](../livenotes-documentation/app/v1-technical-spec.md#constants--messages)

---

### 1.2 Set Up Router

- [ ] Create `src/router/index.ts`
  - Define all routes from ROUTES constants
  - Add auth guards (redirect to login if not authenticated)
  - Add meta for public routes (login, signup)

- [ ] Create route components (empty for now):
  - LoginPage.vue
  - SignupPage.vue
  - AllSongsPage.vue
  - SongNewPage.vue
  - SongEditPage.vue
  - ListsPage.vue
  - ListDetailPage.vue
  - TagsPage.vue

**Reference:** [V1 UI Spec - Navigation Structure](../livenotes-documentation/app/v1-ui-spec.md#routes)

---

### 1.3 Create Pinia Stores

- [ ] `src/stores/auth.ts`
  - Current user state
  - Login/logout/signup actions
  - Session management

- [ ] `src/stores/songs.ts`
  - Songs array
  - CRUD operations
  - Search/filter logic

- [ ] `src/stores/tags.ts`
  - Tags array
  - CRUD operations

- [ ] `src/stores/lists.ts`
  - Lists array
  - List items with positions
  - CRUD operations
  - Reordering logic

- [ ] `src/stores/ui.ts`
  - Loading states
  - Toast notifications
  - Modal states

**Reference:** [V1 Technical Spec - Data Operations](../livenotes-documentation/app/v1-technical-spec.md#data-operations)

---

### 1.4 Build Authentication Pages

- [ ] Create LoginPage.vue
  - Email/password form
  - OAuth buttons (Google, Facebook)
  - Link to signup
  - Form validation
  - Error handling

- [ ] Create SignupPage.vue
  - Email/password form
  - OAuth buttons
  - Link to login
  - Form validation
  - Password requirements
  - Email verification notice

- [ ] Test authentication flow
  - Sign up creates user
  - Personal project auto-created (verify database)
  - Email verification works
  - Login redirects to AllSongsPage
  - Logout works

**Reference:** [V1 Technical Spec - Authentication](../livenotes-documentation/app/v1-technical-spec.md#authentication)

---

### 1.5 Create Base Components

- [ ] `AppHeader.vue`
  - Sticky header with title
  - Hamburger menu button
  - Responsive

- [ ] `HamburgerMenu.vue`
  - Modal menu
  - Links: Logout, Tags, Lists
  - Close button

- [ ] `ToastNotification.vue`
  - Success/error/info styles
  - Auto-dismiss (3s)
  - Queue multiple toasts

- [ ] `ConfirmDialog.vue`
  - Reusable confirmation modal
  - Customizable message and buttons
  - Promise-based API

- [ ] `LoadingSpinner.vue`
  - Centered spinner
  - Full-screen overlay option

**Reference:** [V1 UI Spec - Toast Notifications](../livenotes-documentation/app/v1-ui-spec.md#toast-notifications)

---

## Phase 2: Song Management (CRUD)

**Goal:** Users can create, read, update, and delete songs with metadata.

### 2.1 Create Song List Page

- [ ] Build AllSongsPage.vue
  - Sticky header
  - Sticky search bar at bottom
  - Song card list
  - Loading state
  - Empty state

- [ ] Create SongCard.vue component
  - Display: title, artist, tags, lists
  - Dropdown menu button
  - No click action (reserved for V2)
  - Responsive styling

- [ ] Create SongDropdownMenu.vue
  - Options: Edit, Duplicate, Manage Tags, Manage Lists, Delete
  - Position correctly relative to trigger
  - Close on outside click

- [ ] Implement song fetching
  - Load all songs on page mount
  - Store in Pinia
  - Display in list
  - Alphabetical sort by title

**Reference:** [V1 UI Spec - All Songs Page](../livenotes-documentation/app/v1-ui-spec.md#1-all-songs-page-main-)

---

### 2.2 Create Song Form

- [ ] Build SongNewPage.vue
  - Form fields: Title*, Artist, Notes, POC ID
  - Required field indicators
  - Character count for notes
  - Validation on blur and submit
  - Cancel button with unsaved changes warning
  - Create button

- [ ] Build SongEditPage.vue
  - Same as new, but pre-populated
  - Load song data by ID
  - Update instead of create
  - Save button

- [ ] Create validation utilities
  - `src/utils/validation.ts`
  - validateSongTitle()
  - validatePocId()
  - normalizeText()

- [ ] Test CRUD operations
  - Create song → appears in list
  - Edit song → changes reflected
  - Delete song → confirmation → removed from list
  - Form validation errors display correctly

**Reference:** 
- [V1 UI Spec - Create/Edit Song](../livenotes-documentation/app/v1-ui-spec.md#2-create-song-page-songnew)
- [V1 Technical Spec - Validation](../livenotes-documentation/app/v1-technical-spec.md#validation-rules)

---

### 2.3 Implement Duplicate Song

- [ ] Add duplicate action to dropdown menu
- [ ] Create duplicateSong() in store
  - Copy metadata only (not tags/lists)
  - Append " (copy)" to title
  - Create new song
  - Show success toast
  - Refresh list

**Reference:** [V1 Technical Spec - Duplicate Song](../livenotes-documentation/app/v1-technical-spec.md#duplicate-song-behavior)

---

## Phase 3: Tags System

**Goal:** Users can create tags and assign them to songs.

### 3.1 Build Tags Management Page

- [ ] Create TagsPage.vue
  - List of all tags
  - Tag cards with name and song count
  - Dropdown menu per tag
  - "+ New Tag" button
  - Alphabetical sort
  - Empty state

- [ ] Create TagCard.vue
  - Display tag name and count
  - Dropdown menu

- [ ] Implement tag CRUD
  - Create tag
  - Rename tag (inline edit or modal)
  - Delete tag (with confirmation)
  - Update song counts reactively

**Reference:** [V1 UI Spec - Tags Page](../livenotes-documentation/app/v1-ui-spec.md#8-tags-page-tags)

---

### 3.2 Build Manage Tags Modal

- [ ] Create ManageTagsModal.vue
  - Shows all tags with checkboxes
  - Checked = song has tag
  - "Create new tag" input at top
  - Add new tag inline
  - Save and Cancel buttons
  - Duplicate detection

- [ ] Integrate modal in SongDropdownMenu
  - Open on "Manage Tags" click
  - Pass song ID
  - Update song tags on save
  - Show success toast

**Reference:** [V1 UI Spec - Manage Tags Modal](../livenotes-documentation/app/v1-ui-spec.md#4-manage-tags-modal-per-song)

---

### 3.3 Display Tags on Song Cards

- [ ] Update SongCard.vue
  - Show tags as chips/badges
  - Icon: 🏷️
  - Comma-separated list
  - Hide row if no tags

- [ ] Test tag workflow
  - Create tag from Tags page
  - Assign tag to song via modal
  - Tag appears on song card
  - Rename tag → all songs reflect change
  - Delete tag → removed from all songs

**Reference:** [V1 UI Spec - Song Card Design](../livenotes-documentation/app/v1-ui-spec.md#song-card-design)

---

## Phase 4: Lists System

**Goal:** Users can create lists, add songs, and reorder.

### 4.1 Build Lists Management Page

- [ ] Create ListsPage.vue
  - List of all lists
  - List cards with name and song count
  - Click card → navigate to detail
  - Dropdown menu per list
  - "+ New List" button
  - Alphabetical sort
  - Empty state

- [ ] Create ListCard.vue
  - Display list name and count
  - Dropdown menu
  - Click handler for navigation

- [ ] Implement list CRUD
  - Create list
  - Rename list
  - Delete list (with confirmation, songs remain)

**Reference:** [V1 UI Spec - Lists Page](../livenotes-documentation/app/v1-ui-spec.md#6-lists-page-lists)

---

### 4.2 Build Manage Lists Modal

- [ ] Create ManageListsModal.vue
  - Shows all lists with checkboxes
  - Checked = song is in list
  - "Create new list" input at top
  - Add new list inline
  - Save and Cancel buttons
  - Duplicate detection

- [ ] Integrate modal in SongDropdownMenu
  - Open on "Manage Lists" click
  - Pass song ID
  - Update list memberships on save
  - New songs added at bottom of lists
  - Show success toast

**Reference:** [V1 UI Spec - Manage Lists Modal](../livenotes-documentation/app/v1-ui-spec.md#5-manage-lists-modal-per-song)

---

### 4.3 Display Lists on Song Cards

- [ ] Update SongCard.vue
  - Show lists as chips/badges
  - Icon: 📋
  - Comma-separated list
  - Hide row if no lists

**Reference:** [V1 UI Spec - Song Card Design](../livenotes-documentation/app/v1-ui-spec.md#song-card-design)

---

### 4.4 Build List Detail Page

- [ ] Create ListDetailPage.vue
  - Back button to Lists page
  - Header with list name
  - Song cards with drag handles and arrows
  - Search/filter bar (same as All Songs)
  - Dropdown menu per song (with "Remove from List")
  - Empty state

- [ ] Create reorderable song card variant
  - Drag handle (☰) on left
  - Up/down arrows (↑↓) on right
  - No lists indicator (redundant)
  - Tags still shown

- [ ] Implement drag-and-drop
  - Use @vueuse/core or similar
  - Update positions on drop
  - Save to database
  - Show "Order updated" toast

- [ ] Implement arrow reordering
  - Move up/down one position
  - Swap positions in database
  - Disable at top/bottom
  - Show toast on update

- [ ] Add "Remove from List" action
  - In dropdown menu
  - Remove song from this list only
  - No confirmation needed
  - Show toast

**Reference:** 
- [V1 UI Spec - List Detail Page](../livenotes-documentation/app/v1-ui-spec.md#7-list-detail-page-listsid)
- [V1 Technical Spec - List Position Management](../livenotes-documentation/app/v1-technical-spec.md#list-position-management)

---

## Phase 5: Search & Filtering

**Goal:** Users can search songs by title and filter by tags.

### 5.1 Implement Search

- [ ] Create SearchBar.vue component
  - Input with search icon
  - Clear button (X)
  - Debounced input (200ms)
  - Placeholder text

- [ ] Add search to AllSongsPage
  - Sticky at bottom
  - Filter button on right

- [ ] Implement search logic in songs store
  - Case-insensitive
  - Partial match
  - Title only
  - Client-side filtering

- [ ] Test search
  - Type "day" → matches "Yesterday" and "Day One"
  - Clear button works
  - Real-time updates (debounced)

**Reference:** 
- [V1 UI Spec - Search & Filter Bar](../livenotes-documentation/app/v1-ui-spec.md#search--filter-bar-sticky-bottom)
- [V1 Technical Spec - Search Implementation](../livenotes-documentation/app/v1-technical-spec.md#search)

---

### 5.2 Implement Tag Filtering

- [ ] Create FilterByTagsModal.vue
  - All tags with checkboxes
  - Selected tags shown at top as removable chips
  - "Uncheck All" button
  - Apply and Cancel buttons

- [ ] Add filter button to AllSongsPage
  - Bottom right of search bar
  - Opens filter modal

- [ ] Implement tag filter logic
  - AND logic (must have ALL selected tags)
  - Client-side filtering
  - Combine with search filter

- [ ] Update empty states
  - Different messages for no search results vs no filter results

**Reference:** 
- [V1 UI Spec - Filter by Tags Modal](../livenotes-documentation/app/v1-ui-spec.md#filter-by-tags-modal)
- [V1 Technical Spec - Tag Filtering](../livenotes-documentation/app/v1-technical-spec.md#tag-filtering-and-logic)

---

### 5.3 Add Search/Filter to List Detail Page

- [ ] Add SearchBar and FilterButton to ListDetailPage
- [ ] Filter only songs in current list
- [ ] Combine search + tag filter
- [ ] Update empty states for filtered lists

**Reference:** [V1 UI Spec - List Detail Search & Filter](../livenotes-documentation/app/v1-ui-spec.md#search--filter)

---

## Phase 6: Bulk Actions

**Goal:** Users can select multiple items and perform bulk operations.

### 6.1 Implement Bulk Selection Mode

- [ ] Add bulk selection state to UI store
  - selectionMode: boolean
  - selectedIds: string[]
  - Actions to enter/exit mode, select/deselect all

- [ ] Update SongCard.vue
  - Show checkbox when in selection mode
  - Toggle selection on click
  - Visual indication of selected state

- [ ] Add selection controls
  - "Select" button to enter mode
  - "Select All" / "Deselect All" buttons
  - "Cancel" to exit mode
  - Selected count display

**Reference:** [V1 UI Spec - Bulk Selection Mode](../livenotes-documentation/app/v1-ui-spec.md#bulk-selection-mode)

---

### 6.2 Implement Bulk Actions for Songs

- [ ] Bulk Delete
  - Confirmation with count
  - Delete all selected
  - Show success toast with count
  - Exit selection mode

- [ ] Bulk Add to List(s)
  - Modal to select target list(s)
  - Add all selected songs
  - Show success toast
  - Exit selection mode

- [ ] Bulk Assign Tags
  - Modal to select tags
  - Assign to all selected songs
  - Show success toast
  - Exit selection mode

- [ ] Bulk Remove Tags
  - Modal to select tags to remove
  - Remove from all selected songs
  - Show success toast
  - Exit selection mode

**Reference:** [V1 UI Spec - All Songs Bulk Actions](../livenotes-documentation/app/v1-ui-spec.md#bulk-actions-available)

---

### 6.3 Implement Bulk Actions for Lists

- [ ] Add selection mode to ListsPage
- [ ] Bulk Delete Lists
  - Confirmation
  - Delete selected lists
  - Songs remain in database
  - Show success toast

**Reference:** [V1 UI Spec - Lists Bulk Actions](../livenotes-documentation/app/v1-ui-spec.md#bulk-selection-mode-1)

---

### 6.4 Implement Bulk Actions in List Detail

- [ ] Add "Remove from List" bulk action
  - Remove selected songs from current list only
  - No confirmation needed
  - Show toast

- [ ] Other bulk actions same as All Songs
  - Delete, Add to Lists, Assign/Remove Tags

**Reference:** [V1 UI Spec - List Detail Bulk Actions](../livenotes-documentation/app/v1-ui-spec.md#bulk-selection-mode-2)

---

## Phase 7: Polish & UX

**Goal:** Refined UI, smooth interactions, proper error handling.

### 7.1 Responsive Design

- [ ] Test on mobile screen sizes (< 640px)
- [ ] Test on tablet (640px - 1024px)
- [ ] Test on desktop (> 1024px)
- [ ] Adjust layouts using Tailwind breakpoints
- [ ] Ensure touch targets are 44x44px minimum
- [ ] Test hamburger menu on all sizes

**Reference:** [V1 UI Spec - Responsive Behavior](../livenotes-documentation/app/v1-ui-spec.md#responsive-behavior)

---

### 7.2 Loading States

- [ ] Add loading spinner to app shell
- [ ] Show spinner during data fetching
- [ ] Inline spinners for save operations
- [ ] Skeleton loaders for lists (optional, nice-to-have)
- [ ] Minimum 500ms delay before showing spinner (avoid flashing)

**Reference:** [V1 UI Spec - Loading States](../livenotes-documentation/app/v1-ui-spec.md#loading-states)

---

### 7.3 Error Handling

- [ ] Implement global error handler
- [ ] Network error detection
- [ ] Validation error display (inline)
- [ ] Toast notifications for server errors
- [ ] Graceful degradation when API fails
- [ ] Retry logic for failed requests (optional)

**Reference:** [V1 Technical Spec - Error Handling](../livenotes-documentation/app/v1-technical-spec.md#error-handling)

---

### 7.4 Accessibility

- [ ] Keyboard navigation works everywhere
- [ ] Focus management in modals
- [ ] ARIA labels on icon buttons
- [ ] Test with screen reader
- [ ] Check color contrast (WCAG AA)

**Reference:** [V1 UI Spec - Accessibility](../livenotes-documentation/app/v1-ui-spec.md#accessibility-notes)

---

### 7.5 Performance Optimization

- [ ] Verify database indexes are applied
- [ ] Check for N+1 queries (use Supabase select syntax properly)
- [ ] Optimize re-renders (Vue computed, watchers)
- [ ] Lazy load routes
- [ ] Code splitting for large components

**Reference:** [V1 Technical Spec - Performance](../livenotes-documentation/app/v1-technical-spec.md#performance-considerations)

---

## Phase 8: Testing

**Goal:** Ensure everything works correctly before deployment.

### 8.1 Unit Tests

- [ ] Test validation functions
  - validateSongTitle
  - validatePocId
  - normalizeText
  - validateTagName

- [ ] Test filtering logic
  - searchSongs
  - filterSongsByTags
  - combined filtering

- [ ] Test reordering logic
  - List position management

**Reference:** [V1 Technical Spec - Testing Strategy](../livenotes-documentation/app/v1-technical-spec.md#testing-strategy)

---

### 8.2 Manual Testing

Use the checklist from technical spec:

- [ ] Sign up flow
- [ ] Sign in flow
- [ ] Create song with all fields
- [ ] Create song with required fields only
- [ ] Edit song
- [ ] Delete song (with confirmation)
- [ ] Duplicate song (verify "(copy)" appended)
- [ ] Create tag
- [ ] Assign tag to song
- [ ] Remove tag from song
- [ ] Rename tag (verify all songs still have it)
- [ ] Delete tag (with confirmation, verify removed from all songs)
- [ ] Create list
- [ ] Add song to list
- [ ] Remove song from list
- [ ] Reorder songs with drag-drop
- [ ] Reorder songs with arrows
- [ ] Delete list (verify songs remain)
- [ ] Search songs (partial match, case-insensitive)
- [ ] Filter songs by tags (AND logic)
- [ ] Combined search + filter
- [ ] Uncheck all tags button
- [ ] Bulk delete songs
- [ ] Bulk add to list
- [ ] Bulk assign tags
- [ ] Bulk remove tags
- [ ] Form validation errors
- [ ] Unsaved changes warning
- [ ] Mobile responsiveness
- [ ] Toast notifications
- [ ] Empty states
- [ ] Loading states

**Reference:** [V1 Technical Spec - Manual Testing Checklist](../livenotes-documentation/app/v1-technical-spec.md#manual-testing-checklist)

---

## Phase 9: Deployment

**Goal:** Deploy V1 to production.

### 9.1 Prepare for Deployment

- [ ] Set up production Supabase project (if using separate from dev)
- [ ] Run migrations on production database
- [ ] Configure production environment variables
- [ ] Set up domain (if custom)
- [ ] Configure CORS in Supabase for production domain
- [ ] Test OAuth redirects for production URLs

**Reference:** [V1 Technical Spec - Deployment Checklist](../livenotes-documentation/app/v1-technical-spec.md#deployment-checklist)

---

### 9.2 Deploy to Netlify/Vercel

- [ ] Connect GitHub repository
- [ ] Configure build settings:
  - Build command: `npm run build`
  - Publish directory: `dist`
  - Node version: 18 or 20

- [ ] Add environment variables in hosting dashboard
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY

- [ ] Deploy to production
- [ ] Test deployed app thoroughly
- [ ] Monitor for errors (check browser console, network tab)

**Reference:** [V1 Technical Spec - Deployment](../livenotes-documentation/app/v1-technical-spec.md#deployment-checklist)

---

### 9.3 Post-Deployment

- [ ] Run through manual testing checklist on production
- [ ] Test on real mobile devices
- [ ] Share with initial users for feedback
- [ ] Monitor Supabase usage and errors
- [ ] Set up basic monitoring (Sentry, etc.) - optional for V1

---

## Success Criteria

V1 is complete when all these are true:

- ✅ I can sign up and log in (email + Google/Facebook)
- ✅ I can create songs with metadata (title, artist, notes, POC ID)
- ✅ I can see a list of all my songs
- ✅ I can edit song metadata
- ✅ I can delete songs (with confirmation)
- ✅ I can duplicate songs (appends "(copy)" to title)
- ✅ I can create and manage tags (create, rename, delete)
- ✅ I can assign multiple tags to songs
- ✅ I can create and manage lists/setlists
- ✅ I can add songs to lists with custom ordering (drag-drop + arrows)
- ✅ I can search songs by title (real-time, debounced)
- ✅ I can filter songs by tags (AND logic, multi-select)
- ✅ Search and tag filtering work together
- ✅ I can bulk delete songs, bulk add to lists, bulk assign/remove tags
- ✅ My data is persisted and accessible from any device
- ✅ The app works in a web browser (mobile-first, responsive)
- ✅ Dark mode UI with Tailwind CSS
- ✅ All confirmations, toasts, and empty states work correctly

**Reference:** [V1 MVP Spec - Success Criteria](../livenotes-documentation/app/v1-mvp-spec.md#success-criteria)

---

## Next Steps After V1

Once V1 is deployed and being used:

1. **Gather feedback** - Use the app daily, note friction points
2. **Plan V2** - SongCode editor and chord chart viewer
3. **Refine documentation** - Update based on implementation learnings

---

## Development Tips

- **Start simple** - Get basic functionality working before polish
- **Test early and often** - Don't wait until the end to test
- **Use the specs** - Reference documentation constantly
- **Commit frequently** - Small, focused commits
- **Deploy early** - Get to production as soon as core features work

---

**Last Updated**: March 30, 2026
