# CONVENTIONS.md

Coding conventions for the TailoredIn codebase. All contributors (human and AI) must follow these rules. Biome enforces what it can; the rest is manual discipline.

## OOP-First Design

All code is class-based. No `{}` object literals with class-like behavior.

- Static-only utility classes use `namespace` (e.g., `EnumUtil`, `TimeUtil`, `StringUtil` in `core/src/`)
- All class members must have **explicit visibility** (`public`, `private`, `protected`) — enforced by Biome's `useConsistentMemberAccessibility`
- No `any` — enforced by Biome's `noExplicitAny`. Exceptions require a `biome-ignore` comment with a reason and must be approved

## Dependency Injection

Every external dependency (database, HTTP, file system, LLM, environment variables) must be **injected**, never accessed directly in business logic.

| Layer | DI approach |
|---|---|
| `domain/` | No DI framework. No external dependencies. Pure domain logic |
| `application/` | Plain classes with explicit constructor parameters. No `@injectable()`, no `inject()` |
| `infrastructure/` | `@injectable()` + `inject()` from `@needle-di/core` |
| `api/`, `cli/` | Composition roots. Wire everything. `@injectable()` allowed on route classes |

Use cases are plain classes — bound in composition roots via `useFactory`:
```typescript
container.bind({
  provide: DI.Job.GetTopJob,
  useFactory: () => new GetTopJob(container.get(DI.Job.Repository))
});
```

## No Side Effects

- **No direct `process.env` access** outside composition roots and `core/src/Environment.ts`
  - `core/src/Logger.ts` is the one allowed exception (bootstrap-time circular dependency with `Environment`)
  - Config values (DB connection, API keys, feature flags) must be injected via DI tokens or factory function parameters
- **No direct file system calls, API calls, or I/O** outside the infrastructure layer
- All I/O goes through injected ports so it can be stubbed in tests

## Onion Architecture

Strict inward dependency rule:

```
api/cli → infrastructure → application → domain → core
```

- Enforced by `dependency-cruiser` — run `bun run dep:check`
- DI framework decorators (`@injectable()`, `inject()`) only in `infrastructure/` and composition roots (`api/`, `cli/`)
- Domain and application layers must remain framework-agnostic

## Domain Layer

- Entities extend `AggregateRoot<TId>` or `Entity<TId>`
- ID value objects: `<Entity>Id extends ValueObject`, with `static generate()` factory
- Enums for domain concepts (`JobStatus`, `Archetype`, `SkillAffinity`)
- Repository ports: **interfaces** in `domain/src/ports/`, with domain-focused methods (not generic CRUD)
- Domain events implement the `DomainEvent` interface

## Application Layer

- **Use cases**: plain classes, single `async execute(input): Promise<T>` method
- Input types named `<UseCase>Input` (e.g., `GetTopJobInput`)
- Return `Result<T, Error>` for expected failures; throw for unexpected/critical errors
- **Ports**: interfaces in `application/src/ports/` for external service adapters
- **DTOs**: plain `type` aliases (not classes), named `<Concept>Dto`

## Infrastructure Layer

- **Services**: `@injectable()` classes implementing application ports
- **ORM entities**: separate from domain entities in `infrastructure/src/db/entities/`, mapped in repository implementations
- **Repository implementations**: `Postgres<Entity>Repository`, handle ORM ↔ domain mapping
- **DI tokens**: namespaced in `infrastructure/src/DI.ts` as `DI.Job.*`, `DI.Resume.*`

## API Layer

- Each route is its own `@injectable()` class — **one file per route**
- File naming: `<VerbNounRoute>.ts` (e.g., `GetTopJobRoute.ts`, `ChangeJobStatusRoute.ts`)
- Each class has a `plugin()` method returning an Elysia instance
- Composition root resolves routes: `container.get(RouteClass).plugin()`

## API Conventions

All HTTP endpoints follow these conventions. Inspired by Stripe and GitHub API design.

### Response Envelope

Every response uses one of two shapes:

**Success:**
```typescript
{
  data: T,
  pagination?: {
    limit: number,
    offset: number,
    total: number,
    hasNext: boolean
  }
}
```

**Error:**
```typescript
{
  error: {
    code: string,
    message: string
  }
}
```

- `data` contains the resource directly — a single object or an array, never wrapped in an extra key
- `pagination` is present only on paginated list endpoints
- HTTP status codes carry the success/failure signal — no redundant booleans
- `error.code` is a machine-readable string (e.g., `"NOT_FOUND"`, `"INVALID_URL"`, `"SCRAPE_FAILED"`)
- `error.message` is a human-readable explanation

### HTTP Status Codes

| Status | Usage |
|---|---|
| `200` | Successful GET, PUT/PATCH that returns data |
| `201` | Successful POST that creates a resource |
| `204` | Successful DELETE or mutation with no response body |
| `400` | Validation failure, malformed request |
| `404` | Resource not found |
| `422` | Request is well-formed but semantically invalid (e.g., invalid LinkedIn URL) |
| `500` | Unexpected server error — return generic message, never leak internals |
| `502` | Upstream/external service failure |

### Pagination

List endpoints use **limit/offset** pagination:

| Param | Type | Default | Constraint |
|---|---|---|---|
| `limit` | `number` | `25` | `1 ≤ limit ≤ 100` |
| `offset` | `number` | `0` | `≥ 0` |

Response includes `pagination` with `total` (full count of matching records) and `hasNext` (convenience boolean: `offset + limit < total`).

### Sorting

A single `sort` query parameter with comma-separated fields. Each field has an optional `:asc` or `:desc` suffix. Default direction is ascending.

```
GET /jobs?sort=score:desc,posted_at
```

Each route defines its own set of allowed sort fields. Unknown fields are ignored or return `400`.

### Filtering

- Query parameter names use **snake_case** matching the field name (e.g., `target_salary`, `business_type`)
- Array values use repeated params: `?status=NEW&status=APPLIED`
- Elysia's `t.Union([t.Array(...), t.Enum(...)])` pattern handles both single and array values
- Enum-based filters use the domain enum values directly

### Query Parameter Casing

All query parameters use **snake_case** — no camelCase, no kebab-case.

## File & Import Conventions

- **PascalCase** for all class/entity/route files
- **`.js` extensions** on all relative imports (NodeNext module resolution)
- **`import type`** for type-only imports
- **Barrel imports** from layer packages (`@tailoredin/domain`, `@tailoredin/application`)
- **Sub-barrels** in application: `dtos/index.ts`, `ports/index.ts`, `use-cases/index.ts`

## Error Handling

- `Result<T, E>` for expected domain failures in use cases
- Repository methods throw on critical failures (`findByIdOrFail`)
- Route handlers map `Result` errors to HTTP status codes

## Logging

- Create loggers via `Logger.create(this)` in classes (derives kebab-case prefix from class name) or `Logger.create('name')` for standalone scripts
- All logger prefixes are normalized to kebab-case

## Biome Enforcement

Biome handles formatting and linting. Key rules:

| Rule | Setting | Notes |
|---|---|---|
| `noExplicitAny` | `error` | Requires `biome-ignore` with reason for exceptions |
| `useConsistentMemberAccessibility` | `error` (explicit) | All class members need visibility modifiers |
| `noConsole` | `error` | Use `Logger` instead |
| `useNamingConvention` | `error` | PascalCase classes, camelCase members, CONSTANT_CASE enums |
| `noStaticOnlyClass` | `off` | We use `namespace` for static utilities instead |
