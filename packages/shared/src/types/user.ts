export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  active_project_id: string | null
  is_super_admin: boolean
  created_at: string
  updated_at: string
}
