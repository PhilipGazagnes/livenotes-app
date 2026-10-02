import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OfflineRequestError } from '@livenotes/shared/offline'
import { createOfflineAwareFetch } from '../supabaseFetch'
import { onDataWritten, setForceOffline } from '../offlineState'

const REST = 'https://x.supabase.co/rest/v1/tags?select=*'
const AUTH = 'https://x.supabase.co/auth/v1/token'

const written = vi.fn()

beforeEach(() => {
  written.mockReset()
  onDataWritten(written)
  setForceOffline(false)
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
})

afterEach(() => vi.restoreAllMocks())

function respond(status: number) {
  return vi.fn().mockResolvedValue(new Response(null, { status }))
}

describe('createOfflineAwareFetch', () => {
  it('offline: data requests fail fast without touching the network', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const base = respond(200)
    await expect(createOfflineAwareFetch(base)(REST, { method: 'POST' })).rejects.toBeInstanceOf(OfflineRequestError)
    expect(base).not.toHaveBeenCalled()
  })

  it('force offline blocks data requests too', async () => {
    setForceOffline(true)
    const base = respond(200)
    await expect(createOfflineAwareFetch(base)(REST)).rejects.toBeInstanceOf(OfflineRequestError)
  })

  it('offline: auth requests are not blocked', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const base = respond(200)
    await createOfflineAwareFetch(base)(AUTH, { method: 'POST' })
    expect(base).toHaveBeenCalled()
  })

  it('online: a successful write marks the snapshot dirty', async () => {
    await createOfflineAwareFetch(respond(201))(REST, { method: 'POST' })
    expect(written).toHaveBeenCalledTimes(1)
  })

  it('online: reads and failed writes do not', async () => {
    await createOfflineAwareFetch(respond(200))(REST)
    await createOfflineAwareFetch(respond(400))(REST, { method: 'PATCH' })
    expect(written).not.toHaveBeenCalled()
  })
})
