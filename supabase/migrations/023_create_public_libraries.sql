-- Migration: 023_create_public_libraries.sql
-- Public libraries: shareable, audience-facing song list pages

BEGIN;

-- Public libraries table
CREATE TABLE IF NOT EXISTS public_libraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  CONSTRAINT unique_project_library_slug UNIQUE (project_id, slug),
  CHECK (length(trim(name)) >= 1 AND length(trim(name)) <= 60),
  CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' OR slug ~ '^[a-z0-9]$')
);

CREATE INDEX idx_public_libraries_project ON public_libraries(project_id);
CREATE INDEX idx_public_libraries_slug ON public_libraries(slug);

-- Junction: public library ↔ tags
CREATE TABLE IF NOT EXISTS public_library_tags (
  public_library_id UUID NOT NULL REFERENCES public_libraries(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (public_library_id, tag_id)
);

CREATE INDEX idx_public_library_tags_library ON public_library_tags(public_library_id);
CREATE INDEX idx_public_library_tags_tag ON public_library_tags(tag_id);

-- RLS: public_libraries
ALTER TABLE public_libraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active public libraries are viewable by anyone"
  ON public_libraries FOR SELECT
  USING (
    is_active = true
    OR project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
  );

CREATE POLICY "Owners can manage their public libraries"
  ON public_libraries FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid()));

CREATE POLICY "Owners can update their public libraries"
  ON public_libraries FOR UPDATE
  USING (project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid()));

CREATE POLICY "Owners can delete their public libraries"
  ON public_libraries FOR DELETE
  USING (project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid()));

-- RLS: public_library_tags
ALTER TABLE public_library_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public library tags are viewable by anyone"
  ON public_library_tags FOR SELECT
  USING (
    public_library_id IN (
      SELECT id FROM public_libraries
      WHERE is_active = true
        OR project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
    )
  );

CREATE POLICY "Owners can manage public library tags"
  ON public_library_tags FOR ALL
  USING (
    public_library_id IN (
      SELECT pl.id FROM public_libraries pl
      JOIN projects p ON pl.project_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public_library_id IN (
      SELECT pl.id FROM public_libraries pl
      JOIN projects p ON pl.project_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

-- Allow anon to read library_songs that belong to a project with an active public library
CREATE POLICY "Library songs in active public libraries are viewable"
  ON library_songs FOR SELECT
  USING (
    project_id IN (SELECT project_id FROM public_libraries WHERE is_active = true)
  );

-- Allow anon to read library_song_tags for those songs
CREATE POLICY "Library song tags in active public libraries are viewable"
  ON library_song_tags FOR SELECT
  USING (
    library_song_id IN (
      SELECT ls.id FROM library_songs ls
      WHERE ls.project_id IN (SELECT project_id FROM public_libraries WHERE is_active = true)
    )
  );

-- Allow anon to read lyrics notes for songs in active public libraries
CREATE POLICY "Lyrics notes in active public libraries are viewable"
  ON notes FOR SELECT
  USING (
    type = 'lyrics'
    AND library_song_id IN (
      SELECT ls.id FROM library_songs ls
      WHERE ls.project_id IN (SELECT project_id FROM public_libraries WHERE is_active = true)
    )
  );

COMMENT ON TABLE public_libraries IS 'Audience-facing shareable song list pages, accessible at /{project-slug}/{library-slug}';
COMMENT ON TABLE public_library_tags IS 'Tags that define which songs appear in a public library (songs with ANY of these tags are shown)';

COMMIT;
