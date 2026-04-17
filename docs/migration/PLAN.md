# Node + NestJS Migration Plan

**Goal:** Migrate TailoredIn from Bun/Elysia/Needle DI to Node 22 LTS / NestJS / Jest / pnpm + Turborepo.

---

## Ground Rules

### Deliverability
1. Every session ends green — all quality checks pass before merging to `refactor`.
2. One concern per session. No session touches both the HTTP framework and the DI system.
3. Each session works in its own worktree branched from `refactor`, merges back when done.

### Architecture
4. Onion Architecture preserved. `dep:check` enforces boundaries throughout.
5. Application use cases get `@Injectable()`. The "plain application layer" rule is retired.
6. Zod for validation (already a project dependency). `nestjs-zod`'s `createZodDto()` for NestJS integration. No class-validator.
7. DI tokens (`infrastructure/src/DI.ts`) survive — the nested `InjectionToken` namespace works with NestJS `@Inject()`.

### Testing
8. Jest is the test runner. All 96 `bun:test` files migrate.
9. Same assertions, same mocking patterns (`jest.fn()` replaces `mock()`). No test rewrites beyond mechanical changes.
10. Integration tests stay on Testcontainers.

### Tooling
11. pnpm + Turborepo. `workspace:*` preserved.
12. `tsx` replaces `bun` for TypeScript execution.
13. Biome stays (runtime-agnostic Rust binary).

### Environment
14. Profile-based: `local` (Docker per branch), `production` (deployed infra), `test` (Testcontainers).
15. `@nestjs/config` with Zod schema — fail-fast on bad config.
16. Deterministic port allocation from branch name. No session files.
17. The `wt:*` command family is deleted. `dev:up` works from any branch.

### Web Layer
18. OpenAPI spec + `orval` replaces Eden Treaty.
19. Response envelope stays manual (`{ data }` / `{ error }`).

---

## Session Strategy

### Execution Waves

```
Wave 1:  S1 (tooling)
Wave 2:  S2 (Jest)  +  S3 (DI decorators)     ← parallel
Wave 3:  S4 (Bun API removal)
Wave 4:  S5 (NestJS rewrite)
Wave 5:  S6 (API client)  +  S7 (env/scripts)  ← parallel
```

### Session Map

| Session | Branch | Phase | Depends On | Parallel With |
|---------|--------|-------|------------|---------------|
| S1 | `refactor/tooling` | 1: pnpm + Turborepo | — | — |
| S2 | `refactor/jest` | 2: Jest migration | S1 merged | S3 |
| S3 | `refactor/di` | 3: DI decorators | S1 merged | S2 |
| S4 | `refactor/node-apis` | 4: Bun API removal | S3 merged | — |
| S5 | `refactor/nestjs` | 5: NestJS rewrite | S2 + S4 merged | — |
| S6 | `refactor/api-client` | 6: Eden → orval | S5 merged | S7 |
| S7 | `refactor/env-scripts` | 7: Env redesign + scripts + CI | S5 merged | S6 |

### Why S4 waits for S3

S3 (DI decorators) and S4 (Bun API removal) both touch infrastructure source files. S3 changes decorator imports and constructor signatures; S4 changes method bodies (Bun.file → readFile, etc.). Running them in parallel would cause merge conflicts on files like resume renderers and `BunPasswordHasher` which need both changes. Sequential avoids this.

### Why S2 and S3 can run in parallel

S2 touches only test files (imports, mocks) + bunfig.toml + package.json test scripts. S3 touches only production source files (decorators, constructor params) + package.json deps. Zero file overlap.

---

## S1: Tooling Foundation

**Branch:** `refactor/tooling`
**Effort:** 1-2 days

### Tasks
- Install pnpm, generate `pnpm-lock.yaml`
- Verify all `workspace:*` references resolve under pnpm
- Add `turbo.json` with tasks: `typecheck`, `test`, `test:coverage`, `test:integration`, `check`, `dep:check`, `knip`
- Update root `package.json` scripts to use `turbo run` where appropriate
- Update `.mise.toml` to add Node 22 alongside Bun (both coexist temporarily)
- Delete `bun.lock`

### Does NOT change
- Runtime still Bun for scripts, tests, dev servers
- All `bun test`, `bun run` commands in workspace package.json are unchanged
- No source code changes

### Exit criteria
- `pnpm install` succeeds
- `turbo run typecheck test check` all pass
- `pnpm --filter infrastructure test:integration` passes

---

## S2: Jest Migration

**Branch:** `refactor/jest`
**Effort:** 2-3 days

