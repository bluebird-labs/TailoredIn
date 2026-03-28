# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

Bun monorepo with three packages under `packages/`:

| Package | Purpose |
|---|---|
| `backend` | Koa REST API + LinkedIn scraping robot + `jobby` CLI |
| `web-app` | React/MUI frontend (CRA) for browsing and managing jobs |
| `resume-builder` | Standalone `cvs` CLI for generating tailored PDFs |

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

# Backend
bun run backend              # start API server (port 8000)
bun run backend:watch        # start with --watch
bun run robot                # start job-scraping robot
bun run typecheck            # tsc --noEmit on all packages
bun run test                 # bun test (backend)

# SQL codegen (pgtyped)
bun run sql                  # regenerate typed SQL
bun run sql:watch

# MikroORM migrations
bun run --cwd packages/backend bunx mikro-orm migration:create
bun run --cwd packages/backend bunx mikro-orm migration:up

# Resume builder CLI
bun run cvs gen --archetype nerd --theme skyblue --company_name "Acme" --keywords node typescript
```

All TypeScript is executed directly by Bun (no compilation step). `typecheck` scripts exist only to surface type errors.

## Backend Architecture

### Entry Points
- `src/process/api.ts` — starts Koa server on port 8000
- `src/process/robot.ts` — infinite loop: scrape LinkedIn → ingest → sleep 15–30 min
- `cli/jobby.ts` — `cmd-ts` CLI for manual job operations (`move`, `retire`)

### Dependency Injection
Inversify container (`src/di/container.ts`) wires up all services as singletons. The DI symbols are in `src/di/DI.ts`. Add new services there and bind them in the container before injecting via `@inject(DI.Symbol)`.

### Data Flow

**Job Discovery:**
```
robot.ts → LinkedInExplorer (Playwright) → LinkedInSearchJobsCommand
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
PostgreSQL via MikroORM. Config in `src/orm/baseOrmConfig.ts`. Entities: `Job`, `Company`, `Skill`, `SkillAffinity`, `JobStatusUpdate`. All tables use `UnderscoreNamingStrategy`.

**Transient pattern**: `TransientJob`/`TransientCompany` (no ID) are created from scraped data, then resolved to persistent entities via repository upsert logic.

**Job scoring**: `JobRepository` uses pgtyped SQL with skill affinity weights (EXPERT=8, INTEREST=2, AVOID=2) to rank jobs. Regenerate typed SQL after changing `.sql` files with `bun run sql`.

### LinkedIn Auth
Playwright stores session cookies in `packages/backend/playwright/.auth/linkedin.json`. Delete this file to force re-login.

### Environment Variables
Required in `packages/backend/.env`:
```
POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DBNAME, POSTGRES_SCHEMA
OPENAI_API_KEY, OPENAI_PROJECT_ID
LINKEDIN_EMAIL, LINKEDIN_PASSWORD
HEADLESS=true         # set false to watch Playwright browser
SLOW_MO=0             # ms delay between Playwright actions
```

### Search Config
Job search profiles (keywords, location, remote, recency) are hardcoded in `packages/backend/config.ts`. Edit there to change what LinkedIn searches are run by the robot.

### Job Status Lifecycle
`JobStatus` enum covers the full funnel: `NEW → APPLIED → RECRUITER_SCREEN → TECHNICAL_SCREEN → ON_SITE → OFFER`. Auto-rejection statuses set by the robot: `RETIRED`, `DUPLICATE`, `HIGH_APPLICANTS`, `LOCATION_UNFIT`, `POSTED_TOO_LONG_AGO`. Manual statuses: `UNFIT`, `EXPIRED`, `LOW_SALARY`.

## Web-App Architecture

Single-page React app (CRA / `react-scripts`). No routing. Main layout: DataGrid (left) + JobDetailsContainer (right).

- `src/model.ts` — shared types: `Job`, `Company`, `JobStatus`, `JobDescriptionItem`
- `src/api/Api.ts` — HTTP client pointing to `http://localhost:8000`
- `src/JobDetailsContainer.tsx` — renders parsed description items; keywords hardcoded for highlight/lowlight

The web-app runs independently from the monorepo (`react-scripts` uses webpack, not Bun's bundler).

## Resume Builder Architecture

Standalone Yargs CLI. `cvs gen` builds a RenderCV YAML config (content + design + locale), writes it to a temp file, calls `rendercv render` as a subprocess, then opens the PDF. Designs are in `src/generator/designs/`. Work history data is hardcoded in `src/generator/data/`.

The backend's `ResumeGenerator` service duplicates parts of this logic (same design templates, same `rendercv` subprocess call).

## Tooling Notes

- **Biome 2.x** handles all linting and formatting (replaces ESLint + Prettier). Config at root `biome.json`. Decorator-heavy backend files may report parse warnings — add `"javascript": { "parser": { "unsafeParameterDecoratorsEnabled": true } }` to `biome.json` if needed.
- **mise** manages the Bun version (pinned in `.mise.toml`). Run `mise install` after cloning.
- Bun runs TypeScript natively — no build step required to execute `.ts` files.
