import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OfflineRequestError } from '@livenotes/shared/offline'
import { createOfflineAwareFetch } from '../supabaseFetch'
import { setForceOffline } from '../offlineState'

const REST = 'https://x.supabase.co/rest/v1/tags?select=*'
const AUTH = 'https://x.supabase.co/auth/v1/token'

beforeEach(() => {
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

  it('online: requests go to the network', async () => {
    const base = respond(201)
    await createOfflineAwareFetch(base)(REST, { method: 'POST' })
    expect(base).toHaveBeenCalledTimes(1)
  })
})
