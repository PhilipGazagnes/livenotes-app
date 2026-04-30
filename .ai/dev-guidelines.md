# Dev Guidelines

Welcome to the Livenotes App project! This document defines the standards we follow to keep the codebase clean, consistent, and enjoyable to work in. These aren't arbitrary rules — each one exists to save us time and reduce friction as the project grows. Please read it before contributing, and refer back to it when in doubt.

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Components](#components)
3. [Composables](#composables)
4. [TypeScript](#typescript)
5. [Performance](#performance)
6. [API & Data Fetching (Supabase)](#api--data-fetching-supabase)

---

## Core Principles

These four principles are the backbone of every decision in this codebase. When you're unsure how to approach something, come back here first.

### DRY — Don't Repeat Yourself

If you find yourself writing the same logic, markup, or query more than once, stop and extract it. Duplication is the root of many bugs: when something changes, it tends to get updated in one place but not another.

**Do:**
- Extract repeated logic into a composable
- Extract repeated markup into a component
- Extract repeated Supabase queries into a service function

**Don't:**
```ts
// ❌ Same fetch logic duplicated across two components
const { data } = await supabase.from('projects').select('*').eq('user_id', userId)
// ... repeated elsewhere
```

```ts
// ✅ Extracted once, used everywhere
const { projects } = useUserProjects(userId)
```

---

### KISS — Keep It Simple, Stupid

The simplest solution that works is almost always the right one. Resist the urge to over-engineer. Complex code is harder to read, harder to test, and harder to debug.

**Do:**
- Write code that a new contributor could understand within a few minutes
- Prefer flat logic over deeply nested conditions
- Split complex functions into smaller, named steps

**Don't:**
```ts
// ❌ Over-engineered for no benefit
const getLabel = (status: string) =>
  ({ active: 'Active', inactive: 'Inactive', pending: 'Pending' }[status] ?? 'Unknown')
  
// (fine here, but not when a simple if/switch reads better in context)
```

> If you feel the need to write a long comment explaining what your code does, consider rewriting the code instead.

---

### YAGNI — You Aren't Gonna Need It

Don't build features, abstractions, or configuration options for hypothetical future needs. Build what is required today, and refactor when the need actually arises.

**Do:**
- Implement only what the current ticket or feature requires
- Leave extension points out until there's a concrete reason for them

**Don't:**
```ts
// ❌ Premature abstraction "just in case"
function fetchData(source: 'supabase' | 'firebase' | 'rest' | 'graphql', ...) { ... }

// ✅ We only use Supabase — keep it focused
function fetchProjects() { ... }
```

> YAGNI and DRY are complementary, not contradictory. DRY removes duplication that *exists*. YAGNI prevents abstraction of duplication that *doesn't exist yet*.

---

## Components

### Single Responsibility

Each component should do one thing well. If you find yourself describing a component with "and", it probably needs to be split.

```
✅ UserAvatar.vue       — displays a user's avatar
✅ UserAvatarMenu.vue   — avatar + dropdown menu (composes the above)
❌ UserAvatarAndSettingsFormAndNotificationBadge.vue
```

### Naming

- **PascalCase** for component files and their usage in templates: `<UserCard />`
- Prefix with domain/context for clarity: `ProjectCard.vue`, `ProjectList.vue`, `ProjectEmptyState.vue`
- Base/generic UI components (no business logic) are prefixed with `Base`: `BaseButton.vue`, `BaseModal.vue`, `BaseInput.vue`

### Props

- Always define props with TypeScript using `defineProps<{...}>()`
- Provide defaults with `withDefaults` where appropriate
- Keep props minimal — don't pass entire objects when only one field is needed

```ts
// ✅
const props = withDefaults(defineProps<{
  label: string
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
}>(), {
  disabled: false,
  variant: 'primary'
})
```

### Emits

- Always declare emits explicitly with `defineEmits<{...}>()`
- Use descriptive, past-tense event names: `user-selected`, `form-submitted`, `modal-closed`

### Component Size

If a component exceeds ~250 lines (template + script combined), treat it as a signal to refactor. Extract sub-components or move logic into a composable.

---

## Composables

Composables are our primary tool for sharing logic across components. Use them liberally.

### When to create a composable

- Logic is used in more than one component
- Logic involves reactive state that belongs outside the template
- A component's `<script setup>` is getting long and hard to follow

### Naming

All composables are prefixed with `use` and placed in `src/composables/`:

```
src/composables/
  useAuth.ts
  useUserProjects.ts
  useToast.ts
```

### Structure

```ts
// ✅ Clear, focused, well-typed composable
export function useUserProjects(userId: Ref<string>) {
  const projects = ref<Project[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchProjects() {
    loading.value = true
    error.value = null
    try {
      const { data, error: sbError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId.value)

      if (sbError) throw sbError
      projects.value = data ?? []
    } catch (e) {
      error.value = 'Failed to load projects.'
    } finally {
      loading.value = false
    }
  }

  watchEffect(() => {
    if (userId.value) fetchProjects()
  })

  return { projects, loading, error, fetchProjects }
}
```

### Rules

- A composable should return only what its consumers need
- Avoid side effects outside of clearly named functions
- Don't couple composables to specific components — keep them generic and reusable

---

## TypeScript

TypeScript is a first-class citizen in this project. Using `any` is a code smell, not a shortcut.

### General rules

- Enable strict mode — it's already configured, don't work around it
- Always type function parameters and return values explicitly
- Prefer `interface` for object shapes, `type` for unions and utility types

### Shared types

Domain types live in `src/types/`. Keep them colocated with their domain:

```
src/types/
  project.ts
  user.ts
  common.ts
```

### Avoid `any`

```ts
// ❌
function handleResponse(data: any) { ... }

// ✅
function handleResponse(data: Project[]) { ... }
```

If you genuinely don't know the type (e.g. from an external source), use `unknown` and narrow it explicitly.

### Supabase types

Generate and use Supabase's typed client. Keep the generated types file at `src/types/supabase.ts` and regenerate it when the schema changes:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

---

## Performance

Performance is a feature. These guidelines help us avoid common pitfalls in Vue 3 apps.

### Reactivity

- Don't make large objects fully reactive when only a subset of fields change — use `shallowRef` where appropriate
- Avoid watching deeply nested objects unnecessarily; prefer computed properties to derive values
- Use `v-memo` on expensive list items that rarely change

### Computed over methods in templates

```html
<!-- ❌ Re-evaluated on every render -->
<p>{{ formatDate(user.createdAt) }}</p>

<!-- ✅ Cached until dependency changes -->
<p>{{ formattedCreatedAt }}</p>
```

```ts
const formattedCreatedAt = computed(() => formatDate(user.value.createdAt))
```

### Lazy loading

- Use `defineAsyncComponent` for heavy components that aren't needed on initial load
- Use route-level lazy loading for all pages (already default in most Vite/Vue Router setups)

```ts
const HeavyChart = defineAsyncComponent(() => import('./components/HeavyChart.vue'))
```

### `v-for` keys

Always use stable, unique keys on `v-for`. Never use the loop index as a key when the list can be reordered or filtered.

```html
<!-- ❌ -->
<ProjectCard v-for="(p, i) in projects" :key="i" />

<!-- ✅ -->
<ProjectCard v-for="p in projects" :key="p.id" />
```

---

## API & Data Fetching (Supabase)

All Supabase interactions are centralized and typed. No raw Supabase calls inside components.

### Service layer

Supabase queries live in `src/services/`, organized by domain:

```
src/services/
  projectService.ts
  userService.ts
```

Components and composables call service functions — never the Supabase client directly.

```ts
// src/services/projectService.ts
import { supabase } from '@/lib/supabase'
import type { Project } from '@/types/project'

export async function getUserProjects(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error
  return data ?? []
}
```

### Error handling

- Always handle both the `data` and `error` return values from Supabase
- Never silently swallow errors — at minimum, log them; ideally surface them to the user via a toast or error state
- Expose `loading`, `error`, and `data` states consistently from composables (see composable example above)

### Avoid over-fetching

- Select only the columns you need: `.select('id, name, status')` instead of `.select('*')` when the full row isn't required
- Use Supabase's filtering, ordering, and pagination server-side — don't fetch everything and filter in JavaScript

```ts
// ❌ Over-fetching
const { data } = await supabase.from('projects').select('*')
const active = data?.filter(p => p.status === 'active')

// ✅ Let the database do the work
const { data } = await supabase
  .from('projects')
  .select('id, name, status')
  .eq('status', 'active')
```

### Realtime

If using Supabase Realtime subscriptions, always unsubscribe on component unmount using `onUnmounted`:

```ts
onUnmounted(() => {
  supabase.removeChannel(channel)
})
```

---

*Last updated: April 2026 — keep this document alive. If a guideline feels wrong or outdated, open a discussion rather than ignoring it.*
