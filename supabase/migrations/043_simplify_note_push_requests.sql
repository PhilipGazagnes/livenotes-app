-- Drop review flow: approval not implemented, table is a plain audit log
DROP POLICY IF EXISTS "Editors can review push requests" ON note_push_requests;

ALTER TABLE note_push_requests
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS reviewed_by,
  DROP COLUMN IF EXISTS reviewed_at;

DROP TYPE IF EXISTS push_request_status;
