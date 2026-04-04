# web/ — React Frontend

Package: `@tailoredin/web`

React 19 SPA with file-based routing, TanStack Query for server state, and shadcn/ui components.

**Only imports from `@tailoredin/api/client`** — never import domain or application packages directly.

## Key files

| File | Purpose |
|---|---|
| `src/main.tsx` | App entry point |
| `src/routeTree.gen.ts` | **Auto-generated** — never edit manually |
| `src/lib/api.ts` | Eden Treaty client setup |
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
export function useExperiences(profileId: string) {
  return useQuery({
    queryKey: queryKeys.experiences.list(profileId),
    queryFn: () => api.experiences.get({ query: { profileId } }).then(unwrap),
  });
}
```

- All query keys live in `src/lib/query-keys.ts` — add new keys there when adding new endpoints
- Import the API client from `src/lib/api.ts`, not directly from `@tailoredin/api`

## API client

```typescript
// src/lib/api.ts
import { edenTreaty } from '@elysiajs/eden';
import type { App } from '@tailoredin/api/client';

export const api = edenTreaty<App>('/api');
```

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

To add a new shadcn component: `bunx shadcn@latest add <component>` from the `web/` directory.

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

## Design System

All UI must follow `docs/superpowers/specs/2026-03-30-web-frontend-design-system.md`. Key rules:
- **No bold (700) or semibold (600)** — max weight is `font-medium` (500)
- **No hardcoded colors** — use design tokens (`primary`, `accent`, `muted`, etc.)
- **No shadows on cards/inputs** — use borders only
- **Inline editing pattern** — each data field edits in-place (pencil icon on hover → field transforms to input). No global Edit buttons or full-page mode swaps.
- **Typography scale**: h1=22px/medium, h2=18px/medium, h3=15px/medium, body=14px/regular

## Domain Model as Source of Truth

`domain/DOMAIN.mmd` defines all entities, fields, and relationships. The UI must reflect this model:
- Entity fields shown in the UI must match the domain model exactly
- Adding or removing fields in the UI requires verifying against `DOMAIN.mmd` first
- When building forms or display components, consult `DOMAIN.mmd` for the canonical field list
