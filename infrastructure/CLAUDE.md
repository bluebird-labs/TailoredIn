# infrastructure/ — Implementations, ORM, Services, DI

Package: `@tailoredin/infrastructure`

Concrete implementations of all application ports: database repositories. Also owns DI tokens and the database schema.

## Keeping the diagram in sync

**`infrastructure/DATABASE.mmd` is the source of truth for the database schema.** After adding migrations or modifying entities, regenerate with `bun run db:diagram` (requires DB running). The diagram must always reflect the schema.

## Directory structure

```
infrastructure/src/
├── db/
│   ├── migrations/      ← Timestamped MikroORM migrations
│   ├── seeds/           ← DatabaseSeeder + E2eSeeder
│   └── orm-config.ts    ← MikroORM config (imports entities from @tailoredin/domain)
├── repositories/        ← Postgres<Entity>Repository implementations
├── services/            ← External service adapters (LLM, etc.)
├── DI.ts                ← All DI tokens
└── index.ts
```

## Entities

Domain entities in `domain/src/entities/` carry MikroORM decorators directly — there is no separate ORM entity layer. The `orm-config.ts` imports all entities from `@tailoredin/domain`.

## Repository pattern

`Postgres<Entity>Repository` — thin wrappers around `EntityManager`. One file per aggregate root:

```typescript
@injectable()
export class PostgresExperienceRepository implements ExperienceRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByIdOrFail(id: string): Promise<Experience> {
    return this.orm.em.findOneOrFail(Experience, { id } as any, { populate: ['accomplishments'] });
  }

  public async save(experience: Experience): Promise<void> {
    this.orm.em.persist(experience);
    await this.orm.em.flush();
  }
}
```

No `toDomain()`/`toORM()` mapping — entities are used directly.

## DI tokens

All tokens live in `infrastructure/src/DI.ts`, namespaced hierarchically:

```typescript
export const DI = {
  Orm: {
    EntityManager: new InjectionToken<EntityManager>('EntityManager'),
  },
  Profile: { ... },
  Education: { ... },
  Experience: { ... },
  Company: { ... },
};
```

## Adding a new service (full workflow)

1. Add a port interface to `application/src/ports/<ServiceName>.ts`
2. Add it to `application/src/ports/index.ts`
3. Create the implementation in `infrastructure/src/services/<ServiceName>.ts` with `@injectable()`
4. Add a DI token to `infrastructure/src/DI.ts`
5. Bind in `api/src/container.ts`:
   ```typescript
   container.bind({ provide: DI.MyDomain.MyService, useClass: MyServiceImpl });
   ```

## Migrations

Timestamped filenames: `YYYYMMDD_description.ts`. Use Kysely DSL:

```typescript
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.createTable('company_brief') ...
}
export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('company_brief').execute();
}
```

Run: `bun dev:migration:up` (main branch) or `bun wt:migration:up` (worktree)

## Seeders

`DatabaseSeeder` orchestrates per-domain seeders:
- `ResumeDataSeeder` — profile, experience, accomplishments, education, companies
- `E2eSeeder` — minimal data for E2E tests

Run: `bun run db:seed`

## LLM prompt logging

Every LLM call made through `BaseLlmApiProvider` is logged to `logs/llm/` (gitignored). Each log is a Markdown file named `{timestamp}_{RequestClassName}.md` containing four sections: **Input** (structured input data as JSON), **Output Schema** (the Zod schema as JSON Schema), **Prompt** (full rendered prompt text), and **Response** (parsed JSON on success, or error + raw response on failure).

When adding a new `LlmJsonRequest` subclass, override `getInput()` to expose the structured input data for logging. The default returns `undefined` (shown as "No structured input available").

## Integration tests

Run against a real PostgreSQL instance via Testcontainers:

```bash
bun run --cwd infrastructure test:integration
```

Tests live in `infrastructure/test-integration/`. 60 s timeout per test.
