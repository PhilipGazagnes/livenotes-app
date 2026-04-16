-- Migration: Add Project Notes Field Settings
-- Description: Add customizable label and visibility toggle for notes field
-- Date: April 16, 2026

-- =============================================================================
-- Add Notes Field Settings to Projects Table
-- =============================================================================

-- Add notes field label (customizable, max 30 chars)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS notes_field_label VARCHAR(30) DEFAULT 'Notes';

-- Add notes field enabled toggle
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS notes_field_enabled BOOLEAN DEFAULT true;

COMMENT ON COLUMN projects.notes_field_label IS 'Custom label for the notes field (max 30 chars)';
COMMENT ON COLUMN projects.notes_field_enabled IS 'Whether the notes field is visible in song forms';

-- =============================================================================
-- Update existing projects with default values
-- =============================================================================

UPDATE projects 
SET 
  notes_field_label = 'Notes',
  notes_field_enabled = true
WHERE 
  notes_field_label IS NULL 
  OR notes_field_enabled IS NULL;
