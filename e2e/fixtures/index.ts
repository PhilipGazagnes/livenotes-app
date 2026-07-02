import { test as base, type Page } from '@playwright/test'
import { authFile, type UserKey } from '../users'

// One Page fixture per user key + an unauthenticated 'guest'.
// TypeScript enforces that every UserKey has a matching fixture here.
// When you add a user to users.ts, add a fixture block below.
type UserFixtures = Record<UserKey, Page> & { guest: Page }

export const test = base.extend<UserFixtures>({
  philip: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: authFile('philip') })
    const page = await ctx.newPage()
    await use(page)
    await ctx.close()
  },

  // member1: async ({ browser }, use) => {
  //   const ctx = await browser.newContext({ storageState: authFile('member1') })
  //   const page = await ctx.newPage()
  //   await use(page)
  //   await ctx.close()
  // },

  guest: async ({ browser }, use) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await use(page)
    await ctx.close()
  },
})

export { expect } from '@playwright/test'
