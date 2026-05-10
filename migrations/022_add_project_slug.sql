-- Migration: 022_add_project_slug.sql
-- Add URL slug to projects for public library URLs

BEGIN;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug) WHERE slug IS NOT NULL;

COMMENT ON COLUMN projects.slug IS 'URL-friendly identifier used in public library URLs (/{slug}/{library-slug})';

COMMIT;
