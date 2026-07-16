# Song Creation Flow

Replaces the current `SongSearchModal.vue` dialog with a drawer-based flow for
adding a song to the library. Entry point: the "+" button on the Library
page's sticky bottom bar. This is the only place this flow is opened from.

## Main drawer ("Add Song to Library")

- Two fields, each rendered as a **button**, not a live text input. Tapping
  either opens its own sub-drawer (below).
  - **Song name** — shows the chosen title once set, empty otherwise.
  - **Artist(s)** — shows the chosen artist(s) once set, empty otherwise.
- **"Add to library"** button (this replaces the earlier "Next" label — it is
  the final confirmation action, not an intermediate step).
  - Disabled while Song name is empty.
  - Disabled if this exact song+artist(s) combination already exists in the
    library, with a message explaining why.
  - Artist(s) is optional (e.g. instrumental / unknown-artist songs).

## Song name sub-drawer

- Single text input, autofocused, live debounced search (300ms) as the user
  types.
- Suggestions are **deduped by title** (accent/case-folded) — one row per
  distinct title, not one row per catalog entry. A title covered by many
  different artists still only takes one slot in the list, so the top-5
  isn't dominated by cover-version noise.
- Up to 5 suggestions, shown as plain rows (no artist subtitle — see "Why no
  artist subtitle" below).
- Last row is always **"Continue with `<raw typed query>`"** — lets the user
  proceed with free text even when nothing matches, or when none of the
  shown matches are the right one.
- Selecting is single-select and closes the drawer immediately:
  - Tapping a **real suggestion**: sets Song name to that title, returns to
    the main drawer, and — if that title has at least one known artist in
    the catalog — immediately opens the **Artist deduction drawer** (below).
  - Tapping **"Continue with X"**: sets Song name to the raw text, leaves
    Artist(s) untouched, does **not** open the deduction drawer (no catalog
    data is attached to free text).

### Why no artist subtitle here

Showing "Hurt — Johnny Cash" / "Hurt — Nine Inch Nails" as separate rows
would let one popular title's cover versions crowd out genuinely different
songs from the top-5 (e.g. "Hurry up", "Hurricane"). Deduping by title first
and handling artist disambiguation as its own explicit step (next) keeps the
song-name list about distinct songs, not distinct recordings.

## Artist deduction drawer

Purpose: offer to fill Artist(s) from the catalog's known artist(s) for the
picked title, without ever silently overwriting something the user already
chose.

- **Always shown** when the picked title has at least one known artist in
  the catalog — regardless of how many artists there are, and regardless of
  whether Artist(s) already has a value. Not shown when the title came from
  "Continue with `<raw query>`", or when the title has zero known artists.
- Header copy depends on how many distinct artist-sets exist for the title:
  - Exactly one: *"This song seems to be interpreted by \<Artist\>. Continue
    with this artist?"*
  - More than one: *"This song is interpreted by several artists:"*
- Options, single-select list:
  - One row per distinct artist-set for that title. A duet/co-credited entry
    is one combined row (e.g. "Ike & Tina Turner"), never split into two.
  - If Artist(s) already had a value before this drawer opened: an
    additional **"Keep \<current artist(s)\>"** row.
  - Always last: **"Choose another artist"**.
- Behavior:
  - Tapping a deduced artist-set: **replaces** Artist(s) entirely with that
    set, closes this drawer.
  - Tapping "Keep \<current\>": leaves Artist(s) untouched, closes this
    drawer.
  - Tapping "Choose another artist": closes this drawer and opens the
    **standalone Artist(s) sub-drawer** instead, pre-seeded with whatever
    chips are currently in Artist(s) (it's editing the same field).
- Not special-cased when the deduced artist already equals the current
  selection — the drawer still shows, for predictability, rather than
  silently skipping.

## Standalone Artist(s) sub-drawer

Opened either directly from the main drawer's Artist(s) button, or via
"Choose another artist" from the deduction drawer.

- **Multi-select via chips.** Already-selected artists show as removable
  chips (× to remove) above the input.
- One live text input for the artist currently being typed, debounced search
  (300ms), matching existing artist names.
- Last suggestion row is always **"Continue with `<raw typed query>`"** —
  adds the raw text as a new (to-be-created) artist chip.
- Tapping any suggestion or "Continue with X" **adds a chip and keeps the
  drawer open** (unlike the song-name drawer) so more artists can be added.
- Explicit **"Ok"** button closes the drawer and applies the current set of
  chips to Artist(s) on the main drawer.

## "Add to library" action

Enabled only when Song name is non-empty and this exact title+artist(s)
combination isn't already in the library. On tap:

1. Resolve the song in the global catalog:
   - For each artist chip: if it's an existing artist, use its id; if it's a
     "Continue with X" free-text chip, get-or-create it (case-insensitive
     name match against `artists_v2`, same as today).
   - If the title+artist(s) combination doesn't already exist as a catalog
     entry, create it (`songs_v2` row + `song_artists_v2` links).
2. Add the resulting song to the library (`library_songs` row).
3. Toast, green:
   - **"Song created"** if any new `songs_v2` or `artists_v2` record was
     created in step 1.
   - **"Song added to library"** if everything matched existing catalog
     records and only the library link is new.
4. Close the main drawer and open the song's notes/lyrics drawer for the
   newly added library entry (same `songClickShowsLyrics` logic used
   elsewhere for opening a song).

## Cross-cutting rules

- Song-name sub-drawer: single-select, closes immediately on any pick.
- Artist deduction drawer: single-select, closes immediately on any pick —
  visually similar to the standalone Artist(s) drawer but a different
  interaction mode (auto-close vs. multi-chip + explicit Ok).
- Auto-filling Artist(s) only ever happens through the deduction drawer's
  explicit choices — never silently outside of it.
- The whole flow's only entry point is the Library page's sticky-bar "+"
  button.

## Open questions (not yet decided)

- **Search data source.** Currently assumed to be the app's own
  `songs_v2`/`artists_v2` catalog. Using an external API (e.g. Spotify) for
  richer, typo-tolerant matching was discussed but not decided. If pursued,
  needs: a normalized/fingerprinted cache key (not raw query text), a
  DB-backed cache table (doubles as search analytics), a short TTL for
  empty/error results vs. a longer one (~1 week) for real results, and a
  check of Spotify's current Developer Terms on caching/storing API results
  before committing to that design.
- **Exact server-side query shape** for "songs matching name and/or artist,
  deduped by title" — to be finalized at implementation time.
