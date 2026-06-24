-- Replace all owner_id-based RLS policies with membership-based ones.
-- Depends on: 032 (project_memberships + helper functions).
--
-- New access model:
--   SELECT  → any project member (any role), or the community project
--   INSERT/UPDATE/DELETE → editor or administrator role
--   projects UPDATE/DELETE → administrator role only
--
-- The helper functions user_project_ids(), user_editor_project_ids(),
-- user_admin_project_ids(), and community_project_id() are SECURITY DEFINER
-- and bypass RLS internally to avoid recursion.

-- ===========================================================================
-- projects
-- ===========================================================================

DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Projects with active public libraries are viewable by anyone" ON public.projects;

CREATE POLICY "Users can view accessible projects"
  ON public.projects FOR SELECT
  USING (
    id IN (SELECT user_project_ids())
    OR slug = 'community'
    OR id IN (SELECT get_active_public_library_project_ids())
  );

-- Any authenticated user can create a project (they become administrator via trigger)
CREATE POLICY "Authenticated users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

CREATE POLICY "Administrators can update projects"
  ON public.projects FOR UPDATE
  USING (id IN (SELECT user_admin_project_ids()));

CREATE POLICY "Administrators can delete projects"
  ON public.projects FOR DELETE
  USING (id IN (SELECT user_admin_project_ids()));

-- ===========================================================================
-- library_songs
-- ===========================================================================

DROP POLICY IF EXISTS "Users can view their library songs" ON public.library_songs;
DROP POLICY IF EXISTS "Users can add to their library" ON public.library_songs;
DROP POLICY IF EXISTS "Users can update their library songs" ON public.library_songs;
DROP POLICY IF EXISTS "Users can delete from their library" ON public.library_songs;
DROP POLICY IF EXISTS "Library songs in active public libraries are viewable" ON public.library_songs;

CREATE POLICY "Members can view library songs"
  ON public.library_songs FOR SELECT
  USING (
    project_id IN (SELECT user_project_ids())
    OR project_id = community_project_id()
    OR project_id IN (SELECT get_active_public_library_project_ids())
  );

CREATE POLICY "Editors can add to library"
  ON public.library_songs FOR INSERT
  WITH CHECK (
    project_id IN (SELECT user_editor_project_ids())
    AND added_by = auth.uid()
  );

CREATE POLICY "Editors can update library songs"
  ON public.library_songs FOR UPDATE
  USING (project_id IN (SELECT user_editor_project_ids()));

CREATE POLICY "Editors can remove from library"
  ON public.library_songs FOR DELETE
  USING (project_id IN (SELECT user_editor_project_ids()));

-- ===========================================================================
-- tags
-- ===========================================================================

DROP POLICY IF EXISTS "Users can view own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can insert tags in own projects" ON public.tags;
DROP POLICY IF EXISTS "Users can update own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can delete own tags" ON public.tags;
DROP POLICY IF EXISTS "Tags in projects with active public libraries are viewable by a" ON public.tags;

CREATE POLICY "Members can view tags"
  ON public.tags FOR SELECT
  USING (
    project_id IN (SELECT user_project_ids())
    OR project_id = community_project_id()
    OR project_id IN (SELECT get_active_public_library_project_ids())
  );

CREATE POLICY "Editors can insert tags"
  ON public.tags FOR INSERT
  WITH CHECK (project_id IN (SELECT user_editor_project_ids()));

CREATE POLICY "Editors can update tags"
  ON public.tags FOR UPDATE
  USING (project_id IN (SELECT user_editor_project_ids()));

CREATE POLICY "Editors can delete tags"
  ON public.tags FOR DELETE
  USING (project_id IN (SELECT user_editor_project_ids()));

-- ===========================================================================
-- lists
-- ===========================================================================

DROP POLICY IF EXISTS "Users can view own lists" ON public.lists;
DROP POLICY IF EXISTS "Users can insert lists in own projects" ON public.lists;
DROP POLICY IF EXISTS "Users can update own lists" ON public.lists;
DROP POLICY IF EXISTS "Users can delete own lists" ON public.lists;

CREATE POLICY "Members can view lists"
  ON public.lists FOR SELECT
  USING (
    project_id IN (SELECT user_project_ids())
    OR project_id = community_project_id()
  );

CREATE POLICY "Editors can insert lists"
  ON public.lists FOR INSERT
  WITH CHECK (project_id IN (SELECT user_editor_project_ids()));

