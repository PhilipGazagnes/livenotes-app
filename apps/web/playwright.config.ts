import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  // Run tests sequentially by default — community tests share a real DB
  fullyParallel: false,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Auth setup: logs in every user in e2e/users.ts and saves .auth/*.json
    { name: 'setup', testMatch: '**/auth/setup.ts' },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/specs/*.spec.ts',
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
