export interface BulkAction {
  label: string
  variant?: 'default' | 'danger' | 'warning'
  keepDrawerOpen?: boolean
  onClick: () => void
}
