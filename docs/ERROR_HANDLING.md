# Error handling

One convention for `apps/web` (#47). Each layer has one job.

```
service ──throws──▶ store ──returns OperationResult──▶ screen / composable ──▶ executeOperation / showErrorToast
```

## Services (`src/services`, `src/lib/offline`)
- **Throw** on any failure: Supabase errors as they are (`if (error) throw error`), or an `Error` with a clear message.
- Return `null` **only for "not found"**, never for a failed request. Use `.maybeSingle()` for lookups that may find nothing; `.single()` turns "no row" into an error.
- Never show toasts or touch stores.
- A write the user can't make right now throws `EditNotAllowedError` (from `commitWrite`). Its message is already written for the user.

## Stores (`src/stores`)
- Every action that can fail catches, sets the store's `error` ref (when it has one), and **returns an `OperationResult`** (`utils/operations.ts`):
  - success: `{ success: true, data }`
  - failure: `return failure(err, 'Failed to …')`, which gives `{ success: false, error: <message>, cause: err }`
- Lookups (`get…ById`) return `null` when nothing is found or the read fails, and set `error`.
- Never throw to the caller, and never show toasts: a store doesn't know which screen called it.
- Exception: `editMode` is UI state about editing; it tells the user why an edit control is disabled (ADR-011), so it shows its own toasts.

## Screens and composables
- Run user actions through **`executeOperation`**: it shows the overlay and the success toast, and the error toast when the action throws *or* returns `{ success: false }`.
- When `executeOperation` doesn't fit (no overlay wanted, custom flow), either check `result.success` and call **`uiStore.showErrorToast(context, result.cause ?? result.error)`**, or, in `try/catch` code, unwrap with **`orThrow(await store.action())`** and call `showErrorToast(context, err)` in the `catch`.
- Never `await store.action()` inside `try/catch` without `orThrow`: a store result doesn't throw, so the failure would be reported as a success.
- Don't build error toasts by hand with `showToast(..., 'error')`.
- `showErrorToast` picks the wording, so it is the same on every screen:
  - `EditNotAllowedError`: its own message, as is (e.g. "Not saved: you are no longer editing this project").
  - Anything else: "Failed to <context>", with the error message as detail.

## Applying it
Stores and services follow this convention. Screens and composables that still build error toasts by hand are fixed when they are next touched (`docs/TECHNICAL_DEBT.md`, no big-bang refactor).
