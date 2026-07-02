import { test, expect } from '../fixtures'
import { LoginPage } from '../pages/LoginPage'
import { USERS } from '../users'

test.describe('Authentication', () => {
  test('redirects unauthenticated user to /login', async ({ guest }) => {
    await guest.goto('/project/library')
    await expect(guest).toHaveURL('/login')
  })

  test('logs in as philip and reaches library', async ({ guest }) => {
    const loginPage = new LoginPage(guest)
    await loginPage.goto()
    await loginPage.login(USERS.philip.email, USERS.philip.password)
    await loginPage.waitForRedirect()
    await expect(guest).toHaveURL('/project/library')
  })

  test('shows error on invalid credentials', async ({ guest }) => {
    const loginPage = new LoginPage(guest)
    await loginPage.goto()
    await loginPage.login('wrong@example.com', 'wrongpassword')
    await expect(loginPage.errorMessage).toBeVisible()
  })

  test('philip is authenticated via stored state', async ({ philip }) => {
    await philip.goto('/project/library')
    await expect(philip).toHaveURL('/project/library')
  })
})
