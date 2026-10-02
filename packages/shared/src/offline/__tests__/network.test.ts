import { describe, expect, it, vi } from 'vitest'
import { isNetworkError, NetworkTimeoutError, OfflineRequestError, withNetworkTimeout } from '../network'

describe('isNetworkError', () => {
  it.each([
    new TypeError('Failed to fetch'),
    new TypeError('NetworkError when attempting to fetch resource.'),
    new TypeError('Load failed'),
    { message: 'TypeError: Failed to fetch' },
    new NetworkTimeoutError(10),
    new OfflineRequestError(),
    { message: 'OfflineRequestError: You are offline. This action requires an internet connection.' },
  ])('treats %s as a network error', (err) => {
    expect(isNetworkError(err)).toBe(true)
  })

  it.each([
    { message: 'new row violates row-level security policy', code: '42501' },
    new Error('JSON object requested, multiple (or no) rows returned'),
    null,
    'oops',
  ])('does not treat %s as a network error', (err) => {
    expect(isNetworkError(err)).toBe(false)
  })
})

describe('withNetworkTimeout', () => {
  it('resolves when the promise is fast enough', async () => {
    await expect(withNetworkTimeout(Promise.resolve(1), 50)).resolves.toBe(1)
  })

  it('rejects with NetworkTimeoutError when too slow', async () => {
    vi.useFakeTimers()
    const slow = new Promise(resolve => setTimeout(() => resolve('late'), 1000))
    const result = withNetworkTimeout(slow, 100)
    vi.advanceTimersByTime(100)
    await expect(result).rejects.toBeInstanceOf(NetworkTimeoutError)
    vi.useRealTimers()
  })
})
