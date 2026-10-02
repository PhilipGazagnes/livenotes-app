-- Grant permissions on tables added in migrations 031–035.
-- These tables were created without explicit grants; the authenticated role
-- needs at minimum SELECT to read through RLS policies.

GRANT SELECT, UPDATE ON public.profiles TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_memberships TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.invitation_links TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.note_push_requests TO authenticated;
