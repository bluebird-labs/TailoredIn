# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Rules

**ALWAYS DISPLAY FULL PATHS. NEVER USE RELATIVE OR ABBREVIATED PATHS — EVERY FILE PATH SHOWN TO THE USER MUST BE THE COMPLETE, ABSOLUTE PATH.**

## Architecture: DDD / Onion Architecture

Bun monorepo — **TailoredIn** — structured as four Onion Architecture layers plus a cross-cutting `core/` package.

```
core/            ← Cross-cutting pure utilities (no domain, no framework deps)
domain/          ← Single package: aggregates, value objects, domain services
application/     ← Single package: use cases + ports + DTOs (plain classes, no DI framework)
infrastructure/  ← Single package: ORM entities, repository impls, external service adapters, DI tokens
api/             ← Elysia HTTP server + DI composition root
web/             ← React 19 SPA (consumes api/ types via Eden Treaty)
e2e/             ← Playwright end-to-end tests
```

**Dependency rule (inward only):**
```
web → api → infrastructure → application → domain → (core)
```

### Layer Details

| Layer | Package | Purpose | Details |
|---|---|---|---|
| `core/` | `@tailoredin/core` | Shared TypeScript utilities (EnumUtil, TimeUtil, ColorUtil, Environment, etc.) | [core/CLAUDE.md](core/CLAUDE.md) |
| `domain/` | `@tailoredin/domain` | Aggregates, value objects, domain services | [domain/CLAUDE.md](domain/CLAUDE.md) |
| `application/` | `@tailoredin/application` | Use cases, ports, DTOs | [application/CLAUDE.md](application/CLAUDE.md) |
| `infrastructure/` | `@tailoredin/infrastructure` | MikroORM entities + repositories, PostgreSQL migrations, DI tokens | [infrastructure/CLAUDE.md](infrastructure/CLAUDE.md) |
| `api/` | `@tailoredin/api` | Elysia HTTP routes + DI composition root | [api/CLAUDE.md](api/CLAUDE.md) |
| `web/` | `@tailoredin/web` | React 19 + Vite + TanStack Router/Query + shadcn/ui frontend | [web/CLAUDE.md](web/CLAUDE.md) |
| `e2e/` | `@tailoredin/e2e` | Playwright end-to-end tests | [e2e/CLAUDE.md](e2e/CLAUDE.md) |

## Commands

All commands are run from the repo root. Commands are scoped by context:

- **`dev:*`** — main branch only (reads `.env`, guarded)
- **`wt:*`** — worktree only (uses `.wt-session.json`, no `.env`)
- **`e2e:*`** — runs anywhere (Testcontainers, fully ephemeral)
- **Context-free** — `check`, `typecheck`, `test`, etc.

### dev: commands (main branch only)

```bash
bun dev:up                 # start everything: install, Docker, migrate, seed, API + web servers
bun dev:down               # stop servers + Docker (preserves volume)
bun dev:fresh              # restart everything (down + up)
bun dev:migration:create   # create a new migration
bun dev:migration:up       # run pending migrations
bun dev:seed               # seed the database
bun dev:set-password       # set password for an account (creates if needed)
bun dev:diagram            # regenerate infrastructure/DATABASE.mmd (needs DB running)
```

### wt: commands (worktree only)

```bash
bun wt:up                  # start isolated env: allocate ports, Docker, migrate, seed, servers
bun wt:down                # stop servers + Docker + remove volume + delete session
bun wt:fresh               # restart everything (down + up)
bun wt:migration:up        # run pending migrations in worktree DB
bun wt:seed                # seed the worktree database
bun wt:set-password        # set password for an account (creates if needed)
```

### e2e: commands (anywhere)

```bash
bun e2e:test               # Playwright E2E tests (headless, Testcontainers)
bun e2e:test:ui            # Playwright test UI
bun e2e:test:headed        # Playwright with visible browser
```

