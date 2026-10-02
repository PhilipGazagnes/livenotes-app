import type { Tag } from './tag'

export interface ContactInfo {
  phone?: string
  email?: string
  location?: string
  website?: string
  facebook?: string
  instagram?: string
  x?: string
  youtube?: string
}

export type ProjectRole = 'reader' | 'editor' | 'administrator'

export interface ProjectMembership {
  id: string
  project_id: string
  user_id: string
  role: ProjectRole
  invited_by: string | null
  joined_at: string
}

export interface InvitationLink {
  id: string
  project_id: string
  token: string
  role: ProjectRole
  created_by: string
  created_at: string
  expires_at: string
  used_by: string | null
  used_at: string | null
  is_revoked: boolean
}

export type PushRequestStatus = 'pending' | 'approved' | 'rejected'

export interface NotePushRequest {
  id: string
  source_note_id: string
  source_project_id: string
  target_project_id: string
  pushed_by: string
  status: PushRequestStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface Project {
  id: string
  name: string
  slug: string | null
  owner_id: string
  created_at: string | null
  updated_at: string | null
  description: string | null
  thumbnail_url: string | null
  contact_enabled: boolean
  contact_info: ContactInfo | null
}

export interface PublicLibrary {
  id: string
  project_id: string
  name: string
  slug: string
  is_active: boolean
  header_image_mobile: string | null
  header_image_desktop: string | null
  created_at: string
  created_by: string
}

export interface PublicLibraryWithTags extends PublicLibrary {
  tags: Tag[]
}

export interface PublicLibraryTag {
  public_library_id: string
  tag_id: string
}
