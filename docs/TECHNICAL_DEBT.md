# Technical Debt Report

**Scope:** `apps/web/src` (stores, components/pages, services/composables/utils), about 17k lines across 136 files, tests excluded. `packages/shared` (offline engine) was only checked for duplicates of the findings below.
**Focus:** spaghetti code: tangled control flow, hidden side effects, cross-layer coupling, and duplicated logic that has drifted out of sync.
**History:** first audit 2026-08-02 (before the monorepo and offline work). Re-checked against the code on 2026-10-19 (`develop` at 22064cf): fixed items moved to [Fixed since the first audit](#fixed-since-the-first-audit), counts and file names updated.
**Note:** there are still no `TODO`/`FIXME`/`HACK` markers in `src/`. None of the debt below is flagged in the code, so it only shows up when someone reads the code.

**Related issues:** #47 (error-handling convention, done), #46 (Ionic removed). Phase 2 rule (strategy-2026): no standalone refactor phase; the rest is fixed when the code is touched for a feature.

---

## Executive summary

The debt is not algorithmic or performance-related. The architecture has eroded, mainly in three ways:

1. **No enforced layer boundaries.** Stores call other stores, composables call services and push components, and "utils" call Pinia. Every layer can reach every other layer, so there's no safe place to reason about a change in isolation. The offline work improved the data path (reads go through `lib/offline` and `packages/shared`), but the UI layers are unchanged.
2. **Migrations left half-finished.** The old Modal variants of four features are no longer used but still in the repo, lists still use hand-rolled CRUD instead of `useCRUD`, and artist creation has two entry points.
3. **One store (`drawer`) reaches into the platform itself** (native History API), and a page has to defend against the side effect. This is still the most fragile single mechanism in the app.

Findings are grouped by severity: **Critical** (active bug risk / silent correctness gaps), **High** (duplicated logic that will diverge or already has), **Medium** (structural coupling that inflates blast radius), **Low** (cosmetic/organizational).

---

## Critical

### 1. Drawer store hijacks the browser History API and leaks into route watchers
*Still present, unchanged.* `stores/drawer.ts` calls `history.back()` inside `pop()` (and `history.go(-count)` in `popAll()`) to close drawers, using a `suppressPopstate` counter to tell its own popstate listener to ignore the event it just caused. Vue Router reacts to the same native `popstate` and re-emits `route.query` as a fresh object. `pages/authenticated/LibraryPage.vue` defends against this by comparing `tag`/`artist` between old and new query in its `route.query` watcher. Without that check, the watcher would reset filter state the user just set.

Closing a drawer goes through: Pinia store → native History API → global popstate listener → Vue Router → page-level watcher. Only an ad-hoc counter keeps this loop from going wrong, and it can race if pops fire faster than the browser resolves them or if `pop()` and `popAll()` interleave. Every new component that watches `route.query` inherits this risk without being told.

### 2. Data stores fire UI side effects invisible from their function signatures
*Still present, partly changed.* `notes.ts` calls `useUiStore()` inside data actions to show toasts: `generateSongcodeJson(noteId, librarySongId)` looks like a pure data operation but shows a toast. `editMode.ts` (new) does the same in about ten places. That is more defensible there, since edit mode is mostly UI state, but its RPC failures and toasts are still mixed together. `library.ts`'s `watch(currentProjectId, ...)` still wipes search, tag selection and filter mode when the active project changes, and nothing in any public API name says so. Debugging "why did my filters disappear" requires knowing about a watcher three files away.

---

## High — duplicated logic that has already diverged

- **Four Modal components are no longer used anywhere.** `FilterByTagsModal`, `BulkAssignTagsModal`, `BulkAddToListsModal` and `BulkRemoveTagsModal` have no importers; the Drawer versions replaced them. They still sit next to the live Drawers in `components/` and look just as current. The rule for which pattern to use is still undocumented: `ManageTagsModal`, `ManageListsModal` and `CRUDModal` are live Modals, used next to Drawers in the same pages. *Easy win: delete the four dead Modals.*
- **Two CRUD implementations.** `useCRUD.ts` (generic, validated create/rename/delete) is used for tags and artists (`TagsPage`, `ArtistsPage`, `CRUDModal`). `useListCRUD.ts` re-implements the same create/rename/validate flow for lists. List-name validation (trim → empty → 50-char max → duplicate) is copied again in `BulkAddToListsDrawer.vue` (and in the dead `BulkAddToListsModal.vue`).
- **"Map artists, filter nulls, sort by position" exists four times:** `globalSongService.ts` (`mapArtists`), inline in `publicLibraryService.ts`, and in `packages/shared/src/offline/queries.ts` (`songArtists`, which mirrors the server query on purpose). The service-layer copies in `songService`, `libraryService` and `listService` disappeared when reads moved to the data layer.
- **Two divergent "note type → icon/color" tables.** `NoteContentDrawer.vue` hardcodes the icon/color mapping for 11 note types; `useNoteCreation.ts` (`NOTE_TYPE_CONFIG`) defines a separate one for only 3 of them (`songcode`, `plain_text`, `looper`).
- **Artist creation has two entry points:** `artistService.createArtistV2(name, fingerprint, userId)` and `globalSongService.createArtist(name, userId)`, with no shared function (only the first one sets a fingerprint).

---

## Medium — coupling that inflates blast radius

- **Cross-store coupling is the default.** 7 of 12 stores call `useAuthStore()` for user/project id; `editMode.ts`, `library.ts` and `publicLibraries.ts` do it at store-setup time, so they depend on Pinia initialization order.
- **God components reach into everything.** `LibraryPage.vue` (426 lines) uses 7 stores and mixes data fetching, scroll capture/restore, query-param syncing (with the workaround from Critical #1), and four nearly identical bulk handlers (delete / assign tags / remove tags / add to lists) that repeat the same capture → mutate → reload → toast → cleanup steps. `NoteContentDrawer.vue` (322 lines) uses 5 stores and embeds date formatting and YouTube-ID parsing that belong in a shared util. `ProjectMenuDrawer.vue` calls `projectService` directly instead of going through a store.
- **Bulk-action composables are page-specific glue that looks like generic utilities.** `useListBulkActions.ts` uses 4 stores, imports 2 services and 5 components; `useListSongActions.ts` uses 6 stores and imports 3 components. Each mixes data access, orchestration, confirmation UI and toasts in one file.
- **Callbacks are passed down the chain instead of using shared state.** `LibraryPage`'s bulk handlers push a drawer with an inline closure that performs store mutations and cleanup. `NoteContentDrawer` pushes an editor with an `onSaved` callback that in turn calls a callback prop from a higher parent: three levels of callbacks where a shared store subscription would be simpler.
- **Screens and composables still build some error toasts by hand** (`showToast(..., 'error')`), e.g. `useUserAccountSettings.ts`, `useProjectSettings.ts`. Stores and services now follow [ERROR_HANDLING.md](./ERROR_HANDLING.md) (#47); move these to `executeOperation` / `showErrorToast` when they are next touched.
- **`settings.ts` and `ui.ts` each bundle unrelated concerns under one store name.** `settings.ts` mixes localStorage display prefs, DB-backed project settings and the offline-mode switch; one `watch` over six refs writes all of them to localStorage whenever any one changes. `ui.ts` bundles toasts, the confirm dialog, the operation overlay, hamburger-menu state and bulk-selection state.
- **A "generic" utility module is hard-wired to Pinia.** `utils/operations.ts` imports and calls `useUiStore()`, so the utils layer depends on the state layer.

---

## Low — organizational / cosmetic

- **`components/` is a single flat directory of 59 files** with no subfolders, so the dead Modals (see High) can't be told apart from live components by the file layout.
- **Type escapes:** `ListDetailPage.vue` casts list items `as any` 7 times in its template. `editMode.ts` casts `supabase.rpc` to an untyped function, although the edit-flag RPCs are in the generated types (`packages/shared/src/types/supabase.ts`).

---

## Fixed since the first audit

- ~~Critical: `ManageTagsModal.vue` writes to Supabase directly~~: it now calls `tagService.setLibrarySongTags`. No component, page or composable calls Supabase directly any more; only `editMode.ts` (RPCs) does, in the store layer.
- ~~High: "generate Livenotes JSON" exists twice~~: the V1 `songcode.ts` store is gone, and only `notes.ts:generateSongcodeJson` remains.
- ~~Medium: silent `.catch(() => null)` chains in `useOfflineSync.ts`~~: the offline layer was rewritten (`lib/offline`, `packages/shared`), and sync errors now reach the UI through `lastSyncError`.
- ~~Medium: `settings.ts` sends a service-worker `postMessage`~~: replaced by the offline-mode switch (`setForceOffline`).
- ~~Low: `publicLibraryService.ts` casts the Supabase client `as any`~~: the cast is gone.
- ~~Medium: several error-handling idioms~~ (#47): one convention, [ERROR_HANDLING.md](./ERROR_HANDLING.md). Services throw (no more `null` for failed requests), stores return `OperationResult`, `executeOperation` / `showErrorToast` word the error. This fixed actions that showed a success toast after a failure.
- ~~Medium: `notes.ts` fires UI toasts~~: `generateSongcodeJson` (unused) is gone.
- ~~High: `operations.ts` dead twin~~: `executeConfirmedOperation` removed (it was only used by its own tests).
- ~~Medium: `LibraryPage` scroll through Ionic, `as any` casts~~ (#46): Ionic removed, `AppPage` exposes the scroll element.

---

## Reading order, if tackling this

1. **Easy win (pure deletion, no behavior change):** the four dead Modals.
2. **The `drawerStore` popstate mechanism** (Critical #1). It is what makes touching drawers risky, so untangling the drawer/router relationship first makes everything downstream safer to consolidate: the god-component bulk handlers, the bulk composables and the callback relays.
3. **Error toasts built by hand** in screens and composables: move them to the convention in [ERROR_HANDLING.md](./ERROR_HANDLING.md) as they are touched.
