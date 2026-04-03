# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow: Worktrees for Feature Work

**Never commit feature/milestone work directly to main.** Before starting any milestone step, create a worktree:

```bash
git worktree add .claude/worktrees/<name> -b feat/<branch-name>
```

Do all work inside that worktree. When implementation is complete and all checks pass, run `/land` to rebase on main, open a PR, wait for CI, and merge.

## Architecture: DDD / Onion Architecture

Bun monorepo — **TailoredIn** — structured as four Onion Architecture layers plus a cross-cutting `core/` package.

```
core/          ← Cross-cutting pure utilities (no domain, no framework deps)
domain/          ← Single package: aggregates, value objects, domain services, events
application/     ← Single package: use cases + ports + DTOs (plain classes, no DI framework)
infrastructure/  ← Single package: ORM entities, repository impls, external service adapters, DI tokens
api/             ← Elysia HTTP server + DI composition root
```

**Dependency rule (inward only):**
```
api → infrastructure → application → domain → (core)
```

### Layer Details

| Layer | Package | Purpose |
|---|---|---|
| `core/` | `@tailoredin/core` | Shared TypeScript utilities (EnumUtil, TimeUtil, ColorUtil, Environment, etc.) |
| `domain/` | `@tailoredin/domain` | Aggregates (JobPosting, Company, Skill, Resume), value objects (JobStatus, Archetype, SkillName), domain services (JobElectionService, TailoringStrategyService), domain events |
| `application/` | `@tailoredin/application` | Use cases (IngestScrapedJob, IngestJobByUrl, GetJob, ChangeJobStatus, GenerateResume), ports (JobRepository, CompanyRepository, JobScraper, LlmService, ResumeRenderer, etc.), DTOs |
| `infrastructure/` | `@tailoredin/infrastructure` | MikroORM entities + repositories, PostgreSQL migrations, OpenAI LLM service, Playwright scraper + web color service, Typst resume renderer, DI tokens |
| `api/` | `@tailoredin/api` | Elysia HTTP routes + DI composition root |
| `web/` | `@tailoredin/web` | React 19 + Vite + TanStack Router/Query + shadcn/ui frontend. Only imports from `@tailoredin/api/client` (Eden Treaty) |

## Commands

All commands are run from the repo root via `bun run <script>`.

```bash
# Install dependencies
bun install

# Linting / formatting (Biome, runs across all packages)
bun run check          # check without fixing
bun run check:fix      # lint + format with auto-fix
bun run format         # format only
bun run lint           # lint only

# Dead code detection
bun run knip           # unused files, exports, dependencies

# Dependency boundary enforcement
bun run dep:check      # verify no circular deps or cross-layer violations

# Dev environment (one command — installs deps, Docker, migrations, seeds, servers)
bun up                       # start everything (Ctrl+C to stop servers)
bun down                     # stop servers + Docker
bun run dev                  # servers only (skip Docker/migrations/seeds)

# API server
bun run api                  # start on port 8000
bun run api:dev              # start with --watch

# Web frontend
bun run web                  # Vite production preview
bun run web:dev              # Vite dev server

# Typecheck (per-package)
bun run --cwd <package-dir> typecheck

# MikroORM migrations — run from infrastructure/
bun run db:migration:create
bun run db:migration:up
```

All TypeScript is executed directly by Bun (no compilation step). `typecheck` scripts exist only to surface type errors.

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

## Entry Points
- `api/src/index.ts` — starts Elysia server on port 8000

## Data Flow

**Single-URL Job Import:**
```
POST /jobs { linkedinUrl } → IngestJobByUrl use case
  → PlaywrightJobScraper.scrapeByUrl() → scrape single posting
  → IngestScrapedJob → election + scoring
```

**Resume Generation:**
```
PUT /jobs/:id/generate-resume → GenerateResume use case
  → ProfileRepository.findSingle() + ArchetypeRepository.findAll()
  → LlmService.extractJobPostingInsights() (GPT-4o structured output, skipped if no API key)
  → WebColorService.findPrimaryColor() (Playwright + node-vibrant)
  → DatabaseResumeContentFactory.make() (reads from Profile, Headline, Experience, Education, SkillCategory repos via Archetype content_selection)
  → ResumeRenderer.render() → Typst compile → PDF
```

## Database
PostgreSQL via MikroORM (`infrastructure/src/db/`). Config in `infrastructure/src/db/orm-config.ts`. Entities: `Profile`, `Experience`, `Bullet`, `BulletVariant`, `Headline`, `Education`, `SkillCategory`, `SkillItem`, `Tag`, `Archetype`, `ArchetypeTagWeight`, `Job`, `Company`, `CompanyBrief`, `Skill`, `JobStatusUpdate`. All tables use `UnderscoreNamingStrategy`. Integration tests use Testcontainers (`infrastructure/test-integration/`).

**Job scoring**: `JobOrmRepository` uses Kysely query builder with skill affinity weights (EXPERT=8, INTEREST=2, AVOID=2) to rank jobs.

### Job Status Lifecycle
`JobStatus` enum covers the full funnel: `NEW → APPLIED → RECRUITER_SCREEN → TECHNICAL_SCREEN → ON_SITE → OFFER`. Auto-rejection statuses: `RETIRED`, `DUPLICATE`, `HIGH_APPLICANTS`, `LOCATION_UNFIT`, `POSTED_TOO_LONG_AGO`. Manual statuses: `UNFIT`, `EXPIRED`, `LOW_SALARY`.

## Environment Variables
Single `.env` at the repo root (gitignored; see `.env.example`):
```
POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_SCHEMA
OPENAI_API_KEY, OPENAI_PROJECT_ID
LINKEDIN_EMAIL, LINKEDIN_PASSWORD
HEADLESS=true         # set false to watch Playwright browser
SLOW_MO=0             # ms delay between Playwright actions
```
Bun natively loads `.env` files — do NOT use `dotenv` or import `dotenv/config`.

## Tooling Notes

- **Biome 2.x** handles all linting and formatting (replaces ESLint + Prettier). Config at root `biome.json`.
- **Knip** detects dead code, unused exports, and unused dependencies. Config at `knip.json`. Run `bun run knip`.
- **dependency-cruiser** enforces Onion Architecture boundaries. Run `bun run dep:check`. Config at `.dependency-cruiser.cjs`.
- **mise** manages Bun and Typst versions (pinned in `.mise.toml`). Run `mise install` after cloning.
- Bun runs TypeScript natively — no build step required.
- **NodeNext module resolution**: all relative imports in `.ts` files must use `.js` extensions (e.g., `import { Foo } from './Foo.js'`).
- **`env()` helpers**: Use `env(key)`, `envInt(key)`, `envBool(key)` from `@tailoredin/core` for typed env access. They throw at call time if a key is missing — no side effects at import.
- **No deep subpath imports from `@tailoredin/core`**: Always import from `@tailoredin/core`, never from `@tailoredin/core/src/Foo.js`. Everything is exported via the barrel.