CREATE POLICY "Editors can update lists"
  ON public.lists FOR UPDATE
  USING (project_id IN (SELECT user_editor_project_ids()));

CREATE POLICY "Editors can delete lists"
  ON public.lists FOR DELETE
  USING (project_id IN (SELECT user_editor_project_ids()));

-- ===========================================================================
-- list_items
-- ===========================================================================

DROP POLICY IF EXISTS "Users can view own list_items" ON public.list_items;
DROP POLICY IF EXISTS "Users can insert own list_items" ON public.list_items;
DROP POLICY IF EXISTS "Users can update own list_items" ON public.list_items;
DROP POLICY IF EXISTS "Users can delete own list_items" ON public.list_items;

CREATE POLICY "Members can view list items"
  ON public.list_items FOR SELECT
  USING (
    list_id IN (
      SELECT id FROM public.lists
      WHERE project_id IN (SELECT user_project_ids())
         OR project_id = community_project_id()
    )
  );

CREATE POLICY "Editors can insert list items"
  ON public.list_items FOR INSERT
  WITH CHECK (
    list_id IN (
      SELECT id FROM public.lists
      WHERE project_id IN (SELECT user_editor_project_ids())
    )
  );

CREATE POLICY "Editors can update list items"
  ON public.list_items FOR UPDATE
  USING (
    list_id IN (
      SELECT id FROM public.lists
      WHERE project_id IN (SELECT user_editor_project_ids())
    )
  );

CREATE POLICY "Editors can delete list items"
  ON public.list_items FOR DELETE
  USING (
    list_id IN (
      SELECT id FROM public.lists
      WHERE project_id IN (SELECT user_editor_project_ids())
    )
  );

-- ===========================================================================
-- notes
-- ===========================================================================

DROP POLICY IF EXISTS "Users can view notes for their library" ON public.notes;
DROP POLICY IF EXISTS "Users can create notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete notes" ON public.notes;
DROP POLICY IF EXISTS "Notes in active public libraries are viewable" ON public.notes;

CREATE POLICY "Members can view notes"
  ON public.notes FOR SELECT
  USING (
    library_song_id IN (
      SELECT ls.id FROM public.library_songs ls
      WHERE ls.project_id IN (SELECT user_project_ids())
         OR ls.project_id = community_project_id()
    )
    OR is_public = TRUE
  );

CREATE POLICY "Editors can create notes"
  ON public.notes FOR INSERT
  WITH CHECK (
    library_song_id IN (
      SELECT ls.id FROM public.library_songs ls
      WHERE ls.project_id IN (SELECT user_editor_project_ids())
    )
    AND created_by = auth.uid()
    AND updated_by = auth.uid()
  );

CREATE POLICY "Editors can update notes"
  ON public.notes FOR UPDATE
  USING (
    library_song_id IN (
      SELECT ls.id FROM public.library_songs ls
      WHERE ls.project_id IN (SELECT user_editor_project_ids())
    )
  )
  WITH CHECK (updated_by = auth.uid());

CREATE POLICY "Editors can delete notes"
  ON public.notes FOR DELETE
  USING (
    library_song_id IN (
      SELECT ls.id FROM public.library_songs ls
      WHERE ls.project_id IN (SELECT user_editor_project_ids())
    )
  );

-- ===========================================================================
-- library_song_tags
-- ===========================================================================

DROP POLICY IF EXISTS "Users can view tags for their library" ON public.library_song_tags;
DROP POLICY IF EXISTS "Users can tag their library songs" ON public.library_song_tags;
DROP POLICY IF EXISTS "Users can remove tags from library" ON public.library_song_tags;
DROP POLICY IF EXISTS "Library song tags in active public libraries are viewable" ON public.library_song_tags;

CREATE POLICY "Members can view library song tags"
  ON public.library_song_tags FOR SELECT
  USING (
    library_song_id IN (
      SELECT ls.id FROM public.library_songs ls
      WHERE ls.project_id IN (SELECT user_project_ids())
         OR ls.project_id = community_project_id()
         OR ls.project_id IN (SELECT get_active_public_library_project_ids())
    )
  );

CREATE POLICY "Editors can tag library songs"
  ON public.library_song_tags FOR INSERT
  WITH CHECK (
    library_song_id IN (
      SELECT ls.id FROM public.library_songs ls
      WHERE ls.project_id IN (SELECT user_editor_project_ids())
    )
  );

