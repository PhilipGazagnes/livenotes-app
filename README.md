# Livenotes App

A cross-platform song catalog and organization system for musicians.

## Overview

Livenotes V1 is a song catalog and organization system that allows musicians to:
- Track songs with metadata (title, artist, notes, POC ID)
- Organize songs with tags and lists
- Search and filter songs
- Manage setlists with custom ordering
- Access from any device (web-based, mobile-first design)

**Future versions** will add SongCode editing (V2), chord chart viewing (V2), and collaboration features (V3).

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Ionic Vue
- **Styling**: Tailwind CSS (dark mode)
- **State**: Pinia
- **Backend**: Supabase (PostgreSQL + Auth)
- **Build**: Vite
- **Hosting**: Netlify/Vercel

## Documentation

Complete specifications are in the `livenotes-documentation` repository:

- [Roadmap](../livenotes-documentation/app/roadmap.md) - Product strategy (V1-V4)
- [V1 Implementation Plan](./IMPLEMENTATION_PLAN.md) - Step-by-step development guide
- [V1 UI/UX Spec](../livenotes-documentation/app/v1-ui-spec.md) - Complete UI specifications
- [V1 Technical Spec](../livenotes-documentation/app/v1-technical-spec.md) - Complete technical specifications

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- Git

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set Up Supabase Database

Follow the database setup instructions in [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md#02-set-up-supabase-backend).

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Project Structure

```
livenotes-app/
├── src/
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # Reusable Vue components
│   ├── composables/     # Vue composables
│   ├── constants/       # Validation rules, messages, routes
│   ├── pages/           # Route pages/views
│   ├── router/          # Vue Router configuration
│   ├── stores/          # Pinia stores
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   ├── App.vue          # Root component
│   └── main.ts          # Entry point
├── supabase/
│   └── migrations/      # Database migration files
├── public/              # Static assets
└── ...config files
```

## Development Workflow

1. Follow the [Implementation Plan](./IMPLEMENTATION_PLAN.md) phase by phase
2. Reference the [UI Spec](../livenotes-documentation/app/v1-ui-spec.md) for design details
3. Reference the [Technical Spec](../livenotes-documentation/app/v1-technical-spec.md) for implementation details
4. Test manually using the [Testing Checklist](../livenotes-documentation/app/v1-technical-spec.md#manual-testing-checklist)
5. Commit frequently with clear messages

## Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Type check
npm run type-check

# Run tests (when implemented)
npm run test
```

## Supabase Commands

```bash
# Initialize Supabase locally
npx supabase init

# Start local Supabase
npx supabase start

# Create new migration
npx supabase migration new migration_name

# Reset local database (apply all migrations)
npx supabase db reset

# Push migrations to production
npx supabase db push

# Stop local Supabase
npx supabase stop
```

## Deployment

Deploy to Netlify or Vercel:

1. Connect your GitHub repository
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
4. Deploy

See [Deployment Checklist](../livenotes-documentation/app/v1-technical-spec.md#deployment-checklist) for details.

## Contributing

This is a personal project, but feedback and suggestions are welcome!

## Version Roadmap

- **V1** (Current): Song catalog & organization
- **V2** (Planned): SongCode editor & chord chart viewer
- **V3** (Planned): Collaboration features
- **V4+** (Ideas): Offline mode, version history, public sharing, etc.

See [Roadmap](../livenotes-documentation/app/roadmap.md) for details.

## License

[To be determined]

## Related Repositories

- [livenotes-documentation](../livenotes-documentation) - Complete specifications and planning
- [livenotes-sc-converter](../livenotes-sc-converter) - SongCode parser (used in V2+)

---

**Status**: In development  
**Last Updated**: March 30, 2026
