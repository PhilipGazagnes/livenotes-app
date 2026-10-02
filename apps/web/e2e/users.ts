export interface TestUser {
  email: string
  password: string
  displayName: string
}

// Registry of all e2e test accounts.
// Add an entry here when you need a new persona for community tests.
export const USERS = {
  philip: {
    email: 'philip.slimprod@gmail.com',
    password: 'Live129225!895$',
    displayName: 'Philip',
  },
  // Example — add community test accounts:
  // member1: {
  //   email: 'member1@yourdomain.com',
  //   password: '...',
  //   displayName: 'Member One',
  // },
} satisfies Record<string, TestUser>

export type UserKey = keyof typeof USERS

export const authFile = (key: string) => `e2e/.auth/${key}.json`
