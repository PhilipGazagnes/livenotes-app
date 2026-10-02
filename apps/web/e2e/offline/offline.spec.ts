import { test, expect, type Page } from '@playwright/test'
import { mockSupabase, MOCK_SUPABASE_URL, USER_ID } from './mockSupabase'

const OFFLINE_DB = `livenotes-offline-${USER_ID}`
const AUTH_STORAGE_KEY = `sb-${new URL(MOCK_SUPABASE_URL).hostname.split('.')[0]}-auth-token`

const card = (page: Page, text: string) => page.locator('[data-testid="card"]').filter({ hasText: text })

async function login(page: Page) {
  await page.goto('/login')
  await page.fill('#email', 'offline@test.dev')
  await page.fill('#password', 'irrelevant')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/project/library')
}

/** Number of project snapshots stored for the test user (0 when the DB does not exist). */
function snapshotCount(page: Page): Promise<number> {
  return page.evaluate(async (dbName) => {
    const names = (await indexedDB.databases()).map(d => d.name)
    if (!names.includes(dbName)) return 0
    return new Promise<number>((resolve, reject) => {
      const open = indexedDB.open(dbName)
      open.onerror = () => reject(open.error)
      open.onsuccess = () => {
        const db = open.result
        if (!db.objectStoreNames.contains('snapshots')) { db.close(); return resolve(0) }
        const req = db.transaction('snapshots').objectStore('snapshots').count()
        req.onsuccess = () => { db.close(); resolve(req.result) }
        req.onerror = () => reject(req.error)
      }
    })
  }, OFFLINE_DB)
}

async function loginAndWaitForSnapshot(page: Page) {
  await login(page)
  await expect(card(page, 'Wonderwall')).toBeVisible()
  // Auto-sync after login writes the snapshot
  await expect.poll(() => snapshotCount(page), { timeout: 15_000 }).toBe(1)
  // App shell is cached by the service worker
  await page.evaluate(() => navigator.serviceWorker.ready)
}

test.describe('Offline mode (mocked Supabase)', () => {
  test('library, search and setlists stay readable offline, editing is hidden', async ({ page, context }) => {
    const backend = await mockSupabase(context)
    await loginAndWaitForSnapshot(page)
    await expect(page.getByTestId('sticky-bar-new-btn')).toBeVisible()

    backend.offline = true
    await context.setOffline(true)
    await page.reload()

    // Library from the snapshot
    await expect(card(page, 'Wonderwall')).toBeVisible({ timeout: 15_000 })
    await expect(card(page, 'Yesterday')).toBeVisible()
    await expect(page.getByText('offline', { exact: true })).toBeVisible()
    await expect(page.getByTestId('offline-no-snapshot')).toHaveCount(0)

    // Read-only
    await expect(page.getByTestId('sticky-bar-new-btn')).toHaveCount(0)
    await expect(page.locator('[data-testid="card-menu-btn"]')).toHaveCount(0)

    // Search works on local data
    await page.fill('input[placeholder="Search..."]', 'yester')
    await expect(card(page, 'Yesterday')).toBeVisible()
    await expect(card(page, 'Wonderwall')).toHaveCount(0)

    // Setlists and a setlist's content
    await page.goto('/project/lists')
    await expect(card(page, 'Friday Gig')).toBeVisible({ timeout: 15_000 })
    await card(page, 'Friday Gig').click()
    await page.waitForURL(/\/project\/lists\/l1/)
    await expect(card(page, 'Yesterday')).toBeVisible({ timeout: 15_000 })
    await expect(card(page, 'Wonderwall')).toBeVisible()
  })

  test('starts offline even when the session token has expired', async ({ page, context }) => {
    const backend = await mockSupabase(context)
    await loginAndWaitForSnapshot(page)

    // Simulate an access token that expired while the device was offline
    await page.evaluate((key) => {
      const stored = JSON.parse(localStorage.getItem(key)!)
      stored.expires_at = Math.floor(Date.now() / 1000) - 60
      localStorage.setItem(key, JSON.stringify(stored))
    }, AUTH_STORAGE_KEY)

    backend.offline = true
    await context.setOffline(true)
    await page.reload()

    await expect(page).toHaveURL(/\/project\/library/)
    await expect(card(page, 'Wonderwall')).toBeVisible({ timeout: 15_000 })
  })

  test('offline before any sync shows a clear notice', async ({ page, context }) => {
    const backend = await mockSupabase(context)
    await login(page)
    await expect.poll(() => snapshotCount(page), { timeout: 15_000 }).toBe(1)
    await page.evaluate(() => navigator.serviceWorker.ready)

    // Drop the snapshot, then go offline
    await page.evaluate((dbName) => new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(dbName)
      req.onsuccess = req.onerror = req.onblocked = () => resolve()
    }), OFFLINE_DB)
    backend.offline = true
    await context.setOffline(true)
    await page.reload()

    await expect(page.getByTestId('offline-no-snapshot')).toBeVisible({ timeout: 15_000 })
  })

  test('logging out deletes the offline data', async ({ page, context }) => {
    await mockSupabase(context)
    await loginAndWaitForSnapshot(page)

    await page.getByLabel('Project menu').click()
    await page.getByRole('button', { name: 'Log out' }).click()
    await page.getByRole('button', { name: 'Sign Out' }).click()
    await page.waitForURL('**/login')

    await expect.poll(() => snapshotCount(page)).toBe(0)
    expect(await page.evaluate(() => localStorage.getItem('livenotes-offline-user'))).toBeNull()
  })
})
