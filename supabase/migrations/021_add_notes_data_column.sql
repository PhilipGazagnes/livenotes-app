-- Migration: 021_add_notes_data_column.sql
-- Add structured JSONB data column to notes table.
-- This replaces the pattern of JSON-stringifying type-specific fields into content TEXT.
--
-- Per type:
--   looper   → data: { bpm, pattern1, pattern1_var, pattern2, pattern2_var, comment }
--   songcode → data: { livenotes_json, livenotes_json_updated_at }
--   others   → data: null  (content TEXT is sufficient)

BEGIN;

ALTER TABLE notes ADD COLUMN IF NOT EXISTS data JSONB;

-- Migrate existing looper notes: move JSON string from content → data, clear content.
-- Guards against non-JSON content with a regex check before casting.
UPDATE notes
SET
  data    = content::jsonb,
  content = NULL
WHERE type = 'looper'
  AND content IS NOT NULL
  AND content != ''
  AND content ~ '^\s*\{';

COMMENT ON COLUMN notes.data IS 'Type-specific structured data (looper fields, songcode livenotes_json, etc.)';

COMMIT;