### Quality checks

```bash
bun run typecheck          # type-check all packages
bun run check              # Biome lint + format check
bun run check:fix          # Biome lint + format with auto-fix
bun run dep:check          # dependency-cruiser architecture boundary enforcement
bun run knip               # dead code / unused export detection
```

### Testing

```bash
bun run test                 # unit tests across all workspaces
bun run test:coverage        # unit tests with coverage report
bun run --cwd infrastructure test:integration  # integration tests (Testcontainers, real Postgres, 60s timeout)
bun test <path/to/test.ts>   # run a single test file
```

### Diagrams

```bash
bun run domain:diagram       # regenerate domain/DOMAIN.mmd
bun run app:diagram          # regenerate application/APPLICATION.mmd
bun run db:diagram           # regenerate infrastructure/DATABASE.mmd (needs DB running)
bun run diags                # regenerate all three diagrams in parallel
bun dev:diagram              # same as db:diagram but guarded to main branch only
```

### Storybook

```bash
bun run web:storybook        # launch Storybook dev server
bun run web:storybook:build  # build static Storybook
```

### Dev servers (for manual use — prefer `dev:up` / `wt:up`)

```bash
bun run dev            # API + web dev servers in parallel (skip Docker/migrations/seeds)
bun run api:dev        # API server with --watch
bun run web:dev        # Vite dev server
```

All TypeScript is executed directly by Bun (no compilation step). `typecheck` scripts exist only to surface type errors.

**Test runners**: `bun:test` (unit + integration). Integration tests in `infrastructure/test-integration/` use Testcontainers (real Postgres, 60 s timeout). E2E tests in `e2e/` use `@playwright/test`.

### Testing Strategy by Layer

| Layer | Unit | Integration | E2E |
|---|---|---|---|
| `core/`, `domain/` | Yes | — | — |
| `application/` | Yes (mock ports) | — | — |
| `infrastructure/` | Yes | Yes (Testcontainers) | — |
| `api/` | — | — | Yes |
| `web/` | — | — | Yes |

## Session Hygiene

### Docs must be committed
Any files created or modified under `docs/` (specs, design docs, plans) must be included in commits — never leave them as untracked. Specs and design documents live in `docs/superpowers/specs/` and `docs/superpowers/plans/`.

### Unstaged files
Before ending a session, run `git status`. If there are unstaged or untracked files, ask the user what to do with each (commit, stash, or discard). Never leave files dangling silently.

### Destructive migrations
**Never run `db:migration:up` without asking first.** When asking, read the migration file and explicitly state whether it includes data deletion (DROP TABLE, DROP COLUMN, DELETE, TRUNCATE). Show the destructive SQL if present.

### Session-end checklist
1. `bun run diags` — regenerate all diagrams
2. Commit any diagram changes
3. `git status` — resolve any remaining unstaged/untracked files with the user

## Diagrams — Read Before Modifying

| Diagram | Covers | Regenerate |
|---|---|---|
| `domain/DOMAIN.mmd` | Aggregates, entities, value objects, enums, relationships | `bun run domain:diagram` |
| `application/APPLICATION.mmd` | Use cases, ports, DTOs, orchestration flows | `bun run app:diagram` |
| `infrastructure/DATABASE.mmd` | Database tables, columns, indexes, FK relationships | `bun run db:diagram` |

**Before modifying any layer, read its diagram to understand current state.** These are auto-generated from code — regenerate after changes and commit the result.

## Conventions

See **`CONVENTIONS.md`** for detailed coding standards: OOP-first design, DI patterns, naming conventions, API response envelope format, pagination/sorting/filtering, and error handling. This is the primary reference for code style decisions.

## Key Design Decisions

