import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

import { useUiStore } from '../ui'
import { EditNotAllowedError } from '@/lib/offline/projectWrites'

describe('ui store: showErrorToast wording (docs/ERROR_HANDLING.md)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })

  it('shows a refused write as is, the same on every screen', () => {
    const ui = useUiStore()
    ui.showErrorToast('delete note', new EditNotAllowedError("You're not editing this project."))
    expect(ui.toasts).toHaveLength(1)
    expect(ui.toasts[0]).toMatchObject({ message: "You're not editing this project.", type: 'error', context: undefined })
  })

  it('says what failed, with the error message as detail', () => {
    const ui = useUiStore()
    ui.showErrorToast('create tag', new Error('duplicate key'))
    expect(ui.toasts[0]).toMatchObject({ message: 'Failed to create tag', type: 'error', context: 'duplicate key' })
  })

  it('accepts a plain message', () => {
    const ui = useUiStore()
    ui.showErrorToast('save', 'Operation timed out. Please try again.')
    expect(ui.toasts[0]).toMatchObject({ message: 'Failed to save', context: 'Operation timed out. Please try again.' })
  })
})
