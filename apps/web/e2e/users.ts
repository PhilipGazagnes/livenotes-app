export interface TestUser {
  email: string
  password: string
  displayName: string
}

// Credentials never live in the repository (ADR-019): they come from the gitignored
// `.env.test` at the repo root, loaded by playwright.config.ts.
function fromEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is missing: copy .env.test.example to .env.test at the repo root and fill it in`)
  return value
}

// Registry of all e2e test accounts.
// Add an entry here (and its variables in .env.test) when you need a new persona for community tests.
export const USERS = {
  philip: {
    email: fromEnv('E2E_EMAIL'),
    password: fromEnv('E2E_PASSWORD'),
    displayName: 'Philip',
  },
} satisfies Record<string, TestUser>

export type UserKey = keyof typeof USERS

export const authFile = (key: string) => `e2e/.auth/${key}.json`
