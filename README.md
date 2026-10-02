# Livenotes

A song catalog, setlist and chord chart tool for musicians.

This repository is a monorepo (npm workspaces). Strategy and decisions are in the documentation repo: [Strategy 2026](../livenotes-documentation/app/strategy-2026.md) and [decision records](../livenotes-documentation/app/decisions/README.md).

```
livenotes-app/
├── apps/
│   └── web/              # Vue 3 web app (PWA), deployed on Netlify
│       ├── src/
│       ├── e2e/          # Playwright tests
│       ├── netlify/      # Netlify functions
│       └── public/
├── packages/
│   └── shared/           # @livenotes/shared: framework-agnostic types and data layer
├── supabase/
│   └── migrations/       # Database migration files (one backend for all apps)
├── scripts/              # DB backup / prod→dev sync scripts
└── docs/                 # App-level notes (technical debt, flows)
```

A React Native app (`apps/mobile`) and a SongCode editor package (`packages/editor`) come later (ADR-001, ADR-006).

## Tech stack (web)

- **Frontend**: Vue 3 + TypeScript (+ Ionic Vue, to be removed, ADR-003)
- **Styling**: Tailwind CSS
- **State**: Pinia
- **Backend**: Supabase (PostgreSQL + Auth)
- **Offline**: PWA service worker (app shell) + local data snapshot in IndexedDB (Dexie)
- **Build**: Vite
- **Hosting**: Netlify

## Getting started

Prerequisites: Node.js 20+ and npm (the repo uses **npm workspaces**; don't use yarn).

```bash
npm install                 # from the repo root, installs every workspace
cp .env.example .env        # fill in the Supabase credentials
npm run dev                 # http://localhost:5173
```

The `.env` file lives at the **repo root**: the web app reads it from there (`envDir` in `apps/web/vite.config.ts`), and so do the `scripts/`.

## Scripts (run from the root)

```bash
npm run dev            # web dev server
npm run build          # type check + production build (apps/web/dist)
npm run preview        # preview the production build
npm test               # unit tests (web + shared packages)
npm run test:e2e       # Playwright e2e tests (apps/web/e2e)
npm run typecheck      # type check every workspace
```

To add a dependency to one workspace: `npm install <pkg> -w @livenotes/web` (or `-w @livenotes/shared`).

## Supabase

```bash
npx supabase migration new migration_name   # new migration in supabase/migrations
npx supabase db push                        # push migrations
```

Regenerate the typed client: see [packages/shared/README.md](./packages/shared/README.md).

## Deployment (Netlify)

Configured by `netlify.toml` at the repo root: the build runs from the root (`npm run build`), publishes `apps/web/dist` and deploys functions from `apps/web/netlify/functions`. The Netlify site's **base directory must be empty** (repo root).

Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Related repositories

- [livenotes-documentation](../livenotes-documentation): specifications, strategy and decision records
- [livenotes-sc-converter](../livenotes-sc-converter): SongCode parser (`@livenotes/songcode-converter`)
