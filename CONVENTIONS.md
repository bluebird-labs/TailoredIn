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
