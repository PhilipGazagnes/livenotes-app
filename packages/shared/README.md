# @livenotes/shared

Framework-agnostic TypeScript shared by the Livenotes apps (web today, mobile later).
No Vue, no DOM-only APIs outside clearly isolated adapters.

- `src/types/`: domain types and generated Supabase types (`supabase.ts`)

Consumed as TypeScript source (no build step); the apps' bundlers compile it.

Regenerate Supabase types:

```bash
npx supabase gen types typescript --project-id <id> > packages/shared/src/types/supabase.ts
```
