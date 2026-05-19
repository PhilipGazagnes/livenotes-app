-- Add optional header image URLs (mobile and desktop) to public libraries.
-- Each is shown instead of the text header at the corresponding breakpoint.
ALTER TABLE public_libraries
  ADD COLUMN IF NOT EXISTS header_image_mobile  TEXT,
  ADD COLUMN IF NOT EXISTS header_image_desktop TEXT;
