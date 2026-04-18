# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Rules

**ALWAYS DISPLAY FULL PATHS. NEVER USE RELATIVE OR ABBREVIATED PATHS — EVERY FILE PATH SHOWN TO THE USER MUST BE THE COMPLETE, ABSOLUTE PATH.**

## Architecture: DDD / Onion Architecture

pnpm + Turborepo monorepo — **TailoredIn** — structured as four Onion Architecture layers plus a cross-cutting `core/` package.

```
libs/
  core/            ← Cross-cutting pure utilities (no domain, no framework deps)
  domain/          ← Single package: aggregates, value objects, domain services
  application/     ← Single package: use cases + ports + DTOs (@Injectable, no framework beyond DI)
  infrastructure/  ← Single package: ORM entities, repository impls, external service adapters, DI tokens
apps/
  api/             ← NestJS HTTP server + module composition root
  web/             ← React 19 SPA (consumes api/ via generated OpenAPI client)
  e2e/             ← Playwright end-to-end tests
```

**Dependency rule (inward only):**
```
web → api → infrastructure → application → domain → (core)
```

### Layer Details

| Layer | Package | Purpose | Details |
|---|---|---|---|
| `libs/core/` | `@tailoredin/core` | Shared TypeScript utilities (EnumUtil, TimeUtil, ColorUtil, Environment, etc.) | [libs/core/CLAUDE.md](libs/core/CLAUDE.md) |
| `libs/domain/` | `@tailoredin/domain` | Aggregates, value objects, domain services | [libs/domain/CLAUDE.md](libs/domain/CLAUDE.md) |
| `libs/application/` | `@tailoredin/application` | Use cases, ports, DTOs | [libs/application/CLAUDE.md](libs/application/CLAUDE.md) |
| `libs/infrastructure/` | `@tailoredin/infrastructure` | MikroORM entities + repositories, PostgreSQL migrations, DI tokens | [libs/infrastructure/CLAUDE.md](libs/infrastructure/CLAUDE.md) |
| `apps/api/` | `@tailoredin/api` | NestJS HTTP controllers + module composition root | [apps/api/CLAUDE.md](apps/api/CLAUDE.md) |
| `apps/web/` | `@tailoredin/web` | React 19 + Vite + TanStack Router/Query + shadcn/ui frontend | [apps/web/CLAUDE.md](apps/web/CLAUDE.md) |
| `apps/e2e/` | `@tailoredin/e2e` | Playwright end-to-end tests | [apps/e2e/CLAUDE.md](apps/e2e/CLAUDE.md) |

## Commands

All commands are run from the repo root using `pnpm run` or `turbo run`.

### dev: commands (any branch)

```bash
pnpm dev:up                  # start everything: install, Docker, migrate, seed, API + web servers
pnpm dev:up -- --profile production  # start with production config (no Docker)
pnpm dev:down                # stop servers + Docker (preserves volume)
pnpm dev:down -- --clean     # stop servers + Docker + remove volume
pnpm dev:fresh               # restart everything (down --clean + up)
pnpm dev:migration:create    # create a new migration
pnpm dev:migration:up        # run pending migrations
pnpm dev:seed                # seed the database
pnpm dev:set-password        # set password for an account (creates if needed)
pnpm dev:diagram             # regenerate libs/infrastructure/DATABASE.mmd (needs DB running)
```

`dev:up` auto-detects the current branch and allocates deterministic ports (DB, API, Web) via branch-name hashing. On `main`, ports are 5432/8000/5173. On feature branches, ports are offset to avoid collisions. State is stored in `.dev-state.json`.

### e2e: commands (anywhere)

```bash
pnpm e2e:test                # Playwright E2E tests (headless, Testcontainers)
pnpm e2e:test:ui             # Playwright test UI
pnpm e2e:test:headed         # Playwright with visible browser
```

### Quality checks

```bash
pnpm run typecheck           # type-check all packages (via Turborepo)
pnpm run check               # Biome lint + format check
pnpm run check:fix           # Biome lint + format with auto-fix
pnpm run dep:check           # dependency-cruiser architecture boundary enforcement
pnpm run knip                # dead code / unused export detection
```

### Testing

```bash
pnpm run test                          # unit tests across all workspaces (via Turborepo)
pnpm run test:coverage                 # unit tests with coverage report
pnpm --filter @tailoredin/infrastructure run test:integration  # integration tests (Testcontainers, real Postgres, 60s timeout)
```

