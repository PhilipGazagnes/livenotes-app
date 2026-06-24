-- Note push requests: a user pushes a note to another project (or community).
-- An editor or administrator of the target project approves or rejects it.
-- On approval the note is duplicated into the target project by the app layer.

CREATE TYPE public.push_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.note_push_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  source_project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  target_project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  pushed_by UUID NOT NULL REFERENCES auth.users(id),
  status public.push_request_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (source_project_id != target_project_id)
);

CREATE INDEX note_push_requests_target_project_idx ON public.note_push_requests(target_project_id);
CREATE INDEX note_push_requests_pushed_by_idx ON public.note_push_requests(pushed_by);

ALTER TABLE public.note_push_requests ENABLE ROW LEVEL SECURITY;

-- Users can view requests they sent, or requests targeting projects they belong to
CREATE POLICY "Users can view relevant push requests"
  ON public.note_push_requests FOR SELECT
  USING (
    pushed_by = auth.uid()
    OR target_project_id IN (SELECT user_project_ids())
  );

-- Any project member can push a note out of a project they have access to
CREATE POLICY "Members can create push requests"
  ON public.note_push_requests FOR INSERT
  WITH CHECK (
    pushed_by = auth.uid()
    AND source_project_id IN (SELECT user_project_ids())
  );

-- Editors and administrators of the target project can approve or reject
CREATE POLICY "Editors can review push requests"
  ON public.note_push_requests FOR UPDATE
  USING (target_project_id IN (SELECT user_editor_project_ids()))
  WITH CHECK (
    target_project_id IN (SELECT user_editor_project_ids())
    AND reviewed_by = auth.uid()
  );
