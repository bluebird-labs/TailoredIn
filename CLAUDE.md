# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow: Worktrees for Feature Work

**Never commit feature/milestone work directly to main.** Before starting any milestone step, check `GOALS.md` for the prescribed branch name and worktree path, then create the worktree:

```bash
git worktree add .claude/worktrees/<name> -b feat/<branch-name>
```

Do all work inside that worktree. Merge to main only after the PR is approved.

## Architecture: DDD / Onion Architecture

Bun monorepo — **TailoredIn** — structured as four Onion Architecture layers plus a cross-cutting `core/` package.

```
core/          ← Cross-cutting pure utilities (no domain, no framework deps)
domain/          ← Single package: aggregates, value objects, domain services, events
application/     ← Single package: use cases + ports + DTOs (plain classes, no DI framework)
infrastructure/  ← Single package: ORM entities, repository impls, external service adapters, DI tokens
api/             ← Elysia HTTP server + DI composition root
cli/             ← CLI entry points: jobby, cvs, robot
```

**Dependency rule (inward only):**
```
api/cli → infrastructure → application → domain → (core)
```

### Layer Details

| Layer | Package | Purpose |
|---|---|---|
| `core/` | `@tailoredin/core` | Shared TypeScript utilities (EnumUtil, TimeUtil, ColorUtil, Environment, etc.) |
| `domain/` | `@tailoredin/domain` | Aggregates (JobPosting, Company, Skill, Resume), value objects (JobStatus, Archetype, SkillName), domain services (JobElectionService, TailoringStrategyService), domain events |
| `application/` | `@tailoredin/application` | Use cases (IngestScrapedJob, ScrapeAndIngestJobs, GetJob, GetTopJob, ChangeJobStatus, GenerateResume), ports (JobRepository, CompanyRepository, JobScraper, LlmService, ResumeRenderer, etc.), DTOs |
| `infrastructure/` | `@tailoredin/infrastructure` | MikroORM entities + repositories, PostgreSQL migrations, OpenAI LLM service, Playwright scraper + web color service, Typst resume renderer, DI tokens |
| `api/` | `@tailoredin/api` | Elysia HTTP routes + DI composition root |
| `cli/` | `@tailoredin/cli` | CLI entry points: `jobby` (job management), `cvs` (resume generation), `robot` (scraping daemon) |

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

# Dependency boundary enforcement
bun run dep:check      # verify no circular deps or cross-layer violations

# API server
bun run backend              # start on port 8000
bun run backend:watch        # start with --watch

# Background scraping robot
bun run robot
bun run robot:watch

# Resume builder CLI
bun run cvs gen --archetype nerd --theme skyblue --company_name "Acme" --keywords node typescript

# Typecheck (per-package)
bun run --cwd <package-dir> typecheck

# MikroORM migrations — run from infrastructure/
bun run db:migration:create
bun run db:migration:up
```

All TypeScript is executed directly by Bun (no compilation step). `typecheck` scripts exist only to surface type errors.

## Key Design Decisions

### Plain Application Layer (No DI Framework)
Use cases are plain TypeScript classes with explicit constructor parameters. The `@needle-di/core` framework (`@injectable`, `inject`, `InjectionToken`) is only used in `infrastructure/` and entry-point composition roots (`api/`, `cli/`). This keeps the application layer framework-agnostic and testable.

### MikroORM Entities as ORM Aggregates
The ORM entities in `infrastructure/src/db/entities/` are separate from the domain entities in `domain/src/entities/`. The repository implementations in `infrastructure/src/repositories/` map between them.

### DI Tokens
DI tokens are defined in `infrastructure/src/DI.ts` as a single `DI` object. Composition roots in `api/` and `cli/` use these tokens to wire up the container.

### Dependency Injection
Composition roots (`api/src/index.ts`, `cli/src/*/container.ts`) import DI tokens from `@tailoredin/infrastructure` and wire up all services. Add new services by:
1. Adding a port interface to `application/src/ports/`
2. Adding an implementation to `infrastructure/src/`
3. Adding a DI token to `infrastructure/src/DI.ts`
4. Binding it in the appropriate composition root

## Entry Points
- `api/src/index.ts` — starts Elysia server on port 8000
- `cli/src/robot/index.ts` — infinite loop: scrape LinkedIn → ingest → sleep 15–30 min
- `cli/src/jobby/index.ts` — `cmd-ts` CLI for manual job operations (`move`, `retire`)
- `cli/src/cvs/index.ts` — Yargs `cvs` CLI for generating tailored PDFs

## Data Flow

**Job Discovery:**
```
cli/robot → ScrapeAndIngestJobs use case
  → PlaywrightJobScraper (infrastructure) → LinkedIn scraping
  → IngestScrapedJob use case
    → CompanyRepository.upsertByLinkedinLink() + JobRepository.upsertByLinkedinId()
    → JobElectionService.elect() (domain) → status: NEW or auto-rejected
```

**Resume Generation:**
```
PUT /jobs/:id/generate-resume → GenerateResume use case
  → LlmService.extractJobPostingInsights() (GPT-4o structured output)
  → WebColorService.findPrimaryColor() (Playwright + node-vibrant)
  → ResumeContentFactory.make() → ResumeRenderer.render() → Typst compile → PDF
```

## Database
PostgreSQL via MikroORM (`infrastructure/src/db/`). Config in `infrastructure/src/db/orm-config.ts`. Entities: `Job`, `Company`, `Skill`, `SkillAffinity`, `JobStatusUpdate`. All tables use `UnderscoreNamingStrategy`.

**Job scoring**: `JobOrmRepository` uses pgtyped SQL with skill affinity weights (EXPERT=8, INTEREST=2, AVOID=2) to rank jobs.

### Job Status Lifecycle
`JobStatus` enum covers the full funnel: `NEW → APPLIED → RECRUITER_SCREEN → TECHNICAL_SCREEN → ON_SITE → OFFER`. Auto-rejection statuses set by the robot: `RETIRED`, `DUPLICATE`, `HIGH_APPLICANTS`, `LOCATION_UNFIT`, `POSTED_TOO_LONG_AGO`. Manual statuses: `UNFIT`, `EXPIRED`, `LOW_SALARY`.

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
- **dependency-cruiser** enforces Onion Architecture boundaries. Run `bun run dep:check`. Config at `.dependency-cruiser.cjs`.
- **mise** manages Bun and Typst versions (pinned in `.mise.toml`). Run `mise install` after cloning.
- Bun runs TypeScript natively — no build step required.
- **NodeNext module resolution**: all relative imports in `.ts` files must use `.js` extensions (e.g., `import { Foo } from './Foo.js'`).
- **`env()` helpers**: Use `env(key)`, `envInt(key)`, `envBool(key)` from `@tailoredin/core` for typed env access. They throw at call time if a key is missing — no side effects at import.
- **No deep subpath imports from `@tailoredin/core`**: Always import from `@tailoredin/core`, never from `@tailoredin/core/src/Foo.js`. Everything is exported via the barrel.
