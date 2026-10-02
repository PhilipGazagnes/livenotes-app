import { test, expect } from '../fixtures'

test.describe('Library → create list → verify song', () => {
  test('adds first song to a new list and finds it on the lists page', async ({ philip }) => {
    const listName = `E2E List ${Date.now()}`

    // ── 1. Land on library ──────────────────────────────────────────────────
    await philip.goto('/project/library')
    const firstCard = philip.locator('[data-testid="card"]').first()
    await expect(firstCard).toBeVisible({ timeout: 15_000 })

    // Capture the first song's title so we can verify it at the end
    const songTitle = await firstCard.locator('h3').innerText()

    // ── 2. Open the 3-dots menu on the first song ───────────────────────────
    await firstCard.locator('[data-testid="card-menu-btn"]').click()

    // ── 3. Click "Manage Lists" ─────────────────────────────────────────────
    const manageListsItem = philip.locator('[data-testid="dropdown-item"]').filter({ hasText: 'Manage Lists' })
    await expect(manageListsItem).toBeVisible()
    await manageListsItem.click()

    // ── 4. Modal is open ────────────────────────────────────────────────────
    const modal = philip.locator('[data-testid="manage-lists-modal"]')
    await expect(modal).toBeVisible()

    // ── 5. Create a new list ────────────────────────────────────────────────
    await philip.fill('[data-testid="new-list-name-input"]', listName)
    await philip.click('[data-testid="create-list-btn"]')

    // New list appears in the checkboxes and is auto-checked
    const newListRow = modal.locator('[data-testid="list-checkbox-item"]').filter({ hasText: listName })
    await expect(newListRow).toBeVisible({ timeout: 8_000 })
    await expect(newListRow.locator('input[type="checkbox"]')).toBeChecked()

    // ── 6. Save ─────────────────────────────────────────────────────────────
    await philip.click('[data-testid="manage-lists-save"]')
    await expect(modal).not.toBeVisible({ timeout: 8_000 })

    // ── 7. Open hamburger → navigate to Lists ───────────────────────────────
    await philip.click('[data-testid="hamburger-menu-btn"]')
    await philip.click('[data-testid="nav-lists"]')
    await philip.waitForURL('/project/lists', { timeout: 10_000 })

    // ── 8. The new list card is visible ─────────────────────────────────────
    const listCard = philip.locator('[data-testid="card"]').filter({ hasText: listName })
    await expect(listCard).toBeVisible({ timeout: 10_000 })

    // ── 9. Click into the list ───────────────────────────────────────────────
    await listCard.click()
    await philip.waitForURL(/\/project\/lists\//, { timeout: 10_000 })

    // ── 10. The song is in the list ──────────────────────────────────────────
    const songCard = philip.locator('[data-testid="card"]').filter({ hasText: songTitle })
    await expect(songCard).toBeVisible({ timeout: 10_000 })
  })
})
