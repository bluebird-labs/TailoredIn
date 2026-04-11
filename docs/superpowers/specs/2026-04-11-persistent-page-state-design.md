# Persistent Page State Design

## Context

When navigating between pages via the sidebar, all page state is lost — the user must re-select their job in the Atelier, re-type search filters in lists, etc. The sidebar links point to bare paths (`/atelier`, `/jobs`) without search params, so URL-persisted state gets wiped on every sidebar click.

**Goal:** Every page should restore to its last-known state when the user returns, even across browser sessions. URL search params remain the source of truth when present; localStorage acts as the persistence layer that feeds params back in when navigating via sidebar.

## Design

### Two-layer persistence: URL params + localStorage

1. **URL search params** — source of truth. Shareable, bookmarkable, survive refresh.
2. **localStorage** — durable backing store. Fills in search params when navigating without them (sidebar clicks, typing the bare URL).

### Mechanism: TanStack Router search middleware

Each route that needs persistence gets:

1. A **`validateSearch`** function (some already have this).
2. A **custom search middleware** that reads from localStorage when params are missing.
3. A **`useSearchPersistence`** hook call in the component that writes current params to localStorage.
4. The built-in **`retainSearchParams`** middleware to prevent accidental param loss during in-route navigation.

### Scroll restoration

TanStack Router's built-in scroll restoration (`scrollRestoration: true` on the router) handles scroll position automatically — no custom code needed.

## New utility: `web/src/lib/persisted-search.ts`

### `persistSearchParams<T>(routePath, keys)` — middleware factory

```typescript
type SearchMiddleware<T> = (ctx: { search: T; next: (s: T) => T }) => T;

function persistSearchParams<T extends Record<string, unknown>>(
  routePath: string,
  keys: (keyof T & string)[]
): SearchMiddleware<T> {
  return ({ search, next }) => {
    const result = next(search);
    const stored = getStoredSearch<T>(routePath);
    if (!stored) return result;

    // Fill in missing params from localStorage — URL params always win
    const merged = { ...result };
    for (const key of keys) {
      if (merged[key] === undefined && stored[key] !== undefined) {
        merged[key] = stored[key] as T[typeof key];
      }
    }
    return merged;
  };
}
```

### `useSearchPersistence<T>(routePath, search, keys)` — sync hook

```typescript
function useSearchPersistence<T extends Record<string, unknown>>(
  routePath: string,
  search: T,
  keys: (keyof T & string)[]
): void {
  useEffect(() => {
    const toStore: Record<string, unknown> = {};
    let hasValues = false;
    for (const key of keys) {
      if (search[key] !== undefined) {
        toStore[key] = search[key];
        hasValues = true;
      }
    }
    if (hasValues) {
      setStoredSearch(routePath, toStore);
    }
  }, [routePath, search, ...keys]);
}
```

### localStorage helpers

- Key format: `tailoredin-search:<routePath>` (e.g. `tailoredin-search:/atelier`)
- Values stored as JSON
- Read/write wrapped in try-catch (storage may be unavailable)

## Per-route changes

### `/atelier` — persist `job` selection

**File:** `web/src/routes/atelier.tsx`

- Already has `validateSearch` with `job?: string`
- **Add:** `search.middlewares` with `persistSearchParams('/atelier', ['job'])` + `retainSearchParams(['job'])`
- **Add:** `useSearchPersistence('/atelier', search, ['job'])` in component

### `/profile` — persist `tab` selection

**File:** `web/src/routes/profile/index.tsx`

- Already has `validateSearch` with `tab?: ProfileTab`
- **Add:** `search.middlewares` with `persistSearchParams('/profile', ['tab'])` + `retainSearchParams(['tab'])`
- **Add:** `useSearchPersistence('/profile', search, ['tab'])` in component

### `/jobs` — add and persist `search` filter

**File:** `web/src/routes/jobs/index.tsx`

- Currently has NO search params. Filter is local `useState`.
- **Add:** `validateSearch` with `search?: string`
- **Add:** `search.middlewares` with `persistSearchParams('/jobs', ['search'])` + `retainSearchParams(['search'])`
- **Modify:** `JobDescriptionList` component to read filter from `Route.useSearch()` instead of local state, update via `navigate({ search: { search: value }, replace: true })`
- **Add:** `useSearchPersistence('/jobs', search, ['search'])` in component

### `/companies` — add and persist `search` filter

**File:** `web/src/routes/companies/index.tsx`

- Same pattern as `/jobs`.
- **Add:** `validateSearch` with `search?: string`
- **Add:** `search.middlewares` with `persistSearchParams('/companies', ['search'])` + `retainSearchParams(['search'])`
- **Modify:** `CompanyList` component to use URL search params instead of local state
- **Add:** `useSearchPersistence('/companies', search, ['search'])` in component

### Router config — enable scroll restoration

**File:** `web/src/main.tsx`

- **Add:** `scrollRestoration: true` to `createRouter()` options

## What is NOT persisted

| State | Reason |
|---|---|
| Settings form inputs | Has dirty tracking + save/discard + nav guard — correct pattern for forms |
| Modal open/close | Transient UI state — modals should start closed |
| Atelier additional prompt text | Ephemeral per-generation input — intentionally not persisted |
| Atelier session overrides | Ephemeral adjustments — reset on job change by design |

## Staleness handling

If localStorage references data that no longer exists (e.g. a deleted job ID):
- The component's query returns null/error → existing UI handles this (shows empty state or "not found")
- No special staleness-detection code needed — the app already handles missing data gracefully

## Verification

1. **Atelier job persistence:** Select a job → navigate to Jobs via sidebar → click Atelier in sidebar → job should still be selected. Refresh the page → still selected.
2. **Profile tab persistence:** Click "Education" tab → navigate away → come back → Education tab still active.
3. **Jobs search persistence:** Type a filter → navigate to Companies → come back to Jobs → filter text restored, list filtered.
4. **Companies search persistence:** Same as Jobs.
5. **Scroll restoration:** Scroll down a long list → navigate away → come back → scroll position restored.
6. **URL params override localStorage:** Navigate to `/atelier?job=<different-id>` → that job loads, not the localStorage one.
7. **Staleness:** Delete a job that's stored in localStorage → navigate to Atelier → no crash, shows empty/selector state.
8. **Quality gates:** `bun run typecheck`, `bun run check`, `bun run test`, `bun e2e:test` all pass.
