import { defineConfig, devices } from '@playwright/test'
import { MOCK_SUPABASE_URL } from './e2e/offline/mockSupabase'

/**
 * Offline e2e tests: a production build (service worker included) pointed at a
 * mocked Supabase, so they run without a database or test account.
 */
const PORT = 4174

export default defineConfig({
  testDir: './e2e/offline',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `vite build --outDir dist-e2e && vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      VITE_SUPABASE_URL: MOCK_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: 'mock-anon-key',
    },
  },
})
