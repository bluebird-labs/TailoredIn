# apps/web/ — React Frontend

Package: `@tailoredin/web`

React 19 SPA with file-based routing, TanStack Query for server state, and shadcn/ui components.

**Does not depend on `@tailoredin/api`** — the web layer uses a standalone fetch-based API client.

## Key files

| File | Purpose |
|---|---|
| `src/main.tsx` | App entry point |
| `src/routeTree.gen.ts` | **Auto-generated** — never edit manually |
| `src/lib/api.ts` | Typed fetch API client with auth header injection and `ApiError` class |
| `src/lib/query-keys.ts` | Centralized TanStack Query keys |

## File-based routing

Routes are files in `src/routes/`. TanStack Router Vite plugin auto-generates `routeTree.gen.ts` — this file is never edited by hand.

Adding a route:
1. Create `src/routes/<path>.tsx` (e.g., `src/routes/experiences/$experienceId.tsx` for `/experiences/:experienceId`)
2. Export a `Route` created with `createFileRoute('/<path>')`
3. The route tree regenerates automatically on next dev server start

## Data fetching pattern

All server state goes through TanStack Query. Encapsulate calls in custom hooks:

```typescript
// src/hooks/use-experiences.ts
export function useExperiences() {
  return useQuery({
    queryKey: queryKeys.experiences.list(),
    queryFn: () => api.get<Experience[]>('/experiences'),
  });
}
```

- All query keys live in `src/lib/query-keys.ts` — add new keys there when adding new endpoints
- Import the API client from `src/lib/api.ts`

## API client

```typescript
// src/lib/api.ts — typed fetch wrapper
export const api = {
  get: <T>(path: string, query?) => request<T>('GET', path, { query }),
  post: <T>(path: string, body?) => request<T>('POST', path, { body }),
  put: <T>(path: string, body?) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body?) => request<T>('PATCH', path, { body }),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
  postRaw: (path, body?) => requestRaw('POST', path, { body }),
  getRaw: (path) => requestRaw('GET', path),
  postFormData: <T>(path, formData) => requestFormData<T>('POST', path, formData),
};
```

The client automatically injects the JWT `Authorization` header and unwraps the `{ data }` response envelope. For binary responses (PDF), use `postRaw`/`getRaw` which return the raw `Response`.

The `/api` prefix is proxied to the API server (port 8000) by Vite in dev, and should be proxied by a reverse proxy in production. Configure port via `API_PORT` env var.

## Component organization

```
src/components/
├── ui/           ← shadcn/ui primitives (exempt from Biome naming rules)
├── layout/       ← App shell, sidebar
├── companies/    ← Company classification UI
├── resume/
│   ├── education/
│   └── experience/
└── shared/       ← Generic dialogs, sortable lists
```

Feature-based, not type-based — keep components close to the feature they serve.

## shadcn/ui

Components live in `src/components/ui/`. They are exempt from Biome's `useNamingConvention` rule (they use kebab-case filenames by convention).

To add a new shadcn component: `pnpm exec shadcn@latest add <component>` from the `web/` directory.

## Query key structure

Keys are hierarchical in `query-keys.ts`. Always follow the existing pattern when adding:

```typescript
export const queryKeys = {
  experiences: {
    all: ['experiences'] as const,
    list: (profileId: string) => ['experiences', 'list', profileId] as const,
    detail: (id: string) => ['experiences', id] as const,
  },
  // ...
};
```

Invalidate at the right level of specificity:
- `queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all })` — invalidates all experience queries
- `queryClient.invalidateQueries({ queryKey: queryKeys.experiences.detail(id) })` — single experience only

## Design System & UX Guidelines

All UI must follow the design docs in `web/design/`:
- **`design-system.md`** — color tokens, typography, layout, component styling
- **`ux-guidelines.md`** — behavioral UX patterns: forms, loading states, feedback, navigation guards

Key visual rules:
- **No bold (700) or semibold (600)** — max weight is `font-medium` (500)
- **No hardcoded colors** — use design tokens (`primary`, `accent`, `muted`, etc.)
- **No shadows on cards/inputs** — use borders only
- **Content-first click-to-edit** — data displays as plain text, click to enter edit mode
- **Inline save/discard per section** — each editing section has its own Save/Discard buttons
- **One section editable at a time** — mutual exclusion via `EditableSectionProvider`
- **Typography scale**: h1=22px/medium, h2=18px/medium, h3=15px/medium, body=14px/regular

## Domain Model as Source of Truth

`libs/domain/DOMAIN.mmd` defines all entities, fields, and relationships. The UI must reflect this model:
- Entity fields shown in the UI must match the domain model exactly
- Adding or removing fields in the UI requires verifying against `libs/domain/DOMAIN.mmd` first
- When building forms or display components, consult `libs/domain/DOMAIN.mmd` for the canonical field list
