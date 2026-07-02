import type { Page } from '@playwright/test'

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.page.fill('#email', email)
    await this.page.fill('#password', password)
    await this.page.click('button[type="submit"]')
  }

  async waitForRedirect() {
    await this.page.waitForURL('/project/library', { timeout: 15_000 })
  }

  get errorMessage() {
    return this.page.locator('.text-red-400')
  }

  get submitButton() {
    return this.page.locator('button[type="submit"]')
  }
}