### Tasks
- Add Jest + `@swc/jest` + `@types/jest` to root devDependencies
- Create `jest.config.ts` at root with project references
- Create per-workspace Jest configs:
  - `core/` — default
  - `domain/` — setupFiles for MikroORM metadata init
  - `application/` — setupFiles for MikroORM metadata init
  - `infrastructure/` — separate configs for unit (test/) and integration (test-integration/, 60s timeout)
  - `web/` — jsdom or happy-dom environment
- Codemod 96 test files:
  - Remove `import { ... } from 'bun:test'` (Jest globals)
  - `mock(fn)` → `jest.fn(fn)`, `mock()` → `jest.fn()`
  - `(x as ReturnType<typeof mock>)` → `(x as jest.Mock)`
- Delete all `bunfig.toml` files (4)
- Update package.json test scripts: `bun test` → `jest`
- Skip `BunPasswordHasher.test.ts` (depends on Bun.password — fixed in S4)
- Convert the one `require('node:fs')` to `import`

### Exit criteria
- `turbo run test` passes (all unit tests on Jest/Node)
- `pnpm --filter infrastructure test:integration` passes (60s timeout)
- Zero `bun:test` imports remain

---

## S3: DI Decorator Migration

**Branch:** `refactor/di`
**Effort:** 2-3 days

### Tasks

#### Application layer (~50 use case classes)
- Add `@nestjs/common` to `application/package.json`
- Add `@Injectable()` + `@Inject(DI.X.Y)` to every use case class
- Pattern: `constructor(private readonly repo: Repo)` → `constructor(@Inject(DI.X.Repository) private readonly repo: Repo)`

#### Infrastructure layer (~29 classes)
- Replace `import { injectable, inject } from '@needle-di/core'` → `import { Injectable, Inject } from '@nestjs/common'`
- `@injectable()` → `@Injectable()`
- `= inject(TOKEN)` default params → `@Inject(TOKEN)` parameter decorators

#### DI tokens
- Verify `InjectionToken` from `@needle-di/core` works with NestJS `@Inject()`, or replace with NestJS-compatible string tokens

#### Cleanup
- Remove `@needle-di/core` from all package.json files

### Does NOT change
- `api/src/container.ts` — still Needle DI composition root (replaced in S5)
- `api/src/routes/` — still Elysia (replaced in S5)
- Test files (handled by S2)

### Exit criteria
- `turbo run typecheck` passes
- No `@needle-di/core` imports remain (except `api/src/container.ts` which uses the Container class)
- All `@injectable()` → `@Injectable()` across application + infrastructure

### Important note
`api/` still depends on `@needle-di/core` for the `Container` class in `container.ts`. This is intentional — it gets replaced in S5 when the NestJS module system takes over. The `@needle-di/core` dep stays in `api/package.json` until then.

---

## S4: Bun API Removal

**Branch:** `refactor/node-apis`
**Effort:** 2-3 days

### Tasks

#### `import.meta.dir` → `import.meta.dirname` (9 files)
- `infrastructure/src/llm/BaseLlmApiProvider.ts`
- `infrastructure/src/resume/renderers/ModernCvRenderer.ts`
- `infrastructure/src/resume/renderers/BrilliantCvRenderer.ts`
- `infrastructure/src/resume/renderers/LinkedCvRenderer.ts`
- `infrastructure/src/resume/ClaudeApiResumeScorer.ts`
- `infrastructure/src/resume/ClaudeApiResumeElementGeneratorNew.ts`
- `infrastructure/src/job/ClaudeApiJobDescriptionParser.ts`
- `infrastructure/src/job/ClaudeApiFitScorer.ts`
- `infrastructure/src/company/ClaudeApiCompanyDataProvider.ts`

#### `Bun.file()` / `Bun.write()` → `node:fs/promises` (8 files)
- Resume renderers (4): `Bun.file(path).arrayBuffer()` → `readFile(path)`, `Bun.write(dest, Bun.file(src))` → `copyFile(src, dest)`
- Data parsers (4): `Bun.file(path).text()` → `readFile(path, 'utf-8')`, `.json()` → `readFile` + `JSON.parse`

#### `Bun.spawn()` / `Bun.spawnSync()` → `node:child_process` (4 renderers)
- Promise wrapper for spawn + close event

#### `Bun.Glob` → `glob` npm package (3 renderers)
- `new Bun.Glob(pattern).scan(dir)` → `glob(pattern, { cwd: dir })`

#### `Bun.password` → `argon2` (3 files)
- Rename `BunPasswordHasher` → `Argon2PasswordHasher`
- `Bun.password.hash()` → `argon2.hash()`
- `Bun.password.verify()` → `argon2.verify()`
- Update `E2eSeeder.ts` and `set-password.ts`
- Un-skip `BunPasswordHasher.test.ts` (now tests Argon2PasswordHasher)

#### `Bun.CryptoHasher` → `node:crypto` (1 file)
- `JwtTokenIssuer.ts`: `new Bun.CryptoHasher('sha256', key)` → `createHmac('sha256', key)`