### Diagrams

```bash
pnpm run domain:diagram      # regenerate libs/domain/DOMAIN.mmd
pnpm run app:diagram         # regenerate libs/application/APPLICATION.mmd
pnpm run db:diagram          # regenerate libs/infrastructure/DATABASE.mmd (needs DB running)
pnpm run diags               # regenerate all three diagrams in parallel (via Turborepo)
```

### Storybook

```bash
pnpm run web:storybook       # launch Storybook dev server
pnpm run web:storybook:build # build static Storybook
```

### Dev servers (for manual use — prefer `dev:up`)

```bash
pnpm run dev                 # API + web dev servers in parallel (skip Docker/migrations/seeds)
pnpm run api:dev             # API server with --watch
pnpm run web:dev             # Vite dev server
```

TypeScript is executed via `tsx` (TypeScript Execute). `typecheck` scripts exist only to surface type errors.

**Test runner**: Jest (unit + integration). Integration tests in `libs/infrastructure/test-integration/` use Testcontainers (real Postgres, 60 s timeout). E2E tests in `apps/e2e/` use `@playwright/test`.

### Testing Strategy by Layer

| Layer | Unit | Integration | E2E |
|---|---|---|---|
| `libs/core/`, `libs/domain/` | Yes | — | — |
| `libs/application/` | Yes (mock ports) | — | — |
| `libs/infrastructure/` | Yes | Yes (Testcontainers) | — |
| `apps/api/` | — | — | Yes |
| `apps/web/` | — | — | Yes |

## Session Hygiene

### Docs must be committed
Any files created or modified under `docs/` (specs, design docs, plans) must be included in commits — never leave them as untracked. Specs and design documents live in `docs/superpowers/specs/` and `docs/superpowers/plans/`.

### Unstaged files
Before ending a session, run `git status`. If there are unstaged or untracked files, ask the user what to do with each (commit, stash, or discard). Never leave files dangling silently.

### Destructive migrations
**Never run `dev:migration:up` without asking first.** When asking, read the migration file and explicitly state whether it includes data deletion (DROP TABLE, DROP COLUMN, DELETE, TRUNCATE). Show the destructive SQL if present.

### Session-end checklist
1. `pnpm run diags` — regenerate all diagrams
2. Commit any diagram changes
3. `git status` — resolve any remaining unstaged/untracked files with the user

## Diagrams — Read Before Modifying

| Diagram | Covers | Regenerate |
|---|---|---|
| `libs/domain/DOMAIN.mmd` | Aggregates, entities, value objects, enums, relationships | `pnpm run domain:diagram` |
| `libs/application/APPLICATION.mmd` | Use cases, ports, DTOs, orchestration flows | `pnpm run app:diagram` |
| `libs/infrastructure/DATABASE.mmd` | Database tables, columns, indexes, FK relationships | `pnpm run db:diagram` |

**Before modifying any layer, read its diagram to understand current state.** These are auto-generated from code — regenerate after changes and commit the result.

## Conventions

See **`CONVENTIONS.md`** for detailed coding standards: OOP-first design, DI patterns, naming conventions, API response envelope format, pagination/sorting/filtering, and error handling. This is the primary reference for code style decisions.

## Key Design Decisions

- **NestJS DI throughout**: Use cases in `libs/application/` have `@Injectable()` + `@Inject(DI.X.Y)`. Infrastructure services use `@Injectable()`. NestJS modules wire everything.
- **Zod validation**: Request DTOs use `createZodDto()` from `nestjs-zod`. Global `ZodValidationPipe` returns 422 on validation failures. No class-validator.
- **Merged domain + ORM entities**: Domain entities in `libs/domain/src/entities/` carry MikroORM decorators directly. There is no separate ORM entity layer. Repositories are thin wrappers around `EntityManager` (persist + flush).
- **Plain string IDs**: All entity IDs are plain `string` UUIDs (`public readonly id!: string`). There are no `<Entity>Id` value objects — IDs were simplified to plain strings. Use `crypto.randomUUID()` in factories.
- **DI tokens & wiring**: see [libs/infrastructure/CLAUDE.md](libs/infrastructure/CLAUDE.md) for the full workflow of adding new services.
- **Profile-based environment**: `dev:up` uses `--profile local|production`. Local profile auto-generates `.env.local` with branch-specific ports. Production reads `.env.production`.

