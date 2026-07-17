# Deleted Work To Be Reported

This document exists because `main` has 2 commits that `develop` does not, and both branches have since diverged on the same files. A rebase/merge of these 2 commits was judged too risky, so the plan is:

1. Drop these 2 commits from `main`.
2. Reset `main` to `develop` (or fast-forward merge `develop` into `main`).
3. Redo the work described below, from scratch, on top of the current `develop`.

This doc captures the *why* and *how* of the work so it isn't lost when the commits are dropped.

## Commits covered

- `fc31d14` — "disable auto translation" (2026-07-02 15:58)
- `bc2e06b` — "auto translations disabling" (2026-07-02 16:04)

## Why

Browser/OS-level auto-translate features (e.g. Chrome's "Translate this page") were machine-translating user-generated content — song titles, artist names, lyrics, and note content. This content is proper nouns / verbatim user data that should never be translated: mistranslating a song title or artist name garbles it, and translating lyrics/notes corrupts content the user explicitly typed or pasted. The fix scopes out only that dynamic, user-authored text, while leaving the app's own UI copy (which does go through the `I18N` constants) translatable as normal.

## How

The approach was the standard HTML/CSS mechanism for excluding an element from Google Translate and similar tools: add the `notranslate` CSS class **and** the `translate="no"` attribute to every element that renders raw user content.

**Elements marked non-translatable** (`class="notranslate" translate="no"` added to the existing element, or a `<span>` wrapper added around just the dynamic part when the element also contains static, translatable UI text):

- `src/components/Card.vue` — song title and text/subtitle lines (with highlighted-match `<mark>` segments preserved inside).
- `src/components/LiveLyricsDrawer.vue` — song title, artist list, and the plain-text lyrics fallback paragraph.
- `src/components/NoteCard.vue` — note content preview.
- `src/components/NoteContentDrawer.vue` — full note content.
- `src/components/PublicLyricDrawer.vue` — song title, artist list, and plain-text lyrics fallback.
- `src/components/SongNotesDrawer.vue` — song title, artist list, and per-note lyrics preview.
- `src/components/SongcodeLyricsContent.vue` — each rendered lyric line in the songcode-based lyrics view.
- `src/components/SongCodeDrawer.vue` — the song title shown in the drawer's `ion-title`.
- `src/components/SongSearchModal.vue` — song title and artist list in search results.

**Modal titles with mixed static/dynamic text** (`ManageListsModal.vue`, `ManageTagsModal.vue`): previously the whole title string (e.g. `"Manage Tags - {songTitle}"`) was built by a single `I18N` function and rendered as one text node, so it couldn't be partially excluded from translation. This was split so only the song title is wrapped in `notranslate`:
- `src/constants/i18n.ts` — added `MANAGE_TAGS_TITLE_PREFIX` and `MANAGE_LISTS_TITLE_PREFIX` string constants (the static, translatable portion), alongside the existing `MANAGE_TAGS_TITLE(songTitle)` / `MANAGE_LISTS_TITLE(songTitle)` functions (left in place, now presumably unused by these two call sites).
- The two modal templates now render `{{ PREFIX }} <span class="notranslate" translate="no">{{ songTitle }}</span>` instead of the single interpolated string.

**Unrelated file also included in `bc2e06b`:**
- `e2e/.auth/.gitkeep` and `e2e/.auth/philip.json` — a Playwright saved-auth-state fixture (localStorage dump including a live Supabase JWT access/refresh token pair for a real account) got committed alongside the translation fix. This looks like incidental/accidental inclusion (likely a test running locally and `git add -A`/`git add .` picking up the generated auth state), not intentional feature work.
  - **Flag for the redo:** this file contains a real bearer token and should probably not be committed at all — check whether `e2e/.auth/` is meant to be gitignored before redoing this work, and if the token has already been pushed to a shared remote, consider it compromised and rotate/invalidate it.

## Why not just rebase/cherry-pick

`develop` has independently modified nearly every file these commits touch since the branches diverged: `Card.vue`, `ManageListsModal.vue`, `ManageTagsModal.vue`, `NoteCard.vue`, `NoteContentDrawer.vue`, `SongCodeDrawer.vue`, `SongNotesDrawer.vue`, `SongSearchModal.vue`, `SongcodeLyricsContent.vue`, and `i18n.ts`. A rebase or cherry-pick would hit conflicts across most of the changed surface, and given the change is a repetitive, mechanical pattern (add two attributes to N elements), it's lower-risk to redo it by hand against current `develop` than to resolve conflicts commit-by-commit.

## Redo checklist

- [ ] Re-apply `notranslate` class + `translate="no"` attribute to all the elements listed above, against current `develop`/`main`.
- [ ] Re-add the `MANAGE_TAGS_TITLE_PREFIX` / `MANAGE_LISTS_TITLE_PREFIX` constants and update the two modal templates.
- [ ] Decide whether `MANAGE_TAGS_TITLE` / `MANAGE_LISTS_TITLE` functions are now dead code and should be removed.
- [ ] Do **not** re-commit `e2e/.auth/philip.json`; add `e2e/.auth/` to `.gitignore` if it isn't already, and rotate the exposed Supabase token if it was ever pushed.