#### Cleanup
- Remove `bun-types` from devDependencies (root + infrastructure)
- Remove `"bun-types"` from `"types"` in tsconfig.base.json, infrastructure/tsconfig.json, web/tsconfig.json

### Exit criteria
- `turbo run typecheck test` passes
- `pnpm --filter infrastructure test:integration` passes
- `grep -r "Bun\." --include='*.ts' infrastructure/src/` returns zero results
- `grep -r "import.meta.dir[^n]" --include='*.ts'` returns zero results

---

## S5: NestJS API Rewrite

**Branch:** `refactor/nestjs`
**Effort:** 5-7 days (largest session)

### Tasks

#### NestJS bootstrap
- Add deps: `@nestjs/core`, `@nestjs/common`, `@nestjs/config`, `@nestjs/platform-express`, `@nestjs/swagger`, `@mikro-orm/nestjs`, `nestjs-zod`
- Create `api/src/app.module.ts` — root module
- Create `api/src/main.ts` — NestJS bootstrap
- Global `ZodValidationPipe` (422 for validation errors)
- Global `GlobalExceptionFilter` (AuthenticationError → 401, ExternalServiceError → 502/500)
- MikroORM via `@mikro-orm/nestjs` `MikroOrmModule.forRoot()`

#### Environment config
- Create `api/src/config/env.schema.ts` — Zod schema for all env vars:
  ```
  APP_PROFILE (enum: local/production/test, default: local)
  POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_SCHEMA
  API_PORT (default 8000), NODE_ENV (enum), JWT_SECRET (min 32), JWT_EXPIRES_IN_SECONDS
  CLAUDE_API_KEY (optional), TZ (default UTC)
  ```
- `ConfigModule.forRoot({ isGlobal: true, validate: (config) => EnvSchema.parse(config) })`
- Replace `process.env`/`env()`/`envInt()` reads in NestJS-injected classes with `ConfigService`

#### Auth
- `JwtAuthGuard` (CanActivate) — reads Bearer, calls TokenIssuer.verify()
- `@CurrentUser()` param decorator — extracts `{ accountId, profileId }` from `request.user`
- `@Public()` decorator to exempt routes
- Apply guard globally via `APP_GUARD`; mark login + health as `@Public()`

#### Controllers (~13, from 54 route classes)
- `auth/` — AuthController (login) — 1 method
- `profile/` — ProfileController — 2 methods
- `education/` — EducationController — 4 methods
- `experience/` — ExperienceController — 11 methods
- `company/` — CompanyController — 5-7 methods
- `skill/` — SkillController — 4 methods
- `job-description/` — JobDescriptionController — 7 methods
- `application/` — ApplicationController — 6 methods
- `resume/` — ResumeController — 6 methods (including PDF binary)
- `generation-settings/` — GenerationSettingsController — 2 methods
- `factory/` — FactoryController (text extract, file upload via Multer) — 1 method
- `health/` — HealthController — 1 method

#### Zod validation schemas (~25-30)
- Create Zod schema + `createZodDto()` for every route body/query/params
- `z.discriminatedUnion('type', [...])` for GenerateResumeContent scope
- File upload: `@UseInterceptors(FileInterceptor('file'))` + `@UploadedFile()`
- PDF binary response: `StreamableFile` or `@Res()` passthrough

#### OpenAPI / Swagger
- `@nestjs/swagger` + `SwaggerModule.setup()`
- Zod → OpenAPI via `@anatine/zod-nestjs` or `nestjs-zod`
- Generate spec JSON for S6 client generation