## Entry Points

- `apps/api/src/main.ts` — NestJS bootstrap (starts Express server)
- `apps/web/src/main.tsx` — React SPA entry point
- PostgreSQL via MikroORM — see [libs/infrastructure/CLAUDE.md](libs/infrastructure/CLAUDE.md) for database conventions

## Frontend Route Structure

The web app uses file-based routing (TanStack Router). Key routes:

- `/` → redirects to `/jobs`
- `/profile` — Profile page with **tabbed layout**: Profile, Experiences, Education tabs
- `/experiences/$experienceId` — Experience detail page (no index route — list is in Profile tab)
- `/rack` — Application tracking board
- `/jobs` — Job descriptions list
- `/jobs/$jobDescriptionId` — Job detail
- `/companies` — Companies list
- `/companies/$companyId` — Company detail
- `/atelier` — Resume generation workspace
- `/settings` — Generation settings

Sidebar groups: **Workroom** (Profile, Atelier, Settings) and **Pipeline** (Rack, Jobs, Companies).

### Data import & skills commands

```bash
pnpm skills:sync             # sync skills from all imported sources
pnpm skills:reset            # reset skills data and re-import
pnpm esco:import             # import ESCO skills taxonomy
pnpm linguist:import         # import GitHub Linguist language data
pnpm mind:import             # import MIND dataset
pnpm tanova:import           # import Tanova dataset
```

All import commands load environment from `.env.local` and read source data from `.local/`.

## Environment Variables

Environment is profile-based. `dev:up` generates `.env.local` automatically for the `local` profile.

**`.env.local`** (auto-generated, gitignored):
```
APP_PROFILE, NODE_ENV
POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_SCHEMA
TZ, API_PORT, CLAUDE_API_KEY, JWT_SECRET, JWT_EXPIRES_IN_SECONDS
```

**`.env.production`** (manual, gitignored) — used with `--profile production`.

`NODE_ENV=test` is set in `.env.test` (loaded automatically by Jest, overriding `.env.local`). Production deployments override at the platform level.

See `.env.example` and `.env.production.example` for templates.

## Tooling Notes

- **pnpm + Turborepo** manages the monorepo. `pnpm` for dependency management, `turbo` for parallel task execution with caching.
- **tsx** executes TypeScript directly (scripts, dev servers).
- **Biome 2.x** handles all linting and formatting (replaces ESLint + Prettier). Config at root `biome.json`. Line width is **120 characters**.
- **Knip** detects dead code, unused exports, and unused dependencies. Config at `knip.json`. Run `pnpm run knip`.
- **dependency-cruiser** enforces Onion Architecture boundaries. Run `pnpm run dep:check`. Config at `.dependency-cruiser.cjs`.
- **mise** manages Node and pnpm versions (pinned in `.mise.toml`). Run `mise install` after cloning.
- See **`CONVENTIONS.md`** for file naming and import conventions (`.js` extensions, barrel imports, `import type`).

## CI Pipeline

GitHub Actions (`.github/workflows/ci.yaml`) runs on push to `main` and PRs. Path-filtered jobs:

| Job | Command | Notes |
|---|---|---|
| Lint & Format | `pnpm run check` | |
| Typecheck | `pnpm run typecheck` | |
| Test & Coverage | `pnpm run test:coverage` | |
| Integration Tests | `pnpm --filter @tailoredin/infrastructure run test:integration` | Installs Typst |
| Dead Code | `pnpm run knip` | |
| Dependency Boundaries | `pnpm run dep:check` | |
| E2E Tests | `pnpm run e2e:test` | Installs Typst + Playwright Chromium |
| Secret Scanning | gitleaks | Always runs |

**Typst** is required for integration and E2E tests (resume PDF generation). CI installs it via `typst-community/setup-typst@v4`. Locally, install via `mise` or your OS package manager.

## Design System

Before writing or modifying frontend code, read these specs:

- **[apps/web/design/design-system.md](apps/web/design/design-system.md)** — OKLch color tokens, typography scale, component styling rules (borders not shadows, no bold/semibold text)
- **[apps/web/design/ux-guidelines.md](apps/web/design/ux-guidelines.md)** — click-to-edit interaction pattern, mutual exclusion of editable sections, validation timing, modal vs inline editing rules
