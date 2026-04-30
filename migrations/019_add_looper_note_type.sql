-- Migration: 019_add_looper_note_type.sql
-- Add 'looper' note type to the note_type enum

-- Add 'looper' to note_type enum
ALTER TYPE note_type ADD VALUE IF NOT EXISTS 'looper';