#### Composition root replacement
- Delete `api/src/container.ts`
- All providers in NestJS modules: repositories as `{ provide: DI.X.Y, useClass: PostgresXRepository }`
- Use cases as simple providers (thanks to S3's `@Injectable()`)
- Delete all 54 route class files from `api/src/routes/`
- Delete `api/src/middleware/auth.ts`
- Remove `elysia` from `api/package.json`
- Remove `@needle-di/core` from `api/package.json`

### Exit criteria
- `turbo run typecheck test` passes
- E2E tests pass against new NestJS server
- API response shapes identical (same `{ data }` / `{ error }` envelope)
- Auth flow works (login → token → protected routes)
- File upload works (`/factory/extract-text`)
- PDF generation works (`/resume/pdf`)
- OpenAPI spec generated and accessible

---

## S6: Web API Client Replacement

**Branch:** `refactor/api-client`
**Effort:** 2-3 days

### Tasks
- Add `orval` as devDependency in `web/`
- Create `orval.config.ts` pointing at NestJS OpenAPI spec
- Configure to generate TanStack Query v5 hooks
- Run initial generation, review output
- Delete `web/src/lib/api.ts` (Eden Treaty)
- Delete `web/src/lib/api-error.ts` (EdenRouteSegment workaround)
- Remove `@elysiajs/eden` from `web/package.json`
- Remove `@tailoredin/api` workspace dep from `web/package.json`
- Update 11 query hook files to use generated client
- Update error handling (no more `data?.data` double-unwrap)
- Configure auth header injection in generated client

### Exit criteria
- `turbo run typecheck` passes
- E2E tests pass
- No `@elysiajs/eden` imports remain
- Manual smoke test of key flows

---

## S7: Env Redesign + Scripts + CI + Cleanup

**Branch:** `refactor/env-scripts`
**Effort:** 4-5 days

### Tasks

#### Delete worktree system (10 files)
- `infrastructure/scripts/wt-up.ts`, `wt-down.ts`, `wt-migration-up.ts`, `wt-seed.ts`
- `infrastructure/scripts/WorktreeSession.ts`, `DevContext.ts`, `ContextGuard.ts`, `guard-main.ts`, `DatabaseClone.ts`
- `.env.wt`
- All `wt:*` scripts from root package.json

#### Create unified dev scripts (Node, profile-aware)
- `infrastructure/scripts/ports.ts` — deterministic port allocation from branch name hash
- Rewrite `dev-up.ts`:
  - `--profile local|production` (default: local)
  - local: detect branch → compute ports → generate `.env.local` → Docker → migrate → seed → servers
  - production: read `.env.production` → validate → servers (no Docker)
  - Write `.dev-state.json` (pids, ports, profile, branch)
- Rewrite `dev-down.ts`:
  - Read `.dev-state.json`, kill by PID
  - local: stop Docker, `--clean` removes volume
- Rewrite `DockerCompose.ts` — remove worktree hacks
- All scripts use `node:child_process`, `node:fs/promises`, `#!/usr/bin/env tsx`

#### Env templates
- Update `.env.example` (add `APP_PROFILE`)
- Create `.env.production.example`
- Update `.gitignore` (`.env.local`, `.env.production`, `.dev-state.json`)

#### Remaining scripts
- Diagram scripts: update shebangs to `#!/usr/bin/env tsx`
- E2E `e2e-start-servers.ts`: update for NestJS entry, remove `BUN_CONFIG_NO_DOT_ENV`
- `BunInstall.ts` → `PnpmInstall.ts`

#### Root package.json
- All `bun run` → `pnpm run` / `tsx`
- All `bun run --parallel` → `turbo run`
- All `bunx` → `pnpm exec`
- Remove `wt:*` scripts, remove guard-main prefixes

#### CI pipeline
- Replace `setup-bun` action with `setup-node` + `setup-pnpm`
- Pin Node 22 LTS
- `pnpm install --frozen-lockfile`
- `turbo run` for parallel jobs
- `pnpm exec playwright install`

#### Final cleanup
- Verify no `bun-types` remain
- Update `.mise.toml` (remove Bun, keep Node + Typst)
- Delete remaining `bunfig.toml` files
- Update `core/src/Environment.ts` comment
- `knip` — verify no dead exports
- `dep:check` — verify boundaries
- Regenerate diagrams
- Update `CLAUDE.md`, `CONVENTIONS.md`, per-package CLAUDE.md files

### Exit criteria
- All quality checks pass
- `dev:up` works from `main` (ports 5432/8000/5173)
- `dev:up` works from a feature branch (different ports, separate Docker container)
- `dev:up --profile production` works with `.env.production`
- `dev:down --clean` destroys volume
- E2E tests pass
- Zero references to Bun, Needle DI, Elysia, Eden, WorktreeSession, wt:*

---

## Decision Log

| Decision | Rationale |
|----------|-----------|
| NestJS | Module system and DI align with existing Onion Architecture |
| Jest | NestJS ecosystem standard; `@nestjs/testing` integration |
| Zod (not class-validator) | Already a project dependency; no decorator boilerplate; discriminated unions |
| pnpm + Turborepo | Fast installs, strict dep isolation, lightweight task caching |
| `@Injectable()` on use cases | Eliminates ~50 `useFactory` bindings |
| `@nestjs/config` + Zod | Fail-fast on bad env vars; typed ConfigService |
| Profile-based env | Replaces broken `dev:*`/`wt:*` split; one `dev:up` for any branch |
| Deterministic ports from branch name | No session files, no manual allocation |
| `orval` (not manual fetch) | Generates TanStack Query hooks from OpenAPI spec |
| `@swc/jest` (not ts-jest) | Faster transforms for 96 test files |
| argon2 (not bcrypt) | Replaces Bun.password; modern, fast, recommended by OWASP |
| Biome stays | Runtime-agnostic Rust binary; zero migration needed |
