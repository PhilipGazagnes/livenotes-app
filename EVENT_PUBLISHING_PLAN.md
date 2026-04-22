# Event Publishing Feature - Implementation Plan

## Overview
Enable users to publish their lists as public event pages accessible via shareable URLs without authentication.

## Architecture

### URL Structure
- **Production:** `https://livenotes.tv/events/{event_code}-{slug}`
- **Development:** `https://dev.livenotes.tv/events/{event_code}-{slug}`
- **Example:** `https://livenotes.tv/events/194874-mikes-birthday`

### Key Components
- **Event Code:** 6-digit numeric unique identifier (e.g., `194874`)
- **Slug:** URL-friendly name derived from list name, editable (e.g., `mikes-birthday`)
- **Publishing Status:** Boolean flag to enable/disable public access
- **Permanence:** Lists stay published indefinitely unless manually unpublished

---

## Phase 1: Database Schema

### Migration File: `011_add_list_publishing.sql`

```sql
-- Add publishing fields to lists table
ALTER TABLE lists ADD COLUMN is_published BOOLEAN DEFAULT false;
ALTER TABLE lists ADD COLUMN event_code VARCHAR(6) UNIQUE;
ALTER TABLE lists ADD COLUMN slug TEXT;

-- Add index for public query performance
CREATE INDEX idx_lists_event_code ON lists(event_code) WHERE is_published = true;
```

### Schema Changes
- `is_published` (BOOLEAN, default: false) - Publishing status flag
- `event_code` (VARCHAR(6), UNIQUE) - 6-digit numeric ID for URL
- `slug` (TEXT, nullable) - URL-friendly name (multiple lists can share same slug)

---

## Phase 2: Backend (Store Functions)

### Update: `src/stores/lists.ts`

#### New Functions

**1. Generate Event Code**
```typescript
function generateEventCode(): string {
  // Generate random 6-digit numeric code
  return Math.floor(100000 + Math.random() * 900000).toString()
}
```

**2. Publish List**
```typescript
async function publishList(listId: string, slug: string) {
  // Generate unique event_code
  // Set is_published = true
  // Save slug
  // Return full public URL
}
```

**3. Unpublish List**
```typescript
async function unpublishList(listId: string) {
  // Set is_published = false
  // Keep event_code and slug for history
}
```

**4. Update List Slug**
```typescript
async function updateListSlug(listId: string, newSlug: string) {
  // Update slug field
  // Note: This breaks old URLs if list is already published
}
```

**5. Fetch Public Event**
```typescript
async function fetchPublicEvent(eventCode: string, slug: string) {
  // Public query (no auth required)
  // Fetch list where event_code matches and is_published = true
  // Include list_songs with full song details
  // Return 404 if not found or unpublished
}
```

#### Helper Function
```typescript
function slugify(text: string): string {
  // Convert to lowercase
  // Replace spaces with hyphens
  // Remove special characters
  // Example: "Mike's Birthday" → "mikes-birthday"
}
```

---

## Phase 3: UI Components

### New Component: `src/components/PublishListDialog.vue`

**Features:**
- Modal dialog for publishing settings
- Toggle switch for `is_published`
- Editable slug input field
  - Auto-filled from list name (kebab-case)
  - Shows validation (URL-safe characters only)
- When published:
  - Display full public URL: `https://livenotes.tv/events/{event_code}-{slug}`
  - Copy link button
  - Unpublish button
- When unpublished:
  - Show "Publish" button

**UI Layout:**
```
┌─────────────────────────────────────────┐
│ Publishing Settings                  [X] │
├─────────────────────────────────────────┤
│                                          │
│ ☐ Publish this list                     │
│                                          │
│ Event Slug:                              │
│ [mikes-birthday________________]         │
│                                          │
│ ────────────────────────────────────     │
│                                          │
│ Public URL:                              │
│ livenotes.tv/events/194874-mikes-birth.. │
│ [Copy Link]                              │
│                                          │
│           [Unpublish]    [Save]          │
└─────────────────────────────────────────┘
```

---

### New Page: `src/pages/PublicEventPage.vue`

**Route:** `/events/:eventParams` (where `:eventParams` = `{event_code}-{slug}`)

**Features:**
- No authentication required
- Parse URL to extract event_code and slug
- Fetch public list data
- Display list name as page title
- Show simplified song cards:
  - No tags displayed
  - No lists metadata
  - No dropdown menus
  - Click card → opens public lyrics drawer
- Text filter (searches song title + artist name)
- Same view for authenticated and unauthenticated users
- Show 404 if list not found or unpublished

**Layout:**
```
┌────────────────────────────────────────┐
│ LiveNotes                              │
├────────────────────────────────────────┤
│                                        │
│ Mike's Birthday                        │
│                                        │
│ [Search songs and artists_________] 🔍 │
│                                        │
│ ┌──────────────┐ ┌──────────────┐    │
│ │ Song Title   │ │ Song Title   │    │
│ │ Artist Name  │ │ Artist Name  │    │
│ └──────────────┘ └──────────────┘    │
│                                        │
└────────────────────────────────────────┘
```

---

### New Component: `src/components/PublicLyricsDrawer.vue`

**Features:**
- Simplified read-only drawer
- Display song title and artist
- Show livenotes JSON lyrics only
- No edit functionality
- Simple close button

**Data Source:**
- Parse `song.livenotes_json` to display lyrics

---

### Modified Component: `src/pages/ListDetailPage.vue`

**Changes:**
- Add "Publishing" option to 3-dot menu
- Opens `PublishListDialog` when clicked

**Menu Item Location:**
```
┌─────────────────┐
│ Edit List       │
│ Delete List     │
│ Publishing      │  ← NEW
└─────────────────┘
```

