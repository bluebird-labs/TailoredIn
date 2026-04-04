# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow: Worktrees for Feature Work

**Never commit feature/milestone work directly to main.** Before starting any milestone step, create a worktree:

```bash
git worktree add .claude/worktrees/<name> -b feat/<branch-name>
```

Do all work inside that worktree. When implementation is complete and all checks pass, run `/land` to rebase on main, open a PR, wait for CI, and merge.

**Always commit `docs/`:** Any files created or modified under `docs/` (specs, design docs, plans) must be included in commits — never leave them as untracked.

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
| `e2e/` | `@tailoredin/e2e` | Playwright end-to-end tests | — |

## Commands

All commands are run from the repo root via `bun run <script>`.

### Primary commands

```bash
bun up                 # start everything: install, Docker, migrate, seed, API + web servers
bun down               # stop servers + Docker
bun fresh              # restart everything (down + up)
bun verify             # full project health check (typecheck → lint → dep:check → knip → test:coverage → test:integration → test:e2e)
```

### Quality checks (run individually or via `bun verify`)

```bash
bun run typecheck      # type-check all packages
bun run check          # Biome lint + format check
bun run check:fix      # Biome lint + format with auto-fix
bun run dep:check      # dependency-cruiser architecture boundary enforcement
bun run knip           # dead code / unused export detection
```

### Testing

```bash
bun run test                 # unit tests across all workspaces
bun run test:coverage        # unit tests with coverage report
bun run --cwd infrastructure test:integration  # integration tests (Testcontainers, real Postgres, 60s timeout)
bun run test:e2e             # Playwright E2E tests (headless)
bun run test:e2e:ui          # Playwright test UI
bun run test:e2e:headed      # Playwright with visible browser
bun test <path/to/test.ts>   # run a single test file
```

### Database

```bash
bun run db:migration:create  # create a new migration
bun run db:migration:up      # run pending migrations
bun run db:seed              # seed the database
```

### Diagrams

```bash
bun run domain:diagram       # regenerate domain/DOMAIN.mmd
bun run db:diagram           # regenerate infrastructure/DATABASE.mmd (needs DB running)
```

### Dev servers (for manual use — prefer `bun up`)

```bash
bun run dev            # API + web dev servers in parallel (skip Docker/migrations/seeds)
bun run api:dev        # API server with --watch
bun run web:dev        # Vite dev server
```

All TypeScript is executed directly by Bun (no compilation step). `typecheck` scripts exist only to surface type errors.

**Test runners**: `bun:test` (unit + integration). Integration tests in `infrastructure/test-integration/` use Testcontainers (real Postgres, 60 s timeout). E2E tests in `e2e/` use `@playwright/test`.

## Session Hygiene

### Unstaged files
Before ending a session, run `git status`. If there are unstaged or untracked files, ask the user what to do with each (commit, stash, or discard). Never leave files dangling silently.

### Destructive migrations
**Never run `db:migration:up` without asking first.** When asking, read the migration file and explicitly state whether it includes data deletion (DROP TABLE, DROP COLUMN, DELETE, TRUNCATE). Show the destructive SQL if present.

### Session-end checklist
1. `bun verify` — all checks must pass
2. `bun run domain:diagram && bun run db:diagram` — regenerate diagrams
3. Commit any diagram changes
4. `git status` — resolve any remaining unstaged/untracked files with the user

## Domain Model

See **`domain/DOMAIN.mmd`** for the full domain model — mermaid class diagram covering all aggregates, entities, value objects, and their relationships across Profile and Company subdomains.

## Conventions

See **`CONVENTIONS.md`** for detailed coding standards: OOP-first design, DI patterns, naming conventions, API response envelope format, pagination/sorting/filtering, and error handling. This is the primary reference for code style decisions.

## Key Design Decisions

### Plain Application Layer (No DI Framework)
Use cases are plain TypeScript classes with explicit constructor parameters. The `@needle-di/core` framework (`@injectable`, `inject`, `InjectionToken`) is only used in `infrastructure/` and the entry-point composition root (`api/`). This keeps the application layer framework-agnostic and testable.

### MikroORM Entities as ORM Aggregates
The ORM entities in `infrastructure/src/db/entities/` are separate from the domain entities in `domain/src/entities/`. The repository implementations in `infrastructure/src/repositories/` map between them.

### DI Tokens
DI tokens are defined in `infrastructure/src/DI.ts` as a single `DI` object. The composition root in `api/` uses these tokens to wire up the container.

### Dependency Injection
The composition root (`api/src/index.ts`) imports DI tokens from `@tailoredin/infrastructure` and wires up all services. Add new services by:
1. Adding a port interface to `application/src/ports/`
2. Adding an implementation to `infrastructure/src/`
3. Adding a DI token to `infrastructure/src/DI.ts`
4. Binding it in `api/src/container.ts`

See [infrastructure/CLAUDE.md](infrastructure/CLAUDE.md) for database conventions.

## Entry Points
- `api/src/index.ts` — starts Elysia server on port 8000

## Database
PostgreSQL via MikroORM (`infrastructure/src/db/`). All tables use `UnderscoreNamingStrategy`. Integration tests use Testcontainers (`infrastructure/test-integration/`). See [infrastructure/CLAUDE.md](infrastructure/CLAUDE.md) for ORM entity list and migration conventions.

## Environment Variables
Single `.env` at the repo root (gitignored; see `.env.example`):
```
POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_SCHEMA
```
Bun natively loads `.env` files — do NOT use `dotenv` or import `dotenv/config`.

`NODE_ENV=development` is set in `.env` (loaded automatically by Bun). `NODE_ENV=test` is set in `.env.test` (loaded automatically by `bun test`, overriding `.env`). Production deployments override at the platform level.

## Tooling Notes

- **Biome 2.x** handles all linting and formatting (replaces ESLint + Prettier). Config at root `biome.json`. Line width is **120 characters**.
- **Knip** detects dead code, unused exports, and unused dependencies. Config at `knip.json`. Run `bun run knip`.
- **dependency-cruiser** enforces Onion Architecture boundaries. Run `bun run dep:check`. Config at `.dependency-cruiser.cjs`.
- **mise** manages Bun version (pinned in `.mise.toml`). Run `mise install` after cloning.
- Bun runs TypeScript natively — no build step required.
- **NodeNext module resolution**: all relative imports in `.ts` files must use `.js` extensions (e.g., `import { Foo } from './Foo.js'`).
- **`env()` helpers**: Use `env(key)`, `envInt(key)`, `envBool(key)` from `@tailoredin/core` for typed env access. They throw at call time if a key is missing — no side effects at import.
- **No deep subpath imports from `@tailoredin/core`**: Always import from `@tailoredin/core`, never from `@tailoredin/core/src/Foo.js`. Everything is exported via the barrel.
