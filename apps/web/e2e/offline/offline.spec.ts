import { test, expect, type Page } from '@playwright/test'
import { changeByOtherMember, mockSupabase, MOCK_SUPABASE_URL, otherMemberStartsEditing, USER_ID } from './mockSupabase'

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
  // The first read downloads the project into the local copy (ADR-009)
  await expect.poll(() => snapshotCount(page), { timeout: 15_000 }).toBe(1)
  // App shell is cached by the service worker
  await page.evaluate(() => navigator.serviceWorker.ready)
}

async function openProjectMenu(page: Page) {
  await page.getByTestId('project-menu-btn').click()
}

// Disabled edit controls are aria-disabled but still tappable (they explain why): click with force
const newButton = (page: Page) => page.getByTestId('sticky-bar-new-btn')

test.describe('Offline mode (mocked Supabase)', () => {
  test('library, search and setlists stay readable offline, edit controls are disabled', async ({ page, context }) => {
    const backend = await mockSupabase(context)
    await loginAndWaitForSnapshot(page)
    await expect(newButton(page)).toBeVisible()

    backend.offline = true
    await context.setOffline(true)
    await page.reload()

    // Library from the snapshot
    await expect(card(page, 'Wonderwall')).toBeVisible({ timeout: 15_000 })
    await expect(card(page, 'Yesterday')).toBeVisible()
    await expect(page.getByText('offline', { exact: true })).toBeVisible()
    await expect(page.getByTestId('offline-no-snapshot')).toHaveCount(0)

    // Read-only: controls stay visible, disabled, and say why (ADR-013)
    await expect(newButton(page)).toHaveAttribute('aria-disabled', 'true')
    await expect(page.locator('[data-testid="card-menu-btn"]').first()).toHaveAttribute('aria-disabled', 'true')
    await newButton(page).click({ force: true })
    await expect(page.getByText('Editing needs a connection')).toBeVisible()

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

  test('logging out keeps the local data (ADR-014)', async ({ page, context }) => {
    await mockSupabase(context)
    await loginAndWaitForSnapshot(page)

    await openProjectMenu(page)
    await page.getByRole('button', { name: 'Log out' }).click()
    await page.getByRole('button', { name: 'Sign Out' }).click()
    await page.waitForURL('**/login')

    expect(await snapshotCount(page)).toBe(1)
    expect(await page.evaluate(() => localStorage.getItem('livenotes-offline-user'))).toBeNull()
  })

  test('"Delete local data" empties the screen until Sync (what you see = what is stored)', async ({ page, context }) => {
    await mockSupabase(context)
    await loginAndWaitForSnapshot(page)

    await openProjectMenu(page)
    await page.getByTestId('local-data-menu-btn').click()
    await expect(page.getByTestId('local-data-usage')).toContainText('1 project')
    await page.getByTestId('delete-local-data-btn').click()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()

    // Nothing in the database, nothing on screen, no automatic download
    await expect.poll(() => snapshotCount(page)).toBe(0)
    await expect(card(page, 'Wonderwall')).toHaveCount(0)
    const banner = page.getByTestId('sync-available')
    await expect(banner).toContainText('not on this device')
    await page.reload()
    await expect(banner).toContainText('not on this device', { timeout: 15_000 })
    expect(await snapshotCount(page)).toBe(0)

    // Sync brings it back
    await banner.getByRole('button', { name: 'Sync' }).click()
    await expect(card(page, 'Wonderwall')).toBeVisible({ timeout: 15_000 })
    await expect(banner).toHaveCount(0)
    expect(await snapshotCount(page)).toBe(1)
  })

  test('edit mode: start editing to enable edit controls, stop to leave (ADR-011)', async ({ page, context }) => {
    const backend = await mockSupabase(context)
    await loginAndWaitForSnapshot(page)

    // Viewing mode by default
    await expect(newButton(page)).toHaveAttribute('aria-disabled', 'true')
    await newButton(page).click({ force: true })
    await expect(page.getByText('Start editing first (project menu)')).toBeVisible()

    await openProjectMenu(page)
    await page.getByTestId('start-editing-btn').click()
    await expect(page.getByTestId('editing-indicator')).toBeVisible()
    await expect(newButton(page)).not.toHaveAttribute('aria-disabled')
    expect(backend.editorId).toBe(USER_ID)

    await openProjectMenu(page)
    await page.getByTestId('stop-editing-btn').click()
    await expect(page.getByTestId('editing-indicator')).toHaveCount(0)
    await expect(newButton(page)).toHaveAttribute('aria-disabled', 'true')
    expect(backend.editorId).toBeNull()
  })

  test('another member editing: controls say who, the header shows it', async ({ page, context }) => {
    const backend = await mockSupabase(context)
    await loginAndWaitForSnapshot(page)

    otherMemberStartsEditing(backend)
    await page.reload()
    await expect(card(page, 'Wonderwall')).toBeVisible({ timeout: 15_000 })

    await expect(page.getByTestId('editing-indicator')).toBeVisible()
    await newButton(page).click({ force: true })
    await expect(page.getByText('Being edited by Alex')).toBeVisible()
  })

  test('a change by another member shows "sync available"; nothing changes until Sync (ADR-010)', async ({ page, context }) => {
    const backend = await mockSupabase(context)
    await loginAndWaitForSnapshot(page)
    await expect(page.getByTestId('sync-available')).toHaveCount(0)

    changeByOtherMember(backend)
    await page.reload()
    await expect(card(page, 'Wonderwall')).toBeVisible({ timeout: 15_000 })

    const banner = page.getByTestId('sync-available')
    await expect(banner).toContainText('Updated by Alex')
    // Starting to edit an outdated copy is refused
    await openProjectMenu(page)
    await page.getByTestId('start-editing-btn').click()
    await expect(page.getByText('Your copy is outdated. Sync first.').first()).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).first().click()

    await banner.getByRole('button', { name: 'Sync' }).click()
    await expect(banner).toHaveCount(0)
  })
})
