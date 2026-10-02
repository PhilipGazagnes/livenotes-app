-- Migration 023 created public_libraries and public_library_tags but forgot to grant
-- access to the authenticated/anon roles. Every policy subquery referencing these tables
-- was failing with "permission denied", cascading into empty results on library_songs.

GRANT SELECT ON public_libraries TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public_libraries TO authenticated;

GRANT SELECT ON public_library_tags TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public_library_tags TO authenticated;