CREATE POLICY "Editors can remove library song tags"
  ON public.library_song_tags FOR DELETE
  USING (
    library_song_id IN (
      SELECT ls.id FROM public.library_songs ls
      WHERE ls.project_id IN (SELECT user_editor_project_ids())
    )
  );

-- ===========================================================================
-- public_libraries
-- ===========================================================================

DROP POLICY IF EXISTS "Active public libraries are viewable by anyone" ON public.public_libraries;
DROP POLICY IF EXISTS "Owners can manage their public libraries" ON public.public_libraries;
DROP POLICY IF EXISTS "Owners can update their public libraries" ON public.public_libraries;
DROP POLICY IF EXISTS "Owners can delete their public libraries" ON public.public_libraries;

CREATE POLICY "Active public libraries are viewable by anyone"
  ON public.public_libraries FOR SELECT
  USING (
    is_active = TRUE
    OR project_id IN (SELECT user_project_ids())
  );

CREATE POLICY "Administrators can manage public libraries"
  ON public.public_libraries FOR INSERT
  WITH CHECK (project_id IN (SELECT user_admin_project_ids()));

CREATE POLICY "Administrators can update public libraries"
  ON public.public_libraries FOR UPDATE
  USING (project_id IN (SELECT user_admin_project_ids()))
  WITH CHECK (project_id IN (SELECT user_admin_project_ids()));

CREATE POLICY "Administrators can delete public libraries"
  ON public.public_libraries FOR DELETE
  USING (project_id IN (SELECT user_admin_project_ids()));

-- ===========================================================================
-- public_library_tags
-- ===========================================================================

DROP POLICY IF EXISTS "Owners can manage public library tags" ON public.public_library_tags;
DROP POLICY IF EXISTS "Public library tags are viewable by anyone" ON public.public_library_tags;

CREATE POLICY "Public library tags are viewable by anyone"
  ON public.public_library_tags FOR SELECT
  USING (
    public_library_id IN (
      SELECT pl.id FROM public.public_libraries pl
      WHERE pl.is_active = TRUE
         OR pl.project_id IN (SELECT user_project_ids())
    )
  );

CREATE POLICY "Administrators can manage public library tags"
  ON public.public_library_tags FOR ALL
  USING (
    public_library_id IN (
      SELECT pl.id FROM public.public_libraries pl
      WHERE pl.project_id IN (SELECT user_admin_project_ids())
    )
  )
  WITH CHECK (
    public_library_id IN (
      SELECT pl.id FROM public.public_libraries pl
      WHERE pl.project_id IN (SELECT user_admin_project_ids())
    )
  );

-- ===========================================================================
-- V1 legacy tables (songs, artists, song_artists, song_tags, songcode)
-- These are kept for backward compatibility and follow the same pattern.
-- ===========================================================================

-- songs
DROP POLICY IF EXISTS "Users can view own songs" ON public.songs;
DROP POLICY IF EXISTS "Users can insert songs in own projects" ON public.songs;
DROP POLICY IF EXISTS "Users can update own songs" ON public.songs;
DROP POLICY IF EXISTS "Users can delete own songs" ON public.songs;

CREATE POLICY "Members can view songs"
  ON public.songs FOR SELECT
  USING (project_id IN (SELECT user_project_ids()));

CREATE POLICY "Editors can insert songs"
  ON public.songs FOR INSERT
  WITH CHECK (project_id IN (SELECT user_editor_project_ids()));

CREATE POLICY "Editors can update songs"
  ON public.songs FOR UPDATE
  USING (project_id IN (SELECT user_editor_project_ids()));

CREATE POLICY "Editors can delete songs"
  ON public.songs FOR DELETE
  USING (project_id IN (SELECT user_editor_project_ids()));

-- artists (V1)
DROP POLICY IF EXISTS "Users can view artists in their project" ON public.artists;
DROP POLICY IF EXISTS "Users can create artists in their project" ON public.artists;
DROP POLICY IF EXISTS "Users can update artists in their project" ON public.artists;
DROP POLICY IF EXISTS "Users can delete artists in their project" ON public.artists;

CREATE POLICY "Members can view artists"
  ON public.artists FOR SELECT
  USING (project_id IN (SELECT user_project_ids()));