- **Plain application layer**: use cases are plain TypeScript classes — no `@injectable()`, no `inject()`. The DI framework (`@needle-di/core`) is only used in `infrastructure/` and the composition root (`api/`).
- **Merged domain + ORM entities**: Domain entities in `domain/src/entities/` carry MikroORM decorators directly. There is no separate ORM entity layer. Repositories are thin wrappers around `EntityManager` (persist + flush).
- **Plain string IDs**: All entity IDs are plain `string` UUIDs (`public readonly id!: string`). There are no `<Entity>Id` value objects — IDs were simplified to plain strings. Use `crypto.randomUUID()` in factories.
- **DI tokens & wiring**: see [infrastructure/CLAUDE.md](infrastructure/CLAUDE.md) for the full workflow of adding new services.

## Entry Points

- `api/src/index.ts` — starts Elysia server on port 8000
- `web/src/main.tsx` — React SPA entry point
- PostgreSQL via MikroORM — see [infrastructure/CLAUDE.md](infrastructure/CLAUDE.md) for database conventions

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
bun skills:sync              # sync skills from all imported sources
bun skills:reset             # reset skills data and re-import
bun esco:import              # import ESCO skills taxonomy
bun linguist:import          # import GitHub Linguist language data
bun mind:import              # import MIND dataset
bun tanova:import            # import Tanova dataset
```

All import commands require `--env-file=.env` (set automatically in the scripts) and read source data from `.local/`.

## Environment Variables
Single `.env` at the repo root (gitignored; see `.env.example`):
```
POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_SCHEMA
TZ, API_PORT, NODE_ENV, CLAUDE_API_KEY, JWT_SECRET, JWT_EXPIRES_IN_SECONDS
```
Bun natively loads `.env` files — do NOT use `dotenv` or import `dotenv/config`.

`NODE_ENV=development` is set in `.env` (loaded automatically by Bun). `NODE_ENV=test` is set in `.env.test` (loaded automatically by `bun test`, overriding `.env`). Production deployments override at the platform level.

**Worktrees** use `.env.wt` (copied into each worktree by `wt:up`). The main `.env` is never used in worktrees.

## Tooling Notes

- **Biome 2.x** handles all linting and formatting (replaces ESLint + Prettier). Config at root `biome.json`. Line width is **120 characters**.
- **Knip** detects dead code, unused exports, and unused dependencies. Config at `knip.json`. Run `bun run knip`.
- **dependency-cruiser** enforces Onion Architecture boundaries. Run `bun run dep:check`. Config at `.dependency-cruiser.cjs`.
- **mise** manages Bun version (pinned in `.mise.toml`). Run `mise install` after cloning.
- Bun runs TypeScript natively — no build step required.
- See **`CONVENTIONS.md`** for file naming and import conventions (`.js` extensions, barrel imports, `import type`).

## CI Pipeline

GitHub Actions (`.github/workflows/ci.yaml`) runs on push to `main` and PRs. Path-filtered jobs:

| Job | Command | Notes |
|---|---|---|
| Lint & Format | `bun run check` | |
| Typecheck | `bun run typecheck` | |
| Test & Coverage | `bun run test:coverage` | |
| Integration Tests | `bun run --cwd infrastructure test:integration` | Installs Typst |
| Dead Code | `bun run knip` | |
| Dependency Boundaries | `bun run dep:check` | |
| E2E Tests | `bun e2e:test` | Installs Typst + Playwright Chromium |
| Secret Scanning | gitleaks | Always runs |

**Typst** is required for integration and E2E tests (resume PDF generation). CI installs it via `typst-community/setup-typst@v4`. Locally, install via `mise` or your OS package manager.

## Design System

Before writing or modifying frontend code, read these specs:

- **[web/design/design-system.md](web/design/design-system.md)** — OKLch color tokens, typography scale, component styling rules (borders not shadows, no bold/semibold text)
- **[web/design/ux-guidelines.md](web/design/ux-guidelines.md)** — click-to-edit interaction pattern, mutual exclusion of editable sections, validation timing, modal vs inline editing rules