---

## Phase 4: Routing

### Update: `src/router/index.ts`

**Add Public Route:**
```typescript
{
  path: '/events/:eventParams',
  name: 'PublicEvent',
  component: () => import('@/pages/PublicEventPage.vue'),
  // No auth guard - public route
}
```

**Route Parsing:**
- Extract `event_code` and `slug` from `:eventParams`
- Format: `{6-digit-code}-{slug}`
- Example: `194874-mikes-birthday` → `event_code: "194874"`, `slug: "mikes-birthday"`

---

## Phase 5: Types

### Update: `src/types/database.ts`

```typescript
export interface List {
  id: string
  project_id: string
  name: string
  created_at: string
  updated_at: string
  is_published: boolean           // NEW
  event_code: string | null       // NEW
  slug: string | null             // NEW
}

export interface PublicEvent {
  id: string
  name: string
  event_code: string
  slug: string
  songs: Song[]
}
```

---

## Implementation Checklist

### Database
- [ ] Create migration `011_add_list_publishing.sql`
- [ ] Run migration on dev database
- [ ] Test migration on local/dev environment

### Backend (Store)
- [ ] Add `generateEventCode()` helper
- [ ] Add `slugify()` helper
- [ ] Implement `publishList()` function
- [ ] Implement `unpublishList()` function
- [ ] Implement `updateListSlug()` function
- [ ] Implement `fetchPublicEvent()` function
- [ ] Add error handling for duplicate event_codes
- [ ] Add validation for slug format

### Components
- [ ] Create `PublishListDialog.vue`
  - [ ] Toggle for is_published
  - [ ] Editable slug input
  - [ ] URL display with copy button
  - [ ] Publish/Unpublish actions
- [ ] Create `PublicEventPage.vue`
  - [ ] URL parsing logic
  - [ ] Public list fetching
  - [ ] Song cards (simplified)
  - [ ] Text filter (song + artist)
  - [ ] 404 handling
- [ ] Create `PublicLyricsDrawer.vue`
  - [ ] Read-only lyrics display
  - [ ] Parse livenotes JSON
- [ ] Modify `ListDetailPage.vue`
  - [ ] Add "Publishing" menu item
  - [ ] Wire up dialog

### Routing
- [ ] Add `/events/:eventParams` route
- [ ] Ensure no auth guard on public route
- [ ] Test route matching

### Types
- [ ] Update `List` interface
- [ ] Add `PublicEvent` interface

### Testing
- [ ] Test publishing flow
- [ ] Test unpublishing flow
- [ ] Test slug editing
- [ ] Test public URL access (authenticated)
- [ ] Test public URL access (unauthenticated)
- [ ] Test 404 for unpublished events
- [ ] Test 404 for invalid event codes
- [ ] Test text filter on public page
- [ ] Test lyrics drawer on public page
- [ ] Test event_code uniqueness
- [ ] Test multiple lists with same slug

### Deployment
- [ ] Run migration on production database
- [ ] Ensure Netlify environment variables are set correctly
- [ ] Test on dev.livenotes.tv
- [ ] Test on www.livenotes.tv

---

## Technical Notes

### Event Code Generation
- Use retry logic if random code already exists
- Maximum 3 retries before throwing error
- With 900,000 possible codes (100000-999999), collision is unlikely

### Slug Handling
- Slugs are NOT unique (multiple lists can share same slug)
- event_code provides uniqueness in URL
- Changing slug breaks old URLs (by design)

### Security
- Public routes require no authentication
- Published lists are fully public (anyone with URL can view)
- Unpublishing immediately makes list inaccessible via public URL
- Authenticated users still have full access via private routes

### Performance
- Add database index on `event_code` for fast lookup
- Consider caching public event data (future optimization)

### Error Handling
- Invalid event_code format → 404
- Unpublished list → 404
- Non-existent list → 404
- Duplicate event_code during publish → retry generation

---

## Future Enhancements (Not in Current Scope)

- Analytics for public event views
- Custom branding/themes for public events
- Password protection for events
- Expiry dates for published events
- Social media meta tags / Open Graph
- QR code generation for event URLs
- Embed codes for external sites
- Public comments/reactions on songs

---

## Environment Setup Notes

### Netlify Configuration
Current setup remains unchanged:
- Production branch → `www.livenotes.tv` (uses prod Supabase env vars)
- Dev branch → `dev.livenotes.tv` (uses dev Supabase env vars)

Both environments will support `/events/*` routes through SPA redirect rules (already configured in `netlify.toml`).

### Supabase RLS (Row Level Security)
Ensure public read access for published lists:
```sql
-- Allow public read access to published lists and their songs
CREATE POLICY "Public read access to published lists"
ON lists FOR SELECT
USING (is_published = true);

CREATE POLICY "Public read access to published list songs"
ON list_songs FOR SELECT
USING (
  list_id IN (
    SELECT id FROM lists WHERE is_published = true
  )
);
```

---

## Questions Resolved

1. **Dev/Prod Setup:** No changes to existing Netlify setup
2. **URL Pattern:** `/events/{6-digit-code}-{slug}` (e.g., `/events/194874-mikes-birthday`)
3. **Public View:** Simplified read-only cards, lyrics drawer, text filter only
4. **Publishing Mechanism:** Toggle in dialog, generates code, shows URL
5. **Authentication:** Same view for all users on public pages
6. **Schema:** Add 3 fields to existing `lists` table
7. **Event Code:** Purely numeric (6 digits)
8. **Slug Uniqueness:** NOT unique (event_code provides uniqueness)
9. **Page Title:** Shows list name
10. **Error Handling:** 404 for unpublished/missing events
11. **SEO:** No meta tags or SEO optimization needed