CREATE POLICY "Editors can create artists"
  ON public.artists FOR INSERT
  WITH CHECK (project_id IN (SELECT user_editor_project_ids()));

CREATE POLICY "Editors can update artists"
  ON public.artists FOR UPDATE
  USING (project_id IN (SELECT user_editor_project_ids()));

CREATE POLICY "Editors can delete artists"
  ON public.artists FOR DELETE
  USING (project_id IN (SELECT user_editor_project_ids()));

-- song_artists (V1)
DROP POLICY IF EXISTS "Users can view song_artists in their project" ON public.song_artists;
DROP POLICY IF EXISTS "Users can create song_artists in their project" ON public.song_artists;
DROP POLICY IF EXISTS "Users can update song_artists in their project" ON public.song_artists;
DROP POLICY IF EXISTS "Users can delete song_artists in their project" ON public.song_artists;

CREATE POLICY "Members can view song artists"
  ON public.song_artists FOR SELECT
  USING (
    song_id IN (
      SELECT s.id FROM public.songs s
      WHERE s.project_id IN (SELECT user_project_ids())
    )
  );

CREATE POLICY "Editors can manage song artists"
  ON public.song_artists FOR INSERT
  WITH CHECK (
    song_id IN (
      SELECT s.id FROM public.songs s
      WHERE s.project_id IN (SELECT user_editor_project_ids())
    )
  );

CREATE POLICY "Editors can update song artists"
  ON public.song_artists FOR UPDATE
  USING (
    song_id IN (
      SELECT s.id FROM public.songs s
      WHERE s.project_id IN (SELECT user_editor_project_ids())
    )
  );

CREATE POLICY "Editors can delete song artists"
  ON public.song_artists FOR DELETE
  USING (
    song_id IN (
      SELECT s.id FROM public.songs s
      WHERE s.project_id IN (SELECT user_editor_project_ids())
    )
  );

-- song_tags (V1)
DROP POLICY IF EXISTS "Users can view own song_tags" ON public.song_tags;
DROP POLICY IF EXISTS "Users can insert own song_tags" ON public.song_tags;
DROP POLICY IF EXISTS "Users can delete own song_tags" ON public.song_tags;

CREATE POLICY "Members can view song tags"
  ON public.song_tags FOR SELECT
  USING (
    song_id IN (
      SELECT s.id FROM public.songs s
      WHERE s.project_id IN (SELECT user_project_ids())
    )
  );

CREATE POLICY "Editors can manage song tags"
  ON public.song_tags FOR INSERT
  WITH CHECK (
    song_id IN (
      SELECT s.id FROM public.songs s
      WHERE s.project_id IN (SELECT user_editor_project_ids())
    )
  );

CREATE POLICY "Editors can delete song tags"
  ON public.song_tags FOR DELETE
  USING (
    song_id IN (
      SELECT s.id FROM public.songs s
      WHERE s.project_id IN (SELECT user_editor_project_ids())
    )
  );

-- songcode (V1)
DROP POLICY IF EXISTS "Users can view songcode for their project songs" ON public.songcode;
DROP POLICY IF EXISTS "Users can create songcode for their project songs" ON public.songcode;
DROP POLICY IF EXISTS "Users can update songcode for their project songs" ON public.songcode;
DROP POLICY IF EXISTS "Users can delete songcode for their project songs" ON public.songcode;

CREATE POLICY "Members can view songcode"
  ON public.songcode FOR SELECT
  USING (
    song_id IN (
      SELECT s.id FROM public.songs s
      WHERE s.project_id IN (SELECT user_project_ids())
    )
  );

CREATE POLICY "Editors can create songcode"
  ON public.songcode FOR INSERT
  WITH CHECK (
    song_id IN (
      SELECT s.id FROM public.songs s
      WHERE s.project_id IN (SELECT user_editor_project_ids())
    )
  );

CREATE POLICY "Editors can update songcode"
  ON public.songcode FOR UPDATE
  USING (
    song_id IN (
      SELECT s.id FROM public.songs s
      WHERE s.project_id IN (SELECT user_editor_project_ids())
    )
  );

CREATE POLICY "Editors can delete songcode"
  ON public.songcode FOR DELETE
  USING (
    song_id IN (
      SELECT s.id FROM public.songs s
      WHERE s.project_id IN (SELECT user_editor_project_ids())
    )
  );
