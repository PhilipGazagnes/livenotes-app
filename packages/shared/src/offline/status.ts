import type { LivenotesClient } from './fetchSnapshot'

/**
 * Server-side state of a project (ADR-010, ADR-011): its current version and
 * who holds the editing flag. Fetched in one small request.
 */
export interface ProjectStatus {
  version: number
  lastChangedAt: string | null
  lastChangedBy: { userId: string; name: string | null } | null
  /** Holder of a valid editing flag, null when nobody is editing */
  editor: { userId: string; name: string | null; since: string | null; expiresInSeconds: number } | null
}

interface RawProjectStatus {
  version: number
  last_changed_at: string | null
  last_changed_by: { user_id: string; name: string | null } | null
  editor: { user_id: string; name: string | null; since: string | null; expires_in_seconds: number } | null
}

function isRawProjectStatus(raw: unknown): raw is RawProjectStatus {
  return typeof raw === 'object' && raw !== null && typeof (raw as { version?: unknown }).version === 'number'
}

export function parseProjectStatus(raw: unknown): ProjectStatus | null {
  if (!isRawProjectStatus(raw)) return null
  return {
    version: raw.version,
    lastChangedAt: raw.last_changed_at,
    lastChangedBy: raw.last_changed_by
      ? { userId: raw.last_changed_by.user_id, name: raw.last_changed_by.name }
      : null,
    editor: raw.editor
      ? {
          userId: raw.editor.user_id,
          name: raw.editor.name,
          since: raw.editor.since,
          expiresInSeconds: raw.editor.expires_in_seconds,
        }
      : null,
  }
}

/** Current status of a project, or null if the project doesn't exist. Throws on request errors. */
export async function fetchProjectStatus(client: LivenotesClient, projectId: string): Promise<ProjectStatus | null> {
  const { data, error } = await client.rpc('get_project_status', { p_project_id: projectId })
  if (error) throw error
  return parseProjectStatus(data)
}

/** Result of start/renew/stop/release of the editing flag */
export interface EditFlagResult {
  ok: boolean
  reason: 'locked' | 'outdated' | 'not_allowed' | 'not_holder' | null
  status: ProjectStatus | null
}

export function parseEditFlagResult(raw: unknown): EditFlagResult {
  const value = (typeof raw === 'object' && raw !== null ? raw : {}) as {
    ok?: unknown
    reason?: unknown
    status?: unknown
  }
  return {
    ok: value.ok === true,
    reason: (typeof value.reason === 'string' ? value.reason : null) as EditFlagResult['reason'],
    status: parseProjectStatus(value.status),
  }
}
