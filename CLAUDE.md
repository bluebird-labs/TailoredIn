# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

Bun monorepo — **TailoredIn** — with seven packages under `packages/`:

| Package | Purpose |
|---|---|
| `shared` | Shared TypeScript utilities, no heavy deps |
| `db` | MikroORM entities, repositories, migrations, domain types (`Archetype`, `JobStatus`, …) |
| `linkedin` | Playwright-based LinkedIn scraper + job search |
| `ai` | OpenAI services (`JobInsightsExtractor`, `WebsiteColorsFinder`) |
| `resume` | Typst/Brilliant-CV resume generation + `cvs` CLI |
| `api` | Koa HTTP server + routes + `jobby` CLI |
| `robot` | Background scraping loop |

**Dependency graph (acyclic):**
```
shared → (none)
db → shared
linkedin → db, shared
ai → db, shared
resume → ai, db, shared
api → resume, ai, db, shared
robot → linkedin, db, shared
```

All packages use `@tailoredin/<name>` with `"workspace:*"` references.

## Commands

All commands are run from the repo root via `bun run <script>` or scoped with `--cwd packages/<name>`.

```bash
# Install dependencies
bun install

# Linting / formatting (Biome, runs across all packages)
bun run check          # check without fixing
bun run check:fix      # lint + format with auto-fix
bun run format         # format only
bun run lint           # lint only

# API server
bun run backend              # start on port 8000
bun run backend:watch        # start with --watch

# Background scraping robot
bun run robot
bun run robot:watch

# Resume builder CLI
bun run cvs gen --archetype nerd --theme skyblue --company_name "Acme" --keywords node typescript

# Typecheck (per-package)
bun run --cwd packages/<name> typecheck

# SQL codegen (pgtyped) — run from packages/db
bun run --cwd packages/db sql
bun run --cwd packages/db sql:watch

# MikroORM migrations — run from packages/db
bun run --cwd packages/db migration:create
bun run --cwd packages/db migration:up
```

All TypeScript is executed directly by Bun (no compilation step). `typecheck` scripts exist only to surface type errors.

## Architecture

### Entry Points
- `packages/api/src/index.ts` — starts Koa server on port 8000
- `packages/robot/src/index.ts` — infinite loop: scrape LinkedIn → ingest → sleep 15–30 min
- `packages/api/cli/jobby.ts` — `cmd-ts` CLI for manual job operations (`move`, `retire`)
- `packages/resume/cli/index.ts` — Yargs `cvs` CLI for generating tailored PDFs

### Dependency Injection
Each package exports its own DI symbols (e.g., `AiDI`, `LinkedInDI`, `ResumeDI`). Composition roots (`api/src/di/container.ts`, `robot/src/di/container.ts`) import those symbols and wire up all services. Add new services by:
1. Adding a symbol to the relevant package's `src/DI.ts`
2. Binding it in the appropriate composition root

### Data Flow

**Job Discovery:**
```
robot/src/index.ts → LinkedInExplorer (Playwright) → LinkedInSearchJobsCommand
  → JobSearchHandler.ingestJobSearchResult()
    → CompanyRepository.resolve() + JobRepository.resolve()
      → MyJobElector.elect() → status: NEW or auto-rejected
```

**Resume Generation:**
```
PUT /jobs/:id/generate-resume
  → JobInsightsExtractor (GPT-4o structured output) — extracts archetype + keyword matches
  → WebsiteColorsFinder (Playwright + node-vibrant) — company website palette
  → ResumeGenerator → Typst source files → execSync('typst compile') → PDF
```

### Database
PostgreSQL via MikroORM (`packages/db`). Config in `src/baseOrmConfig.ts`. Entities: `Job`, `Company`, `Skill`, `SkillAffinity`, `JobStatusUpdate`. All tables use `UnderscoreNamingStrategy`.

**Transient pattern**: `TransientJob`/`TransientCompany` (no ID) are created from scraped data, then resolved to persistent entities via repository upsert logic.

**Job scoring**: `JobRepository` uses pgtyped SQL with skill affinity weights (EXPERT=8, INTEREST=2, AVOID=2) to rank jobs. Regenerate typed SQL after changing `.sql` files with `bun run --cwd packages/db sql`.

### LinkedIn Auth
Playwright stores session cookies in `packages/linkedin/playwright/.auth/linkedin.json`. Delete this file to force re-login.

### Environment Variables
Single `.env` at the repo root (gitignored; see `.env.example`):
```
POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_SCHEMA
OPENAI_API_KEY, OPENAI_PROJECT_ID
LINKEDIN_EMAIL, LINKEDIN_PASSWORD
HEADLESS=true         # set false to watch Playwright browser
SLOW_MO=0             # ms delay between Playwright actions
```
`dotenv/config` is imported at the top of each process entry point. Do NOT hardcode a `path` option — dotenv resolves `.env` relative to `process.cwd()`, which is the repo root when launched via `bun run`.

### Search Config
Job search profiles (keywords, location, remote, recency) are in `packages/robot/config.ts`. Edit there to change what LinkedIn searches the robot runs.

### Job Status Lifecycle
`JobStatus` enum covers the full funnel: `NEW → APPLIED → RECRUITER_SCREEN → TECHNICAL_SCREEN → ON_SITE → OFFER`. Auto-rejection statuses set by the robot: `RETIRED`, `DUPLICATE`, `HIGH_APPLICANTS`, `LOCATION_UNFIT`, `POSTED_TOO_LONG_AGO`. Manual statuses: `UNFIT`, `EXPIRED`, `LOW_SALARY`.

## Tooling Notes

- **Biome 2.x** handles all linting and formatting (replaces ESLint + Prettier). Config at root `biome.json`. Decorator-heavy files may report parse warnings — add `"javascript": { "parser": { "unsafeParameterDecoratorsEnabled": true } }` to `biome.json` if needed.
- **mise** manages Bun and Typst versions (pinned in `.mise.toml`). Run `mise install` after cloning.
- Bun runs TypeScript natively — no build step required to execute `.ts` files.
- **NodeNext module resolution**: all relative imports in `.ts` files must use `.js` extensions (e.g., `import { Foo } from './Foo.js'`).
- **`reflect-metadata` import order**: must be the **first** import in every process entry point. Violating this silently breaks Inversify.
- **`Environment.ts` side effects**: not in the `shared/src/index.ts` barrel. Import directly as `@tailoredin/shared/src/Environment.js`.
