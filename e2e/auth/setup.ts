import { test as setup } from '@playwright/test'
import { USERS, authFile } from '../users'

// Runs once per test session. Creates .auth/{key}.json for every user in the registry.
for (const [key, user] of Object.entries(USERS)) {
  setup(`auth:${key}`, async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', user.email)
    await page.fill('#password', user.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('/project/library', { timeout: 15_000 })
    await page.context().storageState({ path: authFile(key) })
  })
}
